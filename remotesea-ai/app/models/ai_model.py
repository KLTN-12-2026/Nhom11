import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AiModelStatus(str, enum.Enum):
    # A Colab training run has started but not finished — no artifact yet.
    TRAINING = "TRAINING"
    # Artifact exists, evaluation hasn't been recorded yet.
    EVALUATING = "EVALUATING"
    # Evaluation passed — eligible for human approval, not yet serving traffic.
    CANDIDATE = "CANDIDATE"
    # Currently deployed — at most one ACTIVE row per task at any time.
    ACTIVE = "ACTIVE"
    # Was ACTIVE, superseded by a later approval or rollback.
    ARCHIVED = "ARCHIVED"
    # Evaluation failed — dead end, never eligible for approval.
    REJECTED = "REJECTED"


# One row per training attempt. Status only ever moves forward through the
# TRAINING -> EVALUATING -> CANDIDATE -> ACTIVE -> ARCHIVED chain (or off to
# REJECTED from EVALUATING) — see ModelRegistryService, which is the only
# thing allowed to mutate status, each transition checking the row is in the
# expected prior state first.
class AiModel(Base):
    __tablename__ = "ai_models"
    __table_args__ = (UniqueConstraint("task", "version", name="uq_ai_model_task_version"),)

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    task: Mapped[str] = mapped_column(String, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    base_model: Mapped[str] = mapped_column(String, nullable=False)
    dataset_version: Mapped[int] = mapped_column(Integer, nullable=False)
    # LoRA adapter path/URI once training completes (e.g. an artifact
    # downloaded from Colab), or the Ollama model tag once deployed.
    artifact_path: Mapped[str | None] = mapped_column(String, nullable=True)
    metrics: Mapped[dict | None] = mapped_column(JSON(none_as_null=True), nullable=True)
    status: Mapped[AiModelStatus] = mapped_column(
        Enum(AiModelStatus, name="ai_model_status"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    # Set the first time this row becomes ACTIVE, never cleared afterwards —
    # this is what distinguishes an ARCHIVED model that's rollback-eligible
    # (it was deployed once) from a REJECTED one that never was.
    deployed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
