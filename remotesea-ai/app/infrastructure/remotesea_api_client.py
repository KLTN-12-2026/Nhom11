import httpx
from fastapi import HTTPException

from app.infrastructure.config import get_settings

_TIMEOUT_SECONDS = 15.0


# Every tool call forwards the *exact* bearer token this service itself
# received (minted by remotesea-api for this specific user — see
# require_orchestrator_context) — never a re-minted or elevated credential.
# remotesea-api's own guards (RolesGuard, ApplicationAccessGuard, ...) decide
# access from that identity, identically to a direct user request; this
# service never re-derives ownership and never falls back to some
# service-level "trust me" credential on a 403.
async def get(path: str, bearer_token: str) -> httpx.Response:
    settings = get_settings()
    async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
        response = await client.get(
            f"{settings.remotesea_api_base_url}{path}",
            headers={"Authorization": f"Bearer {bearer_token}"},
        )
    if response.status_code >= 400:
        # Propagate remotesea-api's own status/body as-is (403 stays 403,
        # 404 stays 404) rather than collapsing every failure into a generic
        # 500 — an authorization denial from a Tool call must be as visible
        # as one from a direct user request.
        try:
            detail = response.json()
        except ValueError:
            detail = response.text
        raise HTTPException(status_code=response.status_code, detail=detail)
    return response
