import json
import time
import uuid

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.ai_interaction import AiInteraction, AiInteractionStatus, AiTask
from app.providers.base import AiModelProvider
from app.schemas.inference import (
    CandidateAnalysisResult,
    InferenceContext,
    InferenceMetadata,
    InferenceRequest,
    InferenceResponse,
)

logger = get_logger(__name__)

_CANDIDATE_ANALYSIS_SYSTEM = (
    "You are a recruiting assistant helping a hiring team quickly assess a "
    "candidate's fit for a specific job. Base every claim strictly on the "
    "candidate and job information provided — never invent experience, "
    "skills, or credentials that weren't stated. Business rules (what score "
    "or recommendation a candidate ultimately gets) belong to RemoteSea's "
    "own code, not to you — just report what you observe. "
    "Respond with ONLY a single JSON object, no prose outside it, matching "
    'exactly: {"score": number 0-100, "recommendation": one of "SHORTLIST", '
    '"REVIEW", "REJECT", "strengths": string[] (max 4), "weaknesses": '
    'string[] (max 4), "missingRequirements": string[] (max 4, requirements '
    "from the job the candidate's info doesn't demonstrate), \"reasoning\": "
    '"2-3 sentence objective explanation for the score/recommendation"}.'
)


def _build_candidate_analysis_prompt(context: InferenceContext) -> str:
    candidate, job = context.candidate, context.job
    parts = [
        f"Job title: {job.title}",
        f"Seniority level: {job.level}" if job.level else None,
        f"Job description:\n{job.description}",
        f"Requirements:\n{job.requirements}" if job.requirements else None,
        f"\nCandidate name: {candidate.name}" if candidate.name else None,
        f"Candidate headline: {candidate.headline}" if candidate.headline else None,
        f"Candidate bio: {candidate.bio}" if candidate.bio else None,
        f"Candidate skills: {', '.join(candidate.skills)}"
        if candidate.skills
        else None,
        f"Years of experience: {candidate.years_experience}"
        if candidate.years_experience is not None
        else None,
        f"Resume text:\n{candidate.resume_text}" if candidate.resume_text else None,
        f"\nCover letter:\n{context.application.cover_letter}"
        if context.application and context.application.cover_letter
        else None,
    ]
    return "\n".join(p for p in parts if p)


# The model is told to return only JSON, but is never trusted to — a stray
# code fence or leading sentence is common enough to guard against rather
# than let it surface as an opaque 500. Same pattern as remotesea-api's
# parseCvAnalysisResponse.
def _parse_candidate_analysis(raw: str) -> CandidateAnalysisResult | None:
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1 or end < start:
        return None
    try:
        candidate = json.loads(raw[start : end + 1])
        return CandidateAnalysisResult.model_validate(candidate)
    except (json.JSONDecodeError, ValidationError):
        return None


class InferenceService:
    def __init__(self, db: AsyncSession, provider: AiModelProvider) -> None:
        self._db = db
        self._provider = provider

    async def run(self, request: InferenceRequest) -> InferenceResponse:
        if request.task != AiTask.CANDIDATE_ANALYSIS:
            # Every other AiTask is a real, named value in the enum (see the
            # README's task list) but has no prompt/parser yet — surfaced as
            # a clean 501 at the API layer rather than silently 200-ing with
            # nothing, or crashing on a missing branch.
            raise NotImplementedError(
                f"Task {request.task.value} is not implemented yet"
            )

        started_at = time.monotonic()
        raw_output: str | None = None
        try:
            prompt = _build_candidate_analysis_prompt(request.context)
            raw_output = await self._provider.complete(
                _CANDIDATE_ANALYSIS_SYSTEM, prompt
            )
            parsed = _parse_candidate_analysis(raw_output)
            if parsed is None:
                raise ValueError("Model returned an unparseable response")
            status = AiInteractionStatus.SUCCESS
            error: str | None = None
        except Exception as exc:  # noqa: BLE001 - persisted below either way
            # str(exc) is blank for some exception types (httpx.ReadTimeout,
            # notably — the one that actually hit this path in dev) — always
            # fall back to the exception's class name so AiInteraction.error
            # and the 502 response are never a silently empty string.
            message = str(exc) or type(exc).__name__
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
            retrieved_context=None,  # RAG isn't wired in yet (explicitly deferred)
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
