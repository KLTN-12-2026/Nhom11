import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.main_db import Base


class AiFeedbackAction(str, enum.Enum):
    ACCEPT = "ACCEPT"
    EDIT = "EDIT"
    REJECT = "REJECT"


class AiFeedbackQualityStatus(str, enum.Enum):
    # Set by the Dataset Builder (Phase 6), not at feedback-submission time —
    # a feedback row starts PENDING and only becomes training material once
    # validated. See dataset_builder.py.
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# One row per human review of one AiInteraction. Never triggers training by
# itself (see README's hard rule) — it's raw material the Dataset Builder
# reads later, on its own separate, explicit run.
class AiFeedback(Base):
    __tablename__ = "ai_feedback"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    interaction_id: Mapped[str] = mapped_column(
        String, ForeignKey("ai_interactions.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    action: Mapped[AiFeedbackAction] = mapped_column(
        Enum(AiFeedbackAction, name="ai_feedback_action"), nullable=False
    )
    # Only meaningful when action == EDIT — the human's corrected version of
    # the model's output, same shape as AiInteraction.output. This (not the
    # model's original output) is what the Dataset Builder trains on for an
    # EDIT row, since it's the human-validated ground truth.
    # none_as_null: without it, SQLAlchemy's JSON type stores Python None as
    # the JSON scalar `null` rather than SQL NULL, so `IS NULL`/`IS NOT NULL`
    # queries (which Phase 6's dataset builder needs, to tell ACCEPT rows
    # apart from EDIT rows) would silently misbehave.
    corrected_output: Mapped[dict | None] = mapped_column(
        JSON(none_as_null=True), nullable=True
    )
    reason: Mapped[str | None] = mapped_column(String, nullable=True)
    quality_status: Mapped[AiFeedbackQualityStatus] = mapped_column(
        Enum(AiFeedbackQualityStatus, name="ai_feedback_quality_status"),
        nullable=False,
        default=AiFeedbackQualityStatus.PENDING,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
