from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rag_chunk import RagChunk
from app.models.rag_document import RagDocument
from app.providers.embedding_base import EmbeddingProvider


@dataclass
class RetrievedChunk:
    chunk_id: str
    document_id: str
    document_title: str
    document_source: str
    content: str
    # Cosine distance, not similarity — 0.0 is an exact match, larger is
    # less similar. Left as the raw pgvector distance rather than converted
    # to a 0-1 "similarity score" so callers aren't misled into thinking
    # it's calibrated/comparable across embedding models.
    distance: float


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
