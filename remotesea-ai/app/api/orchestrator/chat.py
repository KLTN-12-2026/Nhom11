from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import bearer_token
from app.api.orchestrator.deps import get_chat_service
from app.application.chat_service import ChatService, ConversationNotFoundError
from app.infrastructure.security import require_orchestrator_context
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationDetailResponse,
    ConversationSummaryResponse,
    ConversationTurnResponse,
)
from app.schemas.orchestrator import OrchestratorContext

router = APIRouter(prefix="/chat", tags=["orchestrator"])


# Multi-turn on top of ask()'s one-shot generation (same
# OrchestratorService.generate path), plus a persisted AiConversation/
# AiConversationTurn trail and up to the last 6 turns fed back in as
# CONVERSATION HISTORY so a follow-up question makes sense without the
# caller re-stating context.
@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(bearer_token),
    service: ChatService = Depends(get_chat_service),
) -> ChatResponse:
    try:
        return await service.send_message(context, token, request)
    except ConversationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"No conversation with id {exc}"
        ) from exc
    except RuntimeError as exc:
        # RAG/LLM failure, already logged inside OrchestratorService.generate
        # — same 502 convention as /v1/inference's equivalent failure path.
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("", response_model=list[ConversationSummaryResponse])
async def list_conversations(
    context: OrchestratorContext = Depends(require_orchestrator_context),
    service: ChatService = Depends(get_chat_service),
) -> list[ConversationSummaryResponse]:
    conversations = await service.list_conversations(context.user_id)
    return [
        ConversationSummaryResponse(
            id=c.id, title=c.title, created_at=c.created_at, updated_at=c.updated_at
        )
        for c in conversations
    ]


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    context: OrchestratorContext = Depends(require_orchestrator_context),
    service: ChatService = Depends(get_chat_service),
) -> ConversationDetailResponse:
    try:
        conversation, turns = await service.get_conversation_with_turns(
            conversation_id, context.user_id
        )
    except ConversationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"No conversation with id {exc}"
        ) from exc

    return ConversationDetailResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        turns=[
            ConversationTurnResponse(
                id=t.id,
                question=t.question,
                answer=t.answer,
                confidence=float(t.confidence),
                sources=t.sources,
                application_id=t.application_id,
                created_at=t.created_at,
            )
            for t in turns
        ],
    )
