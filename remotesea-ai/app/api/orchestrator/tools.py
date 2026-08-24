from fastapi import APIRouter, Depends

from app.api.deps import bearer_token
from app.application import tool_service
from app.infrastructure.security import require_orchestrator_context
from app.schemas.orchestrator import OrchestratorContext
from app.schemas.tools import ApplicationToolResult, CandidateAnalysisToolResult, InterviewToolResult

router = APIRouter(prefix="/tools", tags=["orchestrator"])


# Each depends on require_orchestrator_context purely to reject an
# invalid/expired/unsigned token before doing any work (the decoded context
# itself isn't used here — remotesea-api independently re-derives
# authorization from the same token when this service forwards it, see
# application/tool_service.py). Manually invocable for now; wiring these
# into LLM-driven tool selection is future work, not this layer's job.
@router.get("/applications/{application_id}", response_model=ApplicationToolResult)
async def get_application_tool(
    application_id: str,
    _context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(bearer_token),
) -> ApplicationToolResult:
    return await tool_service.get_application(application_id, token)


@router.get(
    "/applications/{application_id}/candidate-analysis",
    response_model=CandidateAnalysisToolResult,
)
async def get_candidate_analysis_tool(
    application_id: str,
    _context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(bearer_token),
) -> CandidateAnalysisToolResult:
    return await tool_service.get_candidate_analysis(application_id, token)


@router.get("/applications/{application_id}/interview", response_model=InterviewToolResult)
async def get_interview_tool(
    application_id: str,
    _context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(bearer_token),
) -> InterviewToolResult:
    return await tool_service.get_interview(application_id, token)


@router.get("/jobs/{job_id}")
async def get_job_tool(
    job_id: str,
    _context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(bearer_token),
) -> dict:
    return await tool_service.get_job(job_id, token)
