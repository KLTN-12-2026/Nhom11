from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

_CAMEL_CONFIG = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# Decoded from the short-lived JWT remotesea-api mints per orchestrator
# request (see app/core/security.py's require_orchestrator_context). This is
# the *only* way this service learns who it's acting on behalf of — it never
# accepts a raw user id from an untrusted caller, and never re-derives
# company membership itself (that's remotesea-api's CompanyMembershipService,
# not duplicated here).
class OrchestratorContext(BaseModel):
    model_config = _CAMEL_CONFIG

    user_id: str
    role: Literal["TALENT", "EMPLOYER", "ADMIN"]
    employer_id: str | None = None
    company_role: Literal["OWNER", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER"] | None = None
