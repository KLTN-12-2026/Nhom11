from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.models.ai_interaction import AiTask

# Every schema on this API boundary speaks camelCase (matching the doc's own
# request/response examples, and remotesea-api/remotesea-web's convention on
# the other side of the wire) while staying snake_case internally — populate_by_name
# lets callers construct instances with either name in tests.
_CAMEL_CONFIG = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class CandidateContext(BaseModel):
    model_config = _CAMEL_CONFIG

    name: str | None = None
    headline: str | None = None
    bio: str | None = None
    skills: list[str] = Field(default_factory=list)
    years_experience: int | None = None
    # Pre-extracted resume text — this service never fetches/parses a resume
    # URL itself (see the README: "AI Service không tự truy cập database
    # business của RemoteSea"). NestJS extracts it and hands it over.
    resume_text: str | None = None


class JobContext(BaseModel):
    model_config = _CAMEL_CONFIG

    title: str
    description: str
    requirements: str | None = None
    level: str | None = None


class ApplicationContext(BaseModel):
    model_config = _CAMEL_CONFIG

    cover_letter: str | None = None
    status: str | None = None


class InferenceContext(BaseModel):
    model_config = _CAMEL_CONFIG

    candidate: CandidateContext
    job: JobContext
    application: ApplicationContext | None = None


class InferenceRequest(BaseModel):
    model_config = _CAMEL_CONFIG

    task: AiTask
    user_id: str
    application_id: str | None = None
    context: InferenceContext


# The structured output for CANDIDATE_ANALYSIS specifically — the only task
# with a real prompt/parser right now (see inference_service.py). Every
# other AiTask value is accepted by the request schema but rejected at the
# service layer with a 501 until its own result schema + prompt exist.
class CandidateAnalysisResult(BaseModel):
    model_config = _CAMEL_CONFIG

    score: int = Field(ge=0, le=100)
    recommendation: Literal["SHORTLIST", "REVIEW", "REJECT"]
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    missing_requirements: list[str] = Field(default_factory=list)
    reasoning: str


class InferenceMetadata(BaseModel):
    model_config = _CAMEL_CONFIG

    latency_ms: int


class InferenceResponse(BaseModel):
    model_config = _CAMEL_CONFIG

    interaction_id: str
    model_version: str
    result: dict[str, Any]
    metadata: InferenceMetadata
