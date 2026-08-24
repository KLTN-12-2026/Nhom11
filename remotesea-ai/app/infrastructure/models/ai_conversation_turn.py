import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.main_db import Base


# One row per question/answer pair within a conversation, immutable once
# written — same "audit trail, never overwritten" convention as
# AiInteraction. `sources` is the list of strings OrchestratorService
# computed itself (RAG documents consulted, whether the applicationId Tool
# was used) — never something the model claimed, same trust boundary as
# AskResponse.sources.
class AiConversationTurn(Base):
    __tablename__ = "ai_conversation_turns"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # Indexed: Postgres does not automatically index FK columns, and
    # ChatService.get_conversation_with_turns queries by this column on
    # every conversation detail fetch (code-review finding).
    conversation_id: Mapped[str] = mapped_column(
        String, ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    application_id: Mapped[str | None] = mapped_column(String, nullable=True)
    question: Mapped[str] = mapped_column(String, nullable=False)
    answer: Mapped[str] = mapped_column(String, nullable=False)
    confidence: Mapped[float] = mapped_column(Numeric, nullable=False)
    sources: Mapped[list] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
