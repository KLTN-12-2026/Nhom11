from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rag_database import get_rag_db
from app.core.security import require_service_auth
from app.models.rag_document import RagDocument
from app.providers.embedding_base import EmbeddingProvider
from app.providers.embedding_factory import get_embedding_provider
from app.schemas.rag import (
    DocumentResponse,
    IngestDocumentRequest,
    RetrievedChunkResponse,
    SearchRequest,
)
from app.services.rag_ingestion_service import RagIngestionService
from app.services.rag_retrieval_service import RagRetrievalService

# Gated the same way as /v1/datasets and /v1/models — managing the
# knowledge base is an operational/admin action, not a per-user one (the
# content itself isn't tenant-scoped candidate data), so the plain
# service-to-service secret is the right level of auth here, not a
# per-user orchestrator context token.
router = APIRouter(prefix="/v1/rag", tags=["rag"], dependencies=[Depends(require_service_auth)])


def _get_embedding_provider() -> EmbeddingProvider:
    return get_embedding_provider()


@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def ingest_document(
    request: IngestDocumentRequest,
    db: AsyncSession = Depends(get_rag_db),
    embedding_provider: EmbeddingProvider = Depends(_get_embedding_provider),
) -> DocumentResponse:
    service = RagIngestionService(db, embedding_provider)
    document = await service.ingest_document(request.title, request.source, request.content)
    return DocumentResponse(
        id=document.id,
        title=document.title,
        source=document.source,
        created_at=document.created_at,
    )


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(db: AsyncSession = Depends(get_rag_db)) -> list[DocumentResponse]:
    result = await db.execute(select(RagDocument).order_by(RagDocument.created_at.desc()))
    return [
        DocumentResponse(id=d.id, title=d.title, source=d.source, created_at=d.created_at)
        for d in result.scalars().all()
    ]


@router.post("/search", response_model=list[RetrievedChunkResponse])
async def search(
    request: SearchRequest,
    db: AsyncSession = Depends(get_rag_db),
    embedding_provider: EmbeddingProvider = Depends(_get_embedding_provider),
) -> list[RetrievedChunkResponse]:
    service = RagRetrievalService(db, embedding_provider)
    results = await service.retrieve(request.query, request.top_k)
    return [
        RetrievedChunkResponse(
            chunk_id=r.chunk_id,
            document_id=r.document_id,
            document_title=r.document_title,
            document_source=r.document_source,
            content=r.content,
            distance=r.distance,
        )
        for r in results
    ]
