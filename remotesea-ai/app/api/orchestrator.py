import time

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.rag_database import get_rag_db
from app.core.security import require_orchestrator_context
from app.providers.base import AiModelProvider
from app.providers.embedding_base import EmbeddingProvider
from app.providers.embedding_factory import get_embedding_provider
from app.providers.factory import get_provider
from app.schemas.ask import AskRequest, AskResponse
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationDetailResponse,
    ConversationSummaryResponse,
    ConversationTurnResponse,
)
from app.schemas.orchestrator import OrchestratorContext
from app.schemas.tools import ApplicationToolResult, CandidateAnalysisToolResult, InterviewToolResult
from app.services import tool_service
from app.services.chat_service import ChatService, ConversationNotFoundError
from app.services.orchestrator_service import OrchestratorService

router = APIRouter(prefix="/v1/orchestrator", tags=["orchestrator"])

_API_CALLBACK_TIMEOUT_SECONDS = 5.0


# Tools need the raw token to forward, not just the decoded context —
# require_orchestrator_context already proved this token is valid, so this
# just extracts the same string rather than re-deciding anything.
def _bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token"
        )
    return authorization.removeprefix("Bearer ")


# Phase 1 round-trip proof, nothing more: confirms (a) remotesea-api's
# context token was minted correctly and this service can verify it
# (require_orchestrator_context succeeding is that proof), and (b) this
# service can reach back into remotesea-api's own HTTP API — the mechanism
# every future Tool will use, never a direct DB query against
# remotesea-api's database. No RAG/tool-calling/LLM call happens here yet.
@router.get("/health")
async def orchestrator_health(
    context: OrchestratorContext = Depends(require_orchestrator_context),
) -> dict:
    settings = get_settings()
    api_reachable = False
    api_latency_ms: int | None = None
    api_error: str | None = None

    started_at = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=_API_CALLBACK_TIMEOUT_SECONDS) as client:
            response = await client.get(f"{settings.remotesea_api_base_url}/health")
            response.raise_for_status()
            api_reachable = True
    except Exception as exc:  # noqa: BLE001 - reported below either way
        api_error = str(exc) or type(exc).__name__
    finally:
        api_latency_ms = int((time.monotonic() - started_at) * 1000)

    return {
        "status": "ok",
        "context": context.model_dump(by_alias=True),
        "apiReachable": api_reachable,
        "apiLatencyMs": api_latency_ms,
        "apiError": api_error,
    }


# Phase 2 tools: each depends on require_orchestrator_context purely to
# reject an invalid/expired/unsigned token before doing any work (the
# decoded context itself isn't used here — remotesea-api independently
# re-derives authorization from the same token when this service forwards
# it, see tool_service.py). Manually invocable for now; wiring these into
# LLM-driven tool selection is the Context Builder/routing phase, not this
# one.
@router.get("/tools/applications/{application_id}", response_model=ApplicationToolResult)
async def get_application_tool(
    application_id: str,
    _context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(_bearer_token),
) -> ApplicationToolResult:
    return await tool_service.get_application(application_id, token)


@router.get(
    "/tools/applications/{application_id}/candidate-analysis",
    response_model=CandidateAnalysisToolResult,
)
async def get_candidate_analysis_tool(
    application_id: str,
    _context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(_bearer_token),
) -> CandidateAnalysisToolResult:
    return await tool_service.get_candidate_analysis(application_id, token)


@router.get("/tools/applications/{application_id}/interview", response_model=InterviewToolResult)
async def get_interview_tool(
    application_id: str,
    _context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(_bearer_token),
) -> InterviewToolResult:
    return await tool_service.get_interview(application_id, token)


@router.get("/tools/jobs/{job_id}")
async def get_job_tool(
    job_id: str,
    _context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(_bearer_token),
) -> dict:
    return await tool_service.get_job(job_id, token)


def _get_orchestrator_service(
    rag_db: AsyncSession = Depends(get_rag_db),
    provider: AiModelProvider = Depends(get_provider),
    embedding_provider: EmbeddingProvider = Depends(get_embedding_provider),
) -> OrchestratorService:
    return OrchestratorService(rag_db, provider, embedding_provider)


# Phase 4: the first endpoint that actually decides what to fetch (RAG
# always; the applicationId Tool only if the caller supplied one) and folds
# it into one bounded prompt (context_builder.py) before calling the LLM —
# everything before this phase only ran a tool or a RAG search because a
# test explicitly asked for that one thing.
@router.post("/ask", response_model=AskResponse)
async def ask(
    request: AskRequest,
    context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(_bearer_token),
    service: OrchestratorService = Depends(_get_orchestrator_service),
) -> AskResponse:
    return await service.ask(context, token, request)


def _get_chat_service(
    db: AsyncSession = Depends(get_db),
    orchestrator: OrchestratorService = Depends(_get_orchestrator_service),
) -> ChatService:
    return ChatService(db, orchestrator)


# Phase 5: multi-turn on top of Phase 4's one-shot ask() — same generation
# path (OrchestratorService.generate), plus a persisted AiConversation/
# AiConversationTurn trail and up to the last 6 turns fed back in as
# CONVERSATION HISTORY (context_builder.py) so a follow-up question makes
# sense without the caller re-stating context.
@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    context: OrchestratorContext = Depends(require_orchestrator_context),
    token: str = Depends(_bearer_token),
    service: ChatService = Depends(_get_chat_service),
) -> ChatResponse:
    try:
        return await service.send_message(context, token, request)
    except ConversationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"No conversation with id {exc}"
        ) from exc


@router.get("/chat", response_model=list[ConversationSummaryResponse])
async def list_conversations(
    context: OrchestratorContext = Depends(require_orchestrator_context),
    service: ChatService = Depends(_get_chat_service),
) -> list[ConversationSummaryResponse]:
    conversations = await service.list_conversations(context.user_id)
    return [
        ConversationSummaryResponse(
            id=c.id, title=c.title, created_at=c.created_at, updated_at=c.updated_at
        )
        for c in conversations
    ]


@router.get("/chat/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    context: OrchestratorContext = Depends(require_orchestrator_context),
    service: ChatService = Depends(_get_chat_service),
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
