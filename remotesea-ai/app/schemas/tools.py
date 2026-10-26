from datetime import datetime

from app.schemas.base import CamelModel, PermissiveCamelModel


class ApplicationToolResult(CamelModel):
    id: str
    status: str
    job: dict
    talent: dict


# No applicationId field — remotesea-api's cvAnalysisSelect
# (src/modules/cv-analysis/interfaces.ts) never returns one; it's implied
# by the URL this was fetched from, not part of the row itself. A required
# `application_id: str` here previously made every real call fail Pydantic
# validation (found by an accuracy audit against remotesea-api's real
# select shape — this was live-reachable, not hypothetical).
class CandidateAnalysisToolResult(CamelModel):
    id: str
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
class InterviewToolResult(PermissiveCamelModel):
    interview: dict | None
    job_title: str
    employer_name: str
    talent_name: str | None
