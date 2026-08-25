import asyncio
import time

from fastapi import HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.application import tool_service
from app.application.rag_retrieval_service import RagRetrievalService
from app.application.structured_completion import complete_structured
from app.domain.orchestrator.context_builder import build_context
from app.domain.orchestrator.history_turn import HistoryTurn
from app.domain.orchestrator.prompts import ASK_SYSTEM_PROMPT, TOOL_SELECTION_SYSTEM
from app.domain.orchestrator.tool_selection import build_tool_selection_prompt
from app.domain.rag.retrieved_chunk import RetrievedChunk
from app.domain.shared.errors import error_message
from app.domain.shared.llm_json import parse_json_object
from app.infrastructure.config import get_settings
from app.infrastructure.logging import get_logger
from app.infrastructure.providers.llm.base import AiModelProvider
from app.infrastructure.providers.embedding.base import EmbeddingProvider
from app.schemas.ask import AskRequest, AskResponse
from app.schemas.base import CamelModel
from app.schemas.orchestrator import OrchestratorContext

logger = get_logger(__name__)

_RAG_TOP_K = 3

# name -> (tool_service function, human-readable label for `sources`)
_TOOL_CALLS = {
    "application": (tool_service.get_application, "Application data"),
    "candidate_analysis": (tool_service.get_candidate_analysis, "Candidate analysis"),
    "interview": (tool_service.get_interview, "Interview data"),
}
_DEFAULT_TOOLS = ["application"]


class _ParsedAnswer(BaseModel):
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)


class _ToolSelection(CamelModel):
    tools: list[str] = Field(default_factory=list)
    # Defaults True — same "never worse than the old fixed rule" fallback
    # discipline as _DEFAULT_TOOLS: a failed/unparseable classification call
    # falls back to running RAG, not skipping it.
    needs_knowledge: bool = True


