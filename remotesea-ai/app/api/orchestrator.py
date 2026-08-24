import time

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.config import get_settings
from app.core.security import require_orchestrator_context
from app.schemas.orchestrator import OrchestratorContext
from app.schemas.tools import ApplicationToolResult, CandidateAnalysisToolResult, InterviewToolResult
from app.services import tool_service

router = APIRouter(prefix="/v1/orchestrator", tags=["orchestrator"])

_API_CALLBACK_TIMEOUT_SECONDS = 5.0


# Tools need the raw token to forward, not just the decoded context —
# require_orchestrator_context already proved this token is valid, so this
# just extracts the same string rather than re-deciding anything.
def _bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token"
        )
    return authorization.removeprefix("Bearer ")


# Phase 1 round-trip proof, nothing more: confirms (a) remotesea-api's
# context token was minted correctly and this service can verify it
# (require_orchestrator_context succeeding is that proof), and (b) this
# service can reach back into remotesea-api's own HTTP API — the mechanism
# every future Tool will use, never a direct DB query against
# remotesea-api's database. No RAG/tool-calling/LLM call happens here yet.
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


# Phase 2 tools: each depends on require_orchestrator_context purely to
# reject an invalid/expired/unsigned token before doing any work (the
# decoded context itself isn't used here — remotesea-api independently
# re-derives authorization from the same token when this service forwards
# it, see tool_service.py). Manually invocable for now; wiring these into
# LLM-driven tool selection is the Context Builder/routing phase, not this
# one.
@router.get("/tools/applications/{application_id}", response_model=ApplicationToolResult)
async def get_application_tool(
    application_id: str,
    _context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(_bearer_token),
) -> ApplicationToolResult:
    return await tool_service.get_application(application_id, token)


@router.get(
    "/tools/applications/{application_id}/candidate-analysis",
    response_model=CandidateAnalysisToolResult,
)
async def get_candidate_analysis_tool(
    application_id: str,
    _context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(_bearer_token),
) -> CandidateAnalysisToolResult:
    return await tool_service.get_candidate_analysis(application_id, token)


@router.get("/tools/applications/{application_id}/interview", response_model=InterviewToolResult)
async def get_interview_tool(
    application_id: str,
    _context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(_bearer_token),
) -> InterviewToolResult:
    return await tool_service.get_interview(application_id, token)


@router.get("/tools/jobs/{job_id}")
async def get_job_tool(
    job_id: str,
    _context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(_bearer_token),
) -> dict:
    return await tool_service.get_job(job_id, token)
