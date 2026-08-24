from datetime import datetime

from pydantic import Field

from app.schemas.base import CamelModel


class ChatRequest(CamelModel):
    question: str = Field(min_length=1)
    application_id: str | None = None
    # Omitted -> starts a new conversation; provided -> continues an
    # existing one (ownership-checked against the caller's own user_id,
    # never trusted as-is from the client).
    conversation_id: str | None = None


class ChatResponse(CamelModel):
    conversation_id: str
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)
    sources: list[str]


class ConversationTurnResponse(CamelModel):
    id: str
    question: str
    answer: str
    confidence: float
    sources: list[str]
    application_id: str | None
    created_at: datetime


class ConversationSummaryResponse(CamelModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime


# Summary plus its turns together, for the conversation detail endpoint —
# inherits model_config (camelCase aliasing) from ConversationSummaryResponse.
class ConversationDetailResponse(ConversationSummaryResponse):
    turns: list[ConversationTurnResponse]
