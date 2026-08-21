import hmac

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


# Server-to-server auth, not a user token — NestJS is the one and only caller
# (see the README's architecture: recruiters authenticate against NestJS,
# which then calls this service holding one shared secret; this service never
# sees an end-user's own credentials). Same shape as remotesea-api's
# CRON_SECRET-gated cron endpoints. hmac.compare_digest, not `==`, so a
# guess-the-secret attempt can't be timed byte-by-byte.
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
