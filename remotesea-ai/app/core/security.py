import hmac

import jwt
from fastapi import Header, HTTPException, status

from app.core.config import get_settings
from app.schemas.orchestrator import OrchestratorContext


# Server-to-server auth, not a user token — NestJS is the one and only caller
# (see the README's architecture: recruiters authenticate against NestJS,
# which then calls this service holding one shared secret; this service never
# sees an end-user's own credentials). Same shape as remotesea-api's
# CRON_SECRET-gated cron endpoints. hmac.compare_digest, not `==`, so a
# guess-the-secret attempt can't be timed byte-by-byte.
#
# This guards the pre-orchestrator endpoints (inference/feedback/datasets/
# models) where "the caller is remotesea-api" is the only thing that matters.
# The orchestrator endpoints below need more than that — they need to know
# *which user* remotesea-api is acting on behalf of — so they use
# require_orchestrator_context instead, not this.
async def require_service_auth(
    authorization: str | None = Header(default=None),
) -> None:
    settings = get_settings()
    expected = f"Bearer {settings.ai_service_secret}"
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing service credentials",
        )


# Per-request identity for the orchestrator: remotesea-api mints a
# short-lived JWT (HS256, signed with the same AI_SERVICE_SECRET — see
# AiOrchestratorService.mintContextToken on that side) carrying the calling
# user's id/role/company membership, resolved through remotesea-api's own
# CompanyMembershipService. This service trusts the signature, not the
# caller — there is no other way for it to learn who's asking, and it never
# accepts a user id passed as a plain unsigned field. A Tool later calling
# back into remotesea-api forwards this same identity so remotesea-api's
# existing guards (CompanyOwnershipGuard, ApplicationAccessGuard, ...)
# enforce access exactly as they would for a direct user request — this
# service must never re-derive ownership itself.
async def require_orchestrator_context(
    authorization: str | None = Header(default=None),
) -> OrchestratorContext:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing orchestrator context token",
        )
    token = authorization.removeprefix("Bearer ")
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.ai_service_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Orchestrator context token expired",
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid orchestrator context token",
        ) from exc

    try:
        return OrchestratorContext(
            user_id=payload["sub"],
            role=payload["role"],
            employer_id=payload.get("employerId"),
            company_role=payload.get("companyRole"),
        )
    except (KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Orchestrator context token missing required claims",
        ) from exc
