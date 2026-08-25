import uuid

from qdrant_client.models import PointStruct
from sqlalchemy.ext.asyncio import AsyncSession

from app.application import rag_retrieval_service
from app.domain.rag.chunker import chunk_text
from app.domain.shared.errors import error_message
from app.infrastructure.config import get_settings
from app.infrastructure.logging import get_logger
from app.infrastructure.models.rag_chunk import RagChunk
from app.infrastructure.models.rag_document import RagDocument
from app.infrastructure.providers.embedding.base import EmbeddingProvider
from app.infrastructure.qdrant_client import ensure_collection, get_qdrant_client

logger = get_logger(__name__)


class RagIngestionService:
    def __init__(self, db: AsyncSession, embedding_provider: EmbeddingProvider) -> None:
        self._db = db
        self._embedding_provider = embedding_provider

    async def ingest_document(self, title: str, source: str, content: str) -> RagDocument:
        chunks = chunk_text(content)
        if not chunks:
            raise ValueError("Document content produced zero chunks (empty after stripping)")

        embeddings = await self._embedding_provider.embed(chunks)

        document = RagDocument(id=str(uuid.uuid4()), title=title, source=source, content=content)
        self._db.add(document)
        # Flush before adding chunks — RagChunk.document_id is a plain FK
        # column, not an ORM relationship() (this codebase doesn't use
        # relationship() elsewhere either), so SQLAlchemy has no declared
        # dependency to order the inserts by and will otherwise insert
        # child rows before the parent they reference, violating the FK
        # constraint.
        await self._db.flush()

        chunk_ids = [str(uuid.uuid4()) for _ in chunks]
        for chunk_id, index, chunk_content in zip(chunk_ids, range(len(chunks)), chunks, strict=True):
            self._db.add(
                RagChunk(
                    id=chunk_id,
                    document_id=document.id,
                    chunk_index=index,
                    content=chunk_content,
                )
            )

        await self._db.commit()
        await self._db.refresh(document)

        # Vectors live in Qdrant, not Postgres — payload is denormalized
        # (document_id/title/source/content/chunk_index) so a vector-search
        # result never needs a Postgres join to build a RetrievedChunk.
        # Committing the Postgres rows first, Qdrant second: if the Qdrant
        # upsert fails, the chunk still exists (with content) for the
        # full-text half of hybrid search, and RRF degrades to FTS-only for
        # it — but the caller still needs to know indexing didn't fully
        # succeed, so the failure is surfaced (→ 502 at the API layer), not
        # swallowed; the document row itself is not rolled back.
        try:
            await ensure_collection()
            settings = get_settings()
            await get_qdrant_client().upsert(
                collection_name=settings.qdrant_collection_name,
                points=[
                    PointStruct(
                        id=chunk_id,
                        vector=embedding,
                        payload={
                            "document_id": document.id,
                            "document_title": document.title,
                            "document_source": document.source,
                            "content": chunk_content,
                            "chunk_index": index,
                        },
                    )
                    for chunk_id, index, chunk_content, embedding in zip(
                        chunk_ids, range(len(chunks)), chunks, embeddings, strict=True
                    )
                ],
            )
        except Exception as exc:  # noqa: BLE001 - converted to a clean 502 below
            message = error_message(exc)
            logger.warning(
                "Qdrant upsert failed for document %s (Postgres row already committed): %s",
                document.id,
                message,
            )
            raise RuntimeError(message) from exc

        # A newly-ingested document must be findable immediately — never
        # masked by a stale cached result from before it existed for the
        # rest of RagRetrievalService's cache TTL.
        rag_retrieval_service.clear_cache()
        return document
