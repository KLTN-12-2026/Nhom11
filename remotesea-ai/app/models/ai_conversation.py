import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


# One row per chat session. Lives in remotesea_ai (not remotesea_rag) — this
# is AI Learning Loop history (who asked what, alongside AiInteraction/
# AiFeedback), not knowledge-base content, so it belongs with the other
# audit tables, not with RagDocument/RagChunk.
class AiConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # From remotesea-api's orchestrator context (OrchestratorContext.user_id)
    # — opaque here, never joined against, same convention as
    # AiInteraction.user_id.
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    # First question, truncated — just enough for a "recent conversations"
    # list to be recognizable; not editable, not meant to be a real title.
    title: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
