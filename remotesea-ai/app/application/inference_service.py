import asyncio
import time
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.historical_case_service import HistoricalCaseService
from app.application.rag_retrieval_service import RagRetrievalService
from app.domain.candidate_analysis.historical_case import HistoricalCase
from app.domain.candidate_analysis.prompt_builder import build_candidate_analysis_prompt
from app.domain.candidate_analysis.prompts import CANDIDATE_ANALYSIS_SYSTEM
from app.domain.rag.retrieved_chunk import RetrievedChunk
from app.domain.shared.errors import error_message
from app.domain.shared.llm_json import parse_json_object
from app.infrastructure.logging import get_logger
from app.infrastructure.models.ai_interaction import AiInteraction, AiInteractionStatus, AiTask
from app.infrastructure.providers.embedding.base import EmbeddingProvider
from app.infrastructure.providers.llm.base import AiModelProvider
from app.schemas.inference import (
    CandidateAnalysisResult,
    InferenceMetadata,
    InferenceRequest,
    InferenceResponse,
)

logger = get_logger(__name__)

_RAG_TOP_K = 2
_HISTORICAL_CASE_LIMIT = 3


class InferenceService:
    # rag_db/embedding_provider are optional — CANDIDATE_ANALYSIS works
    # without them (no RAG/history sections), so a caller that doesn't need
    # the enrichment (e.g. a future task type) isn't forced to wire up the
    # RAG database too. When omitted, retrieval is skipped entirely rather
    # than erroring.
    def __init__(
        self,
        db: AsyncSession,
        provider: AiModelProvider,
        rag_db: AsyncSession | None = None,
        embedding_provider: EmbeddingProvider | None = None,
    ) -> None:
        self._db = db
        self._provider = provider
        self._rag_db = rag_db
        self._embedding_provider = embedding_provider

    async def _retrieve_rag_chunks(self, query: str) -> list[RetrievedChunk]:
        if self._rag_db is None or self._embedding_provider is None:
            return []
        try:
            retrieval = RagRetrievalService(self._rag_db, self._embedding_provider)
            return await retrieval.retrieve(query, top_k=_RAG_TOP_K)
        except Exception as exc:  # noqa: BLE001 - grounding is best-effort
            # A RAG DB hiccup or embedding-service timeout must not fail the
            # whole CANDIDATE_ANALYSIS call — the analysis still runs, just
            # without RAG grounding. This is the fix for a real bug found by
            # code review: previously this call ran *before* the run()
            # try/except below, so a failure here produced an unhandled 500
            # with no AiInteraction row persisted at all.
            logger.warning("RAG retrieval failed, continuing without it: %s", error_message(exc))
            return []

    async def _find_historical_cases(self, job_title: str) -> list[HistoricalCase]:
        try:
            return await HistoricalCaseService(self._db).find_similar(
                job_title, limit=_HISTORICAL_CASE_LIMIT
            )
        except Exception as exc:  # noqa: BLE001 - grounding is best-effort
            logger.warning(
                "Historical case lookup failed, continuing without it: %s", error_message(exc)
            )
            return []

    async def run(self, request: InferenceRequest) -> InferenceResponse:
        if request.task != AiTask.CANDIDATE_ANALYSIS:
            # Every other AiTask is a real, named value in the enum (see the
            # README's task list) but has no prompt/parser yet — surfaced as
            # a clean 501 at the API layer rather than silently 200-ing with
            # nothing, or crashing on a missing branch.
            raise NotImplementedError(
                f"Task {request.task.value} is not implemented yet"
            )

        job = request.context.job
        query = f"{job.title} {job.level or ''} {job.requirements or job.description}"

        # Independent calls to two different databases — run concurrently
        # rather than back-to-back (previously sequential; each now pays
        # only the slower of the two round trips, not both added together).
        rag_chunks, historical_cases = await asyncio.gather(
            self._retrieve_rag_chunks(query),
            self._find_historical_cases(job.title),
        )

        retrieved_context: dict | None = None
        if rag_chunks or historical_cases:
            retrieved_context = {
                "ragChunkIds": [c.chunk_id for c in rag_chunks],
                "historicalCaseCount": len(historical_cases),
            }

        started_at = time.monotonic()
        raw_output: str | None = None
        try:
            prompt = build_candidate_analysis_prompt(request.context, rag_chunks, historical_cases)
            raw_output = await self._provider.complete(CANDIDATE_ANALYSIS_SYSTEM, prompt)
            parsed = parse_json_object(raw_output, CandidateAnalysisResult)
            if parsed is None:
                raise ValueError("Model returned an unparseable response")
            status = AiInteractionStatus.SUCCESS
            error: str | None = None
        except Exception as exc:  # noqa: BLE001 - persisted below either way
            message = error_message(exc)
            logger.warning("CANDIDATE_ANALYSIS inference failed: %s", message)
            parsed = None
            status = AiInteractionStatus.FAILED
            error = message

        latency_ms = int((time.monotonic() - started_at) * 1000)
        interaction = AiInteraction(
            id=str(uuid.uuid4()),
            task=request.task,
            user_id=request.user_id,
            application_id=request.application_id,
            input=request.context.model_dump(by_alias=True),
            retrieved_context=retrieved_context,
            output=parsed.model_dump(by_alias=True) if parsed else None,
            model_version=self._provider.model_version,
            latency_ms=latency_ms,
            status=status,
            error=error,
        )
        self._db.add(interaction)
        await self._db.commit()

        if parsed is None:
            raise RuntimeError(error or "Inference failed")

        return InferenceResponse(
            interaction_id=interaction.id,
            model_version=interaction.model_version,
            result=parsed.model_dump(by_alias=True),
            metadata=InferenceMetadata(latency_ms=latency_ms),
        )
