from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

_CAMEL_CONFIG = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ApplicationToolResult(BaseModel):
    model_config = _CAMEL_CONFIG

    id: str
    status: str
    job: dict
    talent: dict


class CandidateAnalysisToolResult(BaseModel):
    model_config = _CAMEL_CONFIG

    id: str
    application_id: str
    fit_score: int
    summary: str
    strengths: list[str]
    gaps: list[str]
    suggested_questions: list[str]
    model: str
    created_at: datetime


# interview is nullable — an application can be at the INTERVIEW stage with
# no Interview row yet proposed. Deliberately permissive (extra="allow") on
# the nested interview shape rather than a strict model — this tool wraps
# InterviewsService.get() verbatim and shouldn't silently 500 on a field
# this service hasn't independently verified byte-for-byte.
class InterviewToolResult(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="allow")

    interview: dict | None
    job_title: str
    employer_name: str
    talent_name: str | None
