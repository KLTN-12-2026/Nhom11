from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.chat_service import ChatService
from app.application.orchestrator_service import OrchestratorService
from app.infrastructure.main_db import get_db
from app.infrastructure.providers.embedding.base import EmbeddingProvider
from app.infrastructure.providers.embedding.factory import get_embedding_provider
from app.infrastructure.providers.llm.base import AiModelProvider
from app.infrastructure.providers.llm.factory import get_provider
from app.infrastructure.rag_db import get_rag_db


def get_orchestrator_service(
    rag_db: AsyncSession = Depends(get_rag_db),
    provider: AiModelProvider = Depends(get_provider),
    embedding_provider: EmbeddingProvider = Depends(get_embedding_provider),
) -> OrchestratorService:
    return OrchestratorService(rag_db, provider, embedding_provider)


def get_chat_service(
    db: AsyncSession = Depends(get_db),
    orchestrator: OrchestratorService = Depends(get_orchestrator_service),
) -> ChatService:
    return ChatService(db, orchestrator)
