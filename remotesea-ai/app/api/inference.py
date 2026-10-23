from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_service_auth
from app.providers.base import AiModelProvider
from app.providers.factory import get_provider
from app.schemas.inference import InferenceRequest, InferenceResponse
from app.services.inference_service import InferenceService

router = APIRouter(prefix="/v1", tags=["inference"], dependencies=[Depends(require_service_auth)])


def _get_inference_service(
    db: AsyncSession = Depends(get_db),
    provider: AiModelProvider = Depends(get_provider),
) -> InferenceService:
    return InferenceService(db, provider)


@router.post("/inference", response_model=InferenceResponse)
async def run_inference(
    request: InferenceRequest,
    service: InferenceService = Depends(_get_inference_service),
) -> InferenceResponse:
    try:
        return await service.run(request)
    except NotImplementedError as exc:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc)
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
