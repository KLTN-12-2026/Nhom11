import asyncio

from fastapi import HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.application import tool_service
from app.application.rag_retrieval_service import RagRetrievalService
from app.domain.orchestrator.context_builder import build_context
from app.domain.orchestrator.history_turn import HistoryTurn
from app.domain.orchestrator.prompts import ASK_SYSTEM_PROMPT, TOOL_SELECTION_SYSTEM
from app.domain.orchestrator.tool_selection import build_tool_selection_prompt
from app.domain.rag.retrieved_chunk import RetrievedChunk
from app.domain.shared.errors import error_message
from app.domain.shared.llm_json import parse_json_object
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


# Without an application_id, RAG always runs against the question text —
# there's no page context to classify against, so there's nothing else to
# decide. With one, a single LLM classification call (_select_tools)
# decides both which of that application's data sources (application/
# candidate_analysis/interview) to fetch AND whether RAG/knowledge
# retrieval is relevant at all — a Tool-only question (e.g. "what's this
# application's status?") now skips RAG's embed call + DB queries entirely
# instead of always paying for it alongside the Tool fetch. Not yet a full
# "Live Data Question vs. Knowledge Question vs. Pure Conversation"
# classifier (that would also decide whether to skip the LLM call itself
# for something trivial), but a real per-question decision, not a fixed
# rule pretending to be one.
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
    # needed) — one classification call now decides both, instead of a
    # separate round-trip for each, and RAG no longer runs unconditionally
    # alongside a Tool-only question.
    async def _select_tools(self, question: str) -> tuple[list[str], bool]:
        try:
            prompt = build_tool_selection_prompt(question, list(_TOOL_CALLS))
            raw = await self._provider.complete(
                TOOL_SELECTION_SYSTEM, prompt, json_schema=_ToolSelection.model_json_schema()
            )
            parsed = parse_json_object(raw, _ToolSelection)
            if parsed is None:
                return _DEFAULT_TOOLS, True
            selected = [name for name in parsed.tools if name in _TOOL_CALLS]
            return selected or _DEFAULT_TOOLS, parsed.needs_knowledge
        except Exception as exc:  # noqa: BLE001 - never worse than the old fixed rule
            logger.warning("Tool selection failed, falling back to default: %s", error_message(exc))
            return _DEFAULT_TOOLS, True

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
        selected_tools: list[str] = []
        needs_knowledge = True

        if application_id:
            selected_tools, needs_knowledge = await self._select_tools(question)

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
            else:
                rag_chunks = await self._retrieve_rag_chunks(question)

            sources += [f"Knowledge: {chunk.document_title}" for chunk in rag_chunks]

            prompt = build_context(context, question, application_data, rag_chunks, history, related_turns)
            raw = await self._provider.complete(
                ASK_SYSTEM_PROMPT, prompt, json_schema=_ParsedAnswer.model_json_schema()
            )
        except Exception as exc:  # noqa: BLE001 - converted to a clean 502 below
            message = error_message(exc)
            logger.warning("Orchestrator generation failed: %s", message)
            raise RuntimeError(message) from exc

        parsed = parse_json_object(raw, _ParsedAnswer)
        if parsed is None:
            # Same "never silently drop the model's output" principle as
            # inference_service — an unparseable response still becomes an
            # answer (the raw text), just flagged with zero confidence
            # rather than surfaced as an opaque 500.
            return AskResponse(answer=raw.strip(), confidence=0.0, sources=sources)

        return AskResponse(answer=parsed.answer, confidence=parsed.confidence, sources=sources)
