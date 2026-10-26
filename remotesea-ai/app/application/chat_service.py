import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.orchestrator_service import OrchestratorService
from app.domain.orchestrator.history_turn import HistoryTurn
from app.domain.shared.errors import error_message
from app.infrastructure.logging import get_logger
from app.infrastructure.models.ai_conversation import AiConversation
from app.infrastructure.models.ai_conversation_turn import AiConversationTurn
from app.infrastructure.providers.embedding.base import EmbeddingProvider
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.orchestrator import OrchestratorContext

logger = get_logger(__name__)

_TITLE_MAX_LENGTH = 60
_HISTORY_TURN_LIMIT = 6
# Similar turns from the user's *other* conversations — deliberately small,
# same "bounded context, not a transcript" philosophy as _HISTORY_TURN_LIMIT.
_RELATED_TURN_LIMIT = 3


class ConversationNotFoundError(Exception):
    pass


class ChatService:
    def __init__(
        self,
        db: AsyncSession,
        orchestrator: OrchestratorService,
        embedding_provider: EmbeddingProvider,
    ) -> None:
        self._db = db
        self._orchestrator = orchestrator
        self._embedding_provider = embedding_provider

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

    async def _embed_question(self, question: str) -> list[float] | None:
        try:
            [vector] = await self._embedding_provider.embed([question])
            return vector
        except Exception as exc:  # noqa: BLE001 - grounding is best-effort
            logger.warning("Question embedding failed, continuing without it: %s", error_message(exc))
            return None

    # Similarity search over the user's *other* conversations — deliberately
    # scoped to context.user_id only, never cross-user: unlike
    # HistoricalCaseService's anonymized cross-company cases, a chat turn's
    # question/answer is real personal content, so same-user scoping is the
    # simpler and correct privacy boundary here, not a smaller version of
    # HistoricalCaseService's anonymization problem.
    async def _find_related_turns(
        self, user_id: str, embedding: list[float], exclude_conversation_id: str | None
    ) -> list[HistoryTurn]:
        try:
            stmt = (
                select(AiConversationTurn)
                .join(AiConversation, AiConversationTurn.conversation_id == AiConversation.id)
                .where(AiConversation.user_id == user_id, AiConversationTurn.embedding.isnot(None))
            )
            if exclude_conversation_id:
                stmt = stmt.where(AiConversationTurn.conversation_id != exclude_conversation_id)
            stmt = stmt.order_by(
                AiConversationTurn.embedding.cosine_distance(embedding)
            ).limit(_RELATED_TURN_LIMIT)
            result = await self._db.execute(stmt)
            return [HistoryTurn(question=t.question, answer=t.answer) for t in result.scalars().all()]
        except Exception as exc:  # noqa: BLE001 - grounding is best-effort
            logger.warning("Related-turn lookup failed, continuing without it: %s", error_message(exc))
            return []

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

        # Computed once, reused for both the similarity search below and as
        # the value stored on the new turn — avoids embedding the same
        # question text twice.
        question_embedding = await self._embed_question(request.question)
        related_turns = (
            await self._find_related_turns(context.user_id, question_embedding, conversation.id)
            if question_embedding is not None
            else []
        )

        result = await self._orchestrator.generate(
            context, bearer_token, request.question, request.application_id, history, related_turns
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
            embedding=question_embedding,
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
