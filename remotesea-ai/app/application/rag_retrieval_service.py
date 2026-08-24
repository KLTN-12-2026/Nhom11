from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.rag.retrieved_chunk import RetrievedChunk
from app.infrastructure.models.rag_chunk import RagChunk
from app.infrastructure.models.rag_document import RagDocument
from app.infrastructure.providers.embedding.base import EmbeddingProvider


class RagRetrievalService:
    def __init__(self, db: AsyncSession, embedding_provider: EmbeddingProvider) -> None:
        self._db = db
        self._embedding_provider = embedding_provider

    # Never returns the whole knowledge base — top_k caps how much context
    # this can ever inject into a prompt (see the architecture doc: "không
    # đưa toàn bộ knowledge base vào prompt, chỉ retrieve context liên
    # quan"). Cosine distance (not L2/inner product) — the standard choice
    # for text embeddings, where direction matters far more than magnitude.
    async def retrieve(self, query: str, top_k: int = 5) -> list[RetrievedChunk]:
        [query_embedding] = await self._embedding_provider.embed([query])

        distance = RagChunk.embedding.cosine_distance(query_embedding).label("distance")
        stmt = (
            select(RagChunk, RagDocument.title, RagDocument.source, distance)
            .join(RagDocument, RagChunk.document_id == RagDocument.id)
            .order_by(distance)
            .limit(top_k)
        )
        result = await self._db.execute(stmt)

        return [
            RetrievedChunk(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                document_title=title,
                document_source=source,
                content=chunk.content,
                distance=float(dist),
            )
            for chunk, title, source, dist in result.all()
        ]
