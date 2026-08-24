from typing import Any, Literal

from pydantic import Field

from app.infrastructure.models.ai_interaction import AiTask
from app.schemas.base import CamelModel


class CandidateContext(CamelModel):
    name: str | None = None
    headline: str | None = None
    bio: str | None = None
    skills: list[str] = Field(default_factory=list)
    years_experience: int | None = None
    # Pre-extracted resume text — this service never fetches/parses a resume
    # URL itself (see the README: "AI Service không tự truy cập database
    # business của RemoteSea"). NestJS extracts it and hands it over.
    resume_text: str | None = None


class JobContext(CamelModel):
    title: str
    description: str
    requirements: str | None = None
    level: str | None = None


class ApplicationContext(CamelModel):
    cover_letter: str | None = None
    status: str | None = None


class InferenceContext(CamelModel):
    candidate: CandidateContext
    job: JobContext
    application: ApplicationContext | None = None


class InferenceRequest(CamelModel):
    task: AiTask
    user_id: str
    application_id: str | None = None
    context: InferenceContext


# The structured output for CANDIDATE_ANALYSIS specifically — the only task
# with a real prompt/parser right now (see application/inference_service.py).
# Every other AiTask value is accepted by the request schema but rejected at
# the service layer with a 501 until its own result schema + prompt exist.
class CandidateAnalysisResult(CamelModel):
    score: int = Field(ge=0, le=100)
    recommendation: Literal["SHORTLIST", "REVIEW", "REJECT"]
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    missing_requirements: list[str] = Field(default_factory=list)
    reasoning: str


class InferenceMetadata(CamelModel):
    latency_ms: int


class InferenceResponse(CamelModel):
    interaction_id: str
    model_version: str
    result: dict[str, Any]
    metadata: InferenceMetadata
