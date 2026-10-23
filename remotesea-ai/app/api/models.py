from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_service_auth
from app.models.ai_interaction import AiTask
from app.schemas.model import (
    CompleteTrainingRequest,
    ModelResponse,
    RegisterTrainingRequest,
    SubmitEvaluationRequest,
)
from app.services.model_registry_service import (
    InvalidModelStateError,
    ModelNotFoundError,
    ModelRegistryService,
)

router = APIRouter(
    prefix="/v1/models", tags=["models"], dependencies=[Depends(require_service_auth)]
)


def _get_service(db: AsyncSession = Depends(get_db)) -> ModelRegistryService:
    return ModelRegistryService(db)


def _to_response(model) -> ModelResponse:
    return ModelResponse(
        id=model.id,
        task=model.task,
        version=model.version,
        name=model.name,
        base_model=model.base_model,
        dataset_version=model.dataset_version,
        artifact_path=model.artifact_path,
        metrics=model.metrics,
        status=model.status,
        created_at=model.created_at.isoformat(),
        deployed_at=model.deployed_at.isoformat() if model.deployed_at else None,
    )


async def _handle(coro):
    try:
        return _to_response(await coro)
    except ModelNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"No AiModel with id {exc}") from exc
    except InvalidModelStateError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc


@router.post("", response_model=ModelResponse, status_code=status.HTTP_201_CREATED)
async def register_training(
    request: RegisterTrainingRequest, service: ModelRegistryService = Depends(_get_service)
) -> ModelResponse:
    model = await service.register_training(
        request.task.value, request.name, request.base_model, request.dataset_version
    )
    return _to_response(model)


@router.post("/{model_id}/complete-training", response_model=ModelResponse)
async def complete_training(
    model_id: str,
    request: CompleteTrainingRequest,
    service: ModelRegistryService = Depends(_get_service),
) -> ModelResponse:
    return await _handle(service.complete_training(model_id, request.artifact_path))


@router.post("/{model_id}/evaluate", response_model=ModelResponse)
async def submit_evaluation(
    model_id: str,
    request: SubmitEvaluationRequest,
    service: ModelRegistryService = Depends(_get_service),
) -> ModelResponse:
    return await _handle(service.submit_evaluation(model_id, request.metrics, request.passed))


@router.post("/{model_id}/approve", response_model=ModelResponse)
async def approve(
    model_id: str, service: ModelRegistryService = Depends(_get_service)
) -> ModelResponse:
    return await _handle(service.approve(model_id))


@router.post("/{model_id}/rollback", response_model=ModelResponse)
async def rollback(
    model_id: str, service: ModelRegistryService = Depends(_get_service)
) -> ModelResponse:
    return await _handle(service.rollback(model_id))


@router.get("", response_model=list[ModelResponse])
async def list_models(
    task: AiTask = Query(default=AiTask.CANDIDATE_ANALYSIS),
    service: ModelRegistryService = Depends(_get_service),
) -> list[ModelResponse]:
    models = await service.list_models(task.value)
    return [_to_response(m) for m in models]


@router.get("/active", response_model=ModelResponse | None)
async def get_active(
    task: AiTask = Query(default=AiTask.CANDIDATE_ANALYSIS),
    service: ModelRegistryService = Depends(_get_service),
) -> ModelResponse | None:
    model = await service.get_active(task.value)
    return _to_response(model) if model else None
