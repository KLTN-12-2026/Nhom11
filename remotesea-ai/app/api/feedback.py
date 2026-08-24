from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.feedback_service import FeedbackService, InteractionNotFoundError
from app.infrastructure.main_db import get_db
from app.infrastructure.security import require_service_auth
from app.schemas.feedback import FeedbackRequest, FeedbackResponse

router = APIRouter(
    prefix="/v1", tags=["feedback"], dependencies=[Depends(require_service_auth)]
)


def _get_feedback_service(db: AsyncSession = Depends(get_db)) -> FeedbackService:
    return FeedbackService(db)


@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    request: FeedbackRequest,
    service: FeedbackService = Depends(_get_feedback_service),
) -> FeedbackResponse:
    try:
        feedback = await service.submit(request)
    except InteractionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No AiInteraction with id {exc}",
        ) from exc

    return FeedbackResponse(
        id=feedback.id,
        interaction_id=feedback.interaction_id,
        action=feedback.action,
        created_at=feedback.created_at.isoformat(),
    )
