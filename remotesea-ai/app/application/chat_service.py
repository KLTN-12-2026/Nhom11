import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.orchestrator_service import OrchestratorService
from app.domain.orchestrator.history_turn import HistoryTurn
from app.infrastructure.models.ai_conversation import AiConversation
from app.infrastructure.models.ai_conversation_turn import AiConversationTurn
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.orchestrator import OrchestratorContext

_TITLE_MAX_LENGTH = 60
_HISTORY_TURN_LIMIT = 6


class ConversationNotFoundError(Exception):
    pass


class ChatService:
    def __init__(self, db: AsyncSession, orchestrator: OrchestratorService) -> None:
        self._db = db
        self._orchestrator = orchestrator

    async def _get_owned_conversation(self, conversation_id: str, user_id: str) -> AiConversation:
        conversation = await self._db.get(AiConversation, conversation_id)
        # Ownership check is against context.user_id (verified via the
        # orchestrator's own signed JWT), never a client-supplied field —
        # same trust boundary as every guard on the remotesea-api side.
        if conversation is None or conversation.user_id != user_id:
            raise ConversationNotFoundError(conversation_id)
        return conversation

    async def _recent_history(self, conversation_id: str) -> list[HistoryTurn]:
        result = await self._db.execute(
            select(AiConversationTurn)
            .where(AiConversationTurn.conversation_id == conversation_id)
            .order_by(AiConversationTurn.created_at.desc())
            .limit(_HISTORY_TURN_LIMIT)
        )
        turns = list(result.scalars().all())
        turns.reverse()  # oldest first, matching natural reading order in the prompt
        return [HistoryTurn(question=t.question, answer=t.answer) for t in turns]

    async def send_message(
        self, context: OrchestratorContext, bearer_token: str, request: ChatRequest
    ) -> ChatResponse:
        if request.conversation_id:
            conversation = await self._get_owned_conversation(
                request.conversation_id, context.user_id
            )
            history = await self._recent_history(conversation.id)
        else:
            conversation = AiConversation(
                id=str(uuid.uuid4()),
                user_id=context.user_id,
                title=request.question[:_TITLE_MAX_LENGTH],
            )
            self._db.add(conversation)
            await self._db.flush()  # same FK-ordering reason as RagIngestionService
            history = []

        result = await self._orchestrator.generate(
            context, bearer_token, request.question, request.application_id, history
        )

        # Explicit, shared timestamp — AiConversationTurn.created_at's
        # column default only fires at flush time, so reading turn.created_at
        # right after construction (to also stamp the conversation) would
        # still be None here and write a NULL into a NOT NULL column.
        now = datetime.now(timezone.utc)
        turn = AiConversationTurn(
            id=str(uuid.uuid4()),
            conversation_id=conversation.id,
            application_id=request.application_id,
            question=request.question,
            answer=result.answer,
            confidence=result.confidence,
            sources=result.sources,
            created_at=now,
        )
        self._db.add(turn)
        conversation.updated_at = now
        await self._db.commit()

        return ChatResponse(
            conversation_id=conversation.id,
            answer=result.answer,
            confidence=result.confidence,
            sources=result.sources,
        )

    async def list_conversations(self, user_id: str) -> list[AiConversation]:
        result = await self._db.execute(
            select(AiConversation)
            .where(AiConversation.user_id == user_id)
            .order_by(AiConversation.updated_at.desc())
        )
        return list(result.scalars().all())

    async def get_conversation_with_turns(
        self, conversation_id: str, user_id: str
    ) -> tuple[AiConversation, list[AiConversationTurn]]:
        conversation = await self._get_owned_conversation(conversation_id, user_id)
        result = await self._db.execute(
            select(AiConversationTurn)
            .where(AiConversationTurn.conversation_id == conversation_id)
            .order_by(AiConversationTurn.created_at)
        )
        return conversation, list(result.scalars().all())
