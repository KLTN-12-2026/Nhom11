import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.models.ai_feedback import AiFeedback
from app.infrastructure.models.ai_interaction import AiInteraction
from app.schemas.feedback import FeedbackRequest


class InteractionNotFoundError(Exception):
    pass


# Deliberately does nothing beyond "validate and persist" — no call to a
# dataset/training pipeline anywhere in this class. That's the hard rule from
# the architecture doc: feedback must NEVER automatically trigger training.
# The Dataset Builder reads AiFeedback rows on its own, separate,
# explicitly-invoked run.
class FeedbackService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def submit(self, request: FeedbackRequest) -> AiFeedback:
        interaction = await self._db.get(AiInteraction, request.interaction_id)
        if interaction is None:
            raise InteractionNotFoundError(request.interaction_id)

        feedback = AiFeedback(
            id=str(uuid.uuid4()),
            interaction_id=request.interaction_id,
            user_id=request.user_id,
            action=request.action,
            corrected_output=request.corrected_output,
            reason=request.reason,
        )
        self._db.add(feedback)
        await self._db.commit()
        await self._db.refresh(feedback)
        return feedback

    async def list_for_interaction(self, interaction_id: str) -> list[AiFeedback]:
        result = await self._db.execute(
            select(AiFeedback)
            .where(AiFeedback.interaction_id == interaction_id)
            .order_by(AiFeedback.created_at)
        )
        return list(result.scalars().all())
