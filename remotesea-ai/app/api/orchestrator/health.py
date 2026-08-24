import time

import httpx
from fastapi import APIRouter, Depends

from app.infrastructure.config import get_settings
from app.infrastructure.security import require_orchestrator_context
from app.schemas.orchestrator import OrchestratorContext

router = APIRouter(tags=["orchestrator"])

_API_CALLBACK_TIMEOUT_SECONDS = 5.0


# Round-trip proof, nothing more: confirms (a) remotesea-api's context token
# was minted correctly and this service can verify it (require_orchestrator_
# context succeeding is that proof), and (b) this service can reach back
# into remotesea-api's own HTTP API — the mechanism every Tool uses, never a
# direct DB query against remotesea-api's database. No RAG/tool-calling/LLM
# call happens here.
@router.get("/health")
async def orchestrator_health(
    context: OrchestratorContext = Depends(require_orchestrator_context),
) -> dict:
    settings = get_settings()
    api_reachable = False
    api_latency_ms: int | None = None
    api_error: str | None = None

    started_at = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=_API_CALLBACK_TIMEOUT_SECONDS) as client:
            response = await client.get(f"{settings.remotesea_api_base_url}/health")
            response.raise_for_status()
            api_reachable = True
    except Exception as exc:  # noqa: BLE001 - reported below either way
        api_error = str(exc) or type(exc).__name__
    finally:
        api_latency_ms = int((time.monotonic() - started_at) * 1000)

    return {
        "status": "ok",
        "context": context.model_dump(by_alias=True),
        "apiReachable": api_reachable,
        "apiLatencyMs": api_latency_ms,
        "apiError": api_error,
    }
