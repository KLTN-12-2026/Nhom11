import json

from fastapi import HTTPException
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.providers.base import AiModelProvider
from app.providers.embedding_base import EmbeddingProvider
from app.schemas.ask import AskRequest, AskResponse
from app.schemas.orchestrator import OrchestratorContext
from app.services import tool_service
from app.services.context_builder import ASK_SYSTEM_PROMPT, HistoryTurn, build_context
from app.services.rag_retrieval_service import RagRetrievalService

logger = get_logger(__name__)

_RAG_TOP_K = 3


class _ParsedAnswer(BaseModel):
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)


def _parse_answer(raw: str) -> _ParsedAnswer | None:
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1 or end < start:
        return None
    try:
        return _ParsedAnswer.model_validate(json.loads(raw[start : end + 1]))
    except (json.JSONDecodeError, ValidationError):
        return None


# The routing rule for Phase 4's foundation is deliberately simple, not an
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

        retrieval = RagRetrievalService(self._rag_db, self._embedding_provider)
        rag_chunks = await retrieval.retrieve(question, top_k=_RAG_TOP_K)
        sources += [f"Knowledge: {chunk.document_title}" for chunk in rag_chunks]

        prompt = build_context(context, question, application_data, rag_chunks, history)
        raw = await self._provider.complete(ASK_SYSTEM_PROMPT, prompt)
        parsed = _parse_answer(raw)

        if parsed is None:
            # Same "never silently drop the model's output" principle as
            # inference_service — an unparseable response still becomes an
            # answer (the raw text), just flagged with zero confidence
            # rather than surfaced as an opaque 500.
            return AskResponse(answer=raw.strip(), confidence=0.0, sources=sources)

        return AskResponse(answer=parsed.answer, confidence=parsed.confidence, sources=sources)
