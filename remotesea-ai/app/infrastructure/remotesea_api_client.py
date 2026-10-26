import httpx
from fastapi import HTTPException

from app.infrastructure.config import get_settings

_TIMEOUT_SECONDS = 15.0

# Module-level, not per-call — this module is a set of functions, not a
# class the way the LLM/embedding providers are, so there's no __init__ to
# build this once in; a lazily-created singleton client gets the same real
# keep-alive connection reuse across every Tool call for the life of the
# process instead of a fresh TCP connection per call.
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=_TIMEOUT_SECONDS)
    return _client


async def aclose() -> None:
    if _client is not None:
        await _client.aclose()


# Every tool call forwards the *exact* bearer token this service itself
# received (minted by remotesea-api for this specific user — see
# require_orchestrator_context) — never a re-minted or elevated credential.
# remotesea-api's own guards (RolesGuard, ApplicationAccessGuard, ...) decide
# access from that identity, identically to a direct user request; this
# service never re-derives ownership and never falls back to some
# service-level "trust me" credential on a 403.
async def get(path: str, bearer_token: str) -> httpx.Response:
    settings = get_settings()
    response = await _get_client().get(
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
