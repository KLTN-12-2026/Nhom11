import httpx
from fastapi import HTTPException

from app.core.config import get_settings
from app.schemas.tools import ApplicationToolResult, CandidateAnalysisToolResult, InterviewToolResult

_TIMEOUT_SECONDS = 15.0


# Every tool call forwards the *exact* bearer token this service itself
# received (minted by remotesea-api for this specific user — see
# require_orchestrator_context) — never a re-minted or elevated credential.
# remotesea-api's own guards (RolesGuard, ApplicationAccessGuard, ...) decide
# access from that identity, identically to a direct user request; this
# service never re-derives ownership and never falls back to some
# service-level "trust me" credential on a 403.
async def _call_tool_endpoint(path: str, bearer_token: str) -> httpx.Response:
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


async def get_application(application_id: str, bearer_token: str) -> ApplicationToolResult:
    response = await _call_tool_endpoint(
        f"/ai-orchestrator/tools/applications/{application_id}", bearer_token
    )
    return ApplicationToolResult.model_validate(response.json())


async def get_candidate_analysis(
    application_id: str, bearer_token: str
) -> CandidateAnalysisToolResult:
    response = await _call_tool_endpoint(
        f"/ai-orchestrator/tools/applications/{application_id}/candidate-analysis", bearer_token
    )
    return CandidateAnalysisToolResult.model_validate(response.json())


async def get_interview(application_id: str, bearer_token: str) -> InterviewToolResult:
    response = await _call_tool_endpoint(
        f"/ai-orchestrator/tools/applications/{application_id}/interview", bearer_token
    )
    return InterviewToolResult.model_validate(response.json())


# No response schema — job detail's exact shape hasn't been independently
# verified against JobsService.getActiveById the way the other three tools'
# shapes were confirmed against their service methods, and it's public data
# either way, so this passes the JSON through rather than risk a wrong
# strict schema silently dropping fields a caller needed.
async def get_job(job_id: str, bearer_token: str) -> dict:
    response = await _call_tool_endpoint(f"/ai-orchestrator/tools/jobs/{job_id}", bearer_token)
    return response.json()
