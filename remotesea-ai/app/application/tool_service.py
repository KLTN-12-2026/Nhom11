from app.infrastructure import remotesea_api_client
from app.schemas.tools import ApplicationToolResult, CandidateAnalysisToolResult, InterviewToolResult


async def get_application(application_id: str, bearer_token: str) -> ApplicationToolResult:
    response = await remotesea_api_client.get(
        f"/ai-orchestrator/tools/applications/{application_id}", bearer_token
    )
    return ApplicationToolResult.model_validate(response.json())


async def get_candidate_analysis(
    application_id: str, bearer_token: str
) -> CandidateAnalysisToolResult:
    response = await remotesea_api_client.get(
        f"/ai-orchestrator/tools/applications/{application_id}/candidate-analysis", bearer_token
    )
    return CandidateAnalysisToolResult.model_validate(response.json())


async def get_interview(application_id: str, bearer_token: str) -> InterviewToolResult:
    response = await remotesea_api_client.get(
        f"/ai-orchestrator/tools/applications/{application_id}/interview", bearer_token
    )
    return InterviewToolResult.model_validate(response.json())


# No response schema — job detail's exact shape hasn't been independently
# verified against JobsService.getActiveById the way the other three tools'
# shapes were confirmed against their service methods, and it's public data
# either way, so this passes the JSON through rather than risk a wrong
# strict schema silently dropping fields a caller needed.
async def get_job(job_id: str, bearer_token: str) -> dict:
    response = await remotesea_api_client.get(f"/ai-orchestrator/tools/jobs/{job_id}", bearer_token)
    return response.json()
