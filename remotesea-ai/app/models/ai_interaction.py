import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AiTask(str, enum.Enum):
    # Only CANDIDATE_ANALYSIS has a real implementation in inference_service.py
    # right now (see the README's phased rollout) — the rest of the enum
    # exists so the request schema/DB column are already shaped for them,
    # not because they're wired up yet.
    CANDIDATE_ANALYSIS = "CANDIDATE_ANALYSIS"
    JOB_MATCHING = "JOB_MATCHING"
    INTERVIEW_ANALYSIS = "INTERVIEW_ANALYSIS"
    SCORECARD_ANALYSIS = "SCORECARD_ANALYSIS"
    INTERVIEW_QUESTION_GENERATION = "INTERVIEW_QUESTION_GENERATION"
    KNOWLEDGE_ASSISTANT = "KNOWLEDGE_ASSISTANT"


class AiInteractionStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


# One row per inference call, never updated after insert — this is the audit
# trail the README calls for ("AI đã nhận gì? model nào? trả gì? RAG context
# gì? mất bao lâu?") and later becomes raw material for the dataset pipeline
# (Phase 4+), so it has to capture the full input/output even though nothing
# in Phase 1+2 reads it back yet.
class AiInteraction(Base):
    __tablename__ = "ai_interactions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    task: Mapped[AiTask] = mapped_column(Enum(AiTask, name="ai_task"), nullable=False)
    # IDs from remotesea-api's Postgres (a different database — see
    # DATABASE_URL's comment) — stored as opaque strings, never joined
    # against here. This service doesn't own or validate them.
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    application_id: Mapped[str | None] = mapped_column(String, nullable=True)
    input: Mapped[dict] = mapped_column(JSON, nullable=False)
    retrieved_context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    output: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    model_version: Mapped[str] = mapped_column(String, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[AiInteractionStatus] = mapped_column(
        Enum(AiInteractionStatus, name="ai_interaction_status"), nullable=False
    )
    error: Mapped[str | None] = mapped_column(String, nullable=True)
    # timezone=True — the Python-side value is always tz-aware
    # (datetime.now(timezone.utc) below); without this, Postgres stores a
    # TIMESTAMP WITHOUT TIME ZONE column and asyncpg refuses to insert a
    # tz-aware value into it at all rather than silently truncating.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