# One LLM classification call (_select_tools) always runs first, deciding
# both which of an application's data sources (application/
# candidate_analysis/interview — empty when there's no applicationId, so
# nothing to fetch) to pull AND whether RAG/knowledge retrieval is relevant
# at all — a Tool-only question (e.g. "what's this application's status?")
# skips RAG's embed call + DB queries entirely, and a purely conversational
# message with no applicationId skips it too, instead of RAG always running
# unconditionally the way it used to whenever there was no page context.
# Runs on a possibly-smaller/faster model (AI_CLASSIFICATION_MODEL) since
# it's a much simpler decision than the final answer — see
# infrastructure/config.py. Not yet a full "Live Data Question vs.
# Knowledge Question vs. Pure Conversation" classifier (that would also
# decide whether to skip the final LLM call itself for something trivial),
# but a real per-question decision, not a fixed rule pretending to be one.
class OrchestratorService:
    def __init__(
        self,
        rag_db: AsyncSession,
        provider: AiModelProvider,
        embedding_provider: EmbeddingProvider,
    ) -> None:
        self._rag_db = rag_db
        self._provider = provider
        self._embedding_provider = embedding_provider

    async def ask(
        self, context: OrchestratorContext, bearer_token: str, request: AskRequest
    ) -> AskResponse:
        return await self.generate(context, bearer_token, request.question, request.application_id)

    # Returns (selected tool names, whether RAG/knowledge retrieval is
    # needed). available_tools is empty when there's no applicationId —
    # this still runs (to decide needs_knowledge), it just has nothing to
    # pick a tool from. default_tools only ever includes "application" when
    # there was something to fall back to in the first place — falling back
    # to ["application"] with no applicationId to fetch it against would be
    # a meaningless recommendation, not a safe default.
    async def _select_tools(self, question: str, available_tools: list[str]) -> tuple[list[str], bool]:
        default_tools = _DEFAULT_TOOLS if available_tools else []
        try:
            prompt = build_tool_selection_prompt(question, available_tools)
            raw = await self._provider.complete(
                TOOL_SELECTION_SYSTEM,
                prompt,
                json_schema=_ToolSelection.model_json_schema(),
                model=get_settings().ai_classification_model,
            )
            parsed = parse_json_object(raw, _ToolSelection)
            if parsed is None:
                return default_tools, True
            selected = [name for name in parsed.tools if name in available_tools]
            return selected or default_tools, parsed.needs_knowledge
        except Exception as exc:  # noqa: BLE001 - never worse than always running RAG
            logger.warning("Tool/knowledge classification failed, falling back to default: %s", error_message(exc))
            return default_tools, True

    async def _fetch_tool(self, name: str, application_id: str, bearer_token: str) -> dict | None:
        fetch, label = _TOOL_CALLS[name]
        try:
            result = await fetch(application_id, bearer_token)
            return result.model_dump(by_alias=True)
        except HTTPException as exc:
            # Denied/not-found isn't a reason to fail the whole question —
            # answer without this one source rather than 403/404ing the
            # entire ask just because one optional live-data lookup didn't
            # pan out.
            logger.info(
                "%s lookup for application %s failed (%s), answering without it",
                label,
                application_id,
                exc.status_code,
            )
            return None
        except Exception as exc:  # noqa: BLE001 - one tool failing must not fail the whole request
            # A Tool response that doesn't match its declared schema — a
            # remotesea-api response-shape drift, or any other unexpected
            # failure — must degrade the same way a 403/404 does: skip this
            # one source, don't fail the whole question. Found by a real
            # instance of this (CandidateAnalysisToolResult previously
            # required a field remotesea-api never actually returns, which
            # raised ValidationError here and 502'd the entire request).
            logger.warning(
                "%s lookup for application %s raised %s, answering without it: %s",
                label,
                application_id,
                type(exc).__name__,
                error_message(exc),
            )
            return None

    async def _retrieve_rag_chunks(self, question: str) -> list[RetrievedChunk]:
        retrieval = RagRetrievalService(self._rag_db, self._embedding_provider)
        return await retrieval.retrieve(question, top_k=_RAG_TOP_K)

    # Shared by ask() (one-shot, no persistence, no history) and
    # ChatService.send_message() (persisted turns, prior turns fed back in
    # as history) — both are "gather live data + knowledge, build one
    # bounded prompt, call the LLM, parse the result" with the same rules;
    # only what happens before/after differs.
    async def generate(
        self,
        context: OrchestratorContext,
        bearer_token: str,
        question: str,
        application_id: str | None,
        history: list[HistoryTurn] | None = None,
        related_turns: list[HistoryTurn] | None = None,
    ) -> AskResponse:
        sources: list[str] = []
        application_data: dict | None = None
        started_at = time.monotonic()

        available_tools = list(_TOOL_CALLS) if application_id else []
        selected_tools, needs_knowledge = await self._select_tools(question, available_tools)

        # RAG retrieval and the LLM call are both external dependencies
        # (RAG DB, Ollama) that can fail transiently — unlike the Tool calls
        # below, there's no sensible way to "answer without" a failed LLM
        # call, so this is caught and converted into a clean RuntimeError
        # (the API layer maps that to a 502, same as inference_service's
        # equivalent path) instead of surfacing as an unhandled 500. This
        # was a real gap found by code review: previously nothing here
        # caught these failures at all.
        try:
            if application_id:
                tool_fetches = asyncio.gather(
                    *(self._fetch_tool(name, application_id, bearer_token) for name in selected_tools)
                )
                # Tool fetches and RAG retrieval are independent — run them
                # concurrently rather than the old sequential "tools, then
                # RAG" order, and skip RAG's embed call + DB queries
                # entirely when the classification step decided this
                # question doesn't need general knowledge at all.
                if needs_knowledge:
                    fetched, rag_chunks = await asyncio.gather(
                        tool_fetches, self._retrieve_rag_chunks(question)
                    )
                else:
                    fetched = await tool_fetches
                    rag_chunks = []

                application_data = {}
                for name, data in zip(selected_tools, fetched):
                    if data is not None:
                        application_data[name] = data
                        _, label = _TOOL_CALLS[name]
                        sources.append(f"{label}: {application_id}")
                if not application_data:
                    application_data = None
            elif needs_knowledge:
                rag_chunks = await self._retrieve_rag_chunks(question)
            else:
                rag_chunks = []

            sources += [f"Knowledge: {chunk.document_title}" for chunk in rag_chunks]

            prompt = build_context(context, question, application_data, rag_chunks, history, related_turns)
            # complete_structured retries once on an unparseable response
            # before falling through to the raw-text fallback below.
            raw, parsed, attempts = await complete_structured(
                self._provider, _ParsedAnswer, ASK_SYSTEM_PROMPT, prompt
            )
        except Exception as exc:  # noqa: BLE001 - converted to a clean 502 below
            message = error_message(exc)
            logger.warning(
                "orchestrator_generate outcome=error elapsed_ms=%d tools=%s needs_knowledge=%s error=%s",
                int((time.monotonic() - started_at) * 1000),
                selected_tools,
                needs_knowledge,
                message,
            )
            raise RuntimeError(message) from exc

        # One structured line per request — everything priority 9 asks for
        # (latency, tool/RAG usage, retry-driven model calls, outcome) in a
        # single grep-able record, since neither /ask nor /chat persisted
        # any of this before (unlike /v1/inference's AiInteraction row).
        logger.info(
            "orchestrator_generate outcome=%s elapsed_ms=%d tools=%s needs_knowledge=%s "
            "rag_chunks=%d llm_attempts=%d",
            "success" if parsed is not None else "unparsed",
            int((time.monotonic() - started_at) * 1000),
            selected_tools,
            needs_knowledge,
            len(rag_chunks),
            attempts,
        )

        if parsed is None:
            # Same "never silently drop the model's output" principle as
            # inference_service — an unparseable response still becomes an
            # answer (the raw text), just flagged with zero confidence
            # rather than surfaced as an opaque 500.
            return AskResponse(answer=raw.strip(), confidence=0.0, sources=sources)

        return AskResponse(answer=parsed.answer, confidence=parsed.confidence, sources=sources)
