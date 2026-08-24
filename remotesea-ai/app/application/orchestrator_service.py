from fastapi import HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.application import tool_service
from app.application.rag_retrieval_service import RagRetrievalService
from app.domain.orchestrator.context_builder import build_context
from app.domain.orchestrator.history_turn import HistoryTurn
from app.domain.orchestrator.prompts import ASK_SYSTEM_PROMPT
from app.domain.shared.errors import error_message
from app.domain.shared.llm_json import parse_json_object
from app.infrastructure.logging import get_logger
from app.infrastructure.providers.llm.base import AiModelProvider
from app.infrastructure.providers.embedding.base import EmbeddingProvider
from app.schemas.ask import AskRequest, AskResponse
from app.schemas.orchestrator import OrchestratorContext

logger = get_logger(__name__)

_RAG_TOP_K = 3


class _ParsedAnswer(BaseModel):
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)


# The routing rule for this foundation is deliberately simple, not an
# LLM-driven intent classifier: an application_id in the request means "pull
# that application's live data" (a Tool call), and RAG retrieval always runs
# against the question text (cheap, and grounds even a pure knowledge
# question). This covers the doc's "Knowledge Question" and "Complex
# Question" routing categories honestly; a real "Live Data Question vs.
# Knowledge Question vs. Pure Conversation" classifier is follow-up work,
# not silently faked here as something smarter than it is.
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
    ) -> AskResponse:
        sources: list[str] = []
        application_data: dict | None = None

        if application_id:
            try:
                result = await tool_service.get_application(application_id, bearer_token)
                application_data = result.model_dump(by_alias=True)
                sources.append(f"Application data: {application_id}")
            except HTTPException as exc:
                # Denied/not-found isn't a reason to fail the whole question —
                # answer from RAG alone rather than 403/404ing the entire ask
                # just because the optional live-data lookup didn't pan out.
                logger.info(
                    "Tool lookup for application %s failed (%s), answering without it",
                    application_id,
                    exc.status_code,
                )

        # RAG retrieval and the LLM call are both external dependencies
        # (RAG DB, Ollama) that can fail transiently — unlike the Tool call
        # above, there's no sensible way to "answer without" a failed LLM
        # call, so this is caught and converted into a clean RuntimeError
        # (the API layer maps that to a 502, same as inference_service's
        # equivalent path) instead of surfacing as an unhandled 500. This
        # was a real gap found by code review: previously nothing here
        # caught these failures at all.
        try:
            retrieval = RagRetrievalService(self._rag_db, self._embedding_provider)
            rag_chunks = await retrieval.retrieve(question, top_k=_RAG_TOP_K)
            sources += [f"Knowledge: {chunk.document_title}" for chunk in rag_chunks]

            prompt = build_context(context, question, application_data, rag_chunks, history)
            raw = await self._provider.complete(ASK_SYSTEM_PROMPT, prompt)
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
