from typing import Literal

from app.schemas.base import CamelModel


# Decoded from the short-lived JWT remotesea-api mints per orchestrator
# request (see app/infrastructure/security.py's require_orchestrator_context).
# This is the *only* way this service learns who it's acting on behalf of —
# it never accepts a raw user id from an untrusted caller, and never
# re-derives company membership itself (that's remotesea-api's
# CompanyMembershipService, not duplicated here).
class OrchestratorContext(CamelModel):
    user_id: str
    role: Literal["TALENT", "EMPLOYER", "ADMIN"]
    employer_id: str | None = None
    company_role: Literal["OWNER", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER"] | None = None
