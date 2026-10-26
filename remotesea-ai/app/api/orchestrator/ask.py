from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import bearer_token
from app.api.orchestrator.deps import get_orchestrator_service
from app.application.orchestrator_service import OrchestratorService
from app.infrastructure.security import require_orchestrator_context
from app.schemas.ask import AskRequest, AskResponse
from app.schemas.orchestrator import OrchestratorContext

router = APIRouter(tags=["orchestrator"])


# The first endpoint that actually decides what to fetch (RAG always; the
# applicationId Tool only if the caller supplied one) and folds it into one
# bounded prompt (domain/orchestrator/context_builder.py) before calling the
# LLM.
@router.post("/ask", response_model=AskResponse)
async def ask(
    request: AskRequest,
    context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(bearer_token),
    service: OrchestratorService = Depends(get_orchestrator_service),
) -> AskResponse:
    try:
        return await service.ask(context, token, request)
    except RuntimeError as exc:
        # RAG/LLM failure, already logged inside OrchestratorService.generate
        # — same 502 convention as /v1/inference's equivalent failure path.
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
