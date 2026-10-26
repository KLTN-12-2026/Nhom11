import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.main_db import Base


class AiDatasetStatus(str, enum.Enum):
    READY = "READY"
    # A build with zero valid samples still gets a row (for traceability of
    # the attempt) instead of silently producing nothing.
    FAILED = "FAILED"


# One row per dataset *version*. Never updated after insert — version N's
# files under datasets/{task}/v{N}/ and this row are immutable; building
# again always inserts a new row at version N+1, it never touches an
# existing version. This is what "dataset versions are immutable" means in
# practice: there's no UPDATE path in dataset_builder.py at all.
class AiDataset(Base):
    __tablename__ = "ai_datasets"
    __table_args__ = (UniqueConstraint("task", "version", name="uq_ai_dataset_task_version"),)

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    task: Mapped[str] = mapped_column(String, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[AiDatasetStatus] = mapped_column(
        Enum(AiDatasetStatus, name="ai_dataset_status"), nullable=False
    )
    sample_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    train_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    validation_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    test_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    train_path: Mapped[str | None] = mapped_column(String, nullable=True)
    validation_path: Mapped[str | None] = mapped_column(String, nullable=True)
    test_path: Mapped[str | None] = mapped_column(String, nullable=True)
    # Traceability: which interaction/feedback rows were folded into this
    # version, and why anything was skipped — so a version can be audited or
    # reproduced without re-deriving the selection logic from scratch.
    build_summary: Mapped[dict] = mapped_column(JSON(none_as_null=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
