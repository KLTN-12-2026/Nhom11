from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.inference_service import InferenceService
from app.infrastructure.main_db import get_db
from app.infrastructure.providers.embedding.base import EmbeddingProvider
from app.infrastructure.providers.embedding.factory import get_embedding_provider
from app.infrastructure.providers.llm.base import AiModelProvider
from app.infrastructure.providers.llm.factory import get_provider
from app.infrastructure.rag_db import get_rag_db
from app.infrastructure.security import require_service_auth
from app.schemas.inference import InferenceRequest, InferenceResponse

router = APIRouter(prefix="/v1", tags=["inference"], dependencies=[Depends(require_service_auth)])


# rag_db/embedding_provider wired in here so CANDIDATE_ANALYSIS can ground
# its prompt in RAG knowledge + similar historical cases — InferenceService
# still works without them (see its own comment), this is just where the
# real dependencies get attached for the live endpoint.
def _get_inference_service(
    db: AsyncSession = Depends(get_db),
    provider: AiModelProvider = Depends(get_provider),
    rag_db: AsyncSession = Depends(get_rag_db),
    embedding_provider: EmbeddingProvider = Depends(get_embedding_provider),
) -> InferenceService:
    return InferenceService(db, provider, rag_db, embedding_provider)


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
