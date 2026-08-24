from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.rag.fusion import cosine_distance, reciprocal_rank_fusion
from app.domain.rag.retrieved_chunk import RetrievedChunk
from app.infrastructure.models.rag_chunk import RagChunk
from app.infrastructure.models.rag_document import RagDocument
from app.infrastructure.providers.embedding.base import EmbeddingProvider

# Both candidate lists over-fetch beyond top_k so RRF has enough to fuse
# from — a chunk ranked, say, 8th by vector similarity but 1st by keyword
# match should still be able to surface after fusion, which it couldn't if
# each side only fetched exactly top_k.
_OVER_FETCH_FACTOR = 4


class RagRetrievalService:
    def __init__(self, db: AsyncSession, embedding_provider: EmbeddingProvider) -> None:
        self._db = db
        self._embedding_provider = embedding_provider

    # Never returns the whole knowledge base — top_k caps how much context
    # this can ever inject into a prompt (see the architecture doc: "không
    # đưa toàn bộ knowledge base vào prompt, chỉ retrieve context liên
    # quan"). Hybrid: cosine-distance vector search (semantic similarity)
    # plus Postgres full-text search (exact keyword/term matches vector
    # search alone can under-rank), combined via Reciprocal Rank Fusion —
    # see domain/rag/fusion.py. `to_tsvector` is computed inline rather than
    # from an indexed generated column — correct at the current knowledge
    # base's scale, a real but separate follow-up once it grows much larger.
    async def retrieve(self, query: str, top_k: int = 5) -> list[RetrievedChunk]:
        [query_embedding] = await self._embedding_provider.embed([query])
        over_fetch = top_k * _OVER_FETCH_FACTOR

        # order_by references the distance expression directly without
        # adding it to the selected columns — RetrievedChunk.distance is
        # computed in Python from each chunk's own embedding instead (see
        # _to_retrieved_chunk), so a chunk found only via the FTS query
        # below still gets a real, comparable cosine distance rather than a
        # ts_rank score mislabeled as one (this value is returned as-is on
        # GET /v1/rag/search).
        vector_distance = RagChunk.embedding.cosine_distance(query_embedding)
        vector_stmt = (
            select(RagChunk, RagDocument.title, RagDocument.source)
            .join(RagDocument, RagChunk.document_id == RagDocument.id)
            .order_by(vector_distance)
            .limit(over_fetch)
        )

        tsquery = func.plainto_tsquery("english", query)
        tsvector = func.to_tsvector("english", RagChunk.content)
        fts_stmt = (
            select(RagChunk, RagDocument.title, RagDocument.source)
            .join(RagDocument, RagChunk.document_id == RagDocument.id)
            .where(tsvector.op("@@")(tsquery))
            .order_by(func.ts_rank(tsvector, tsquery).desc())
            .limit(over_fetch)
        )

        vector_rows = (await self._db.execute(vector_stmt)).all()
        fts_rows = (await self._db.execute(fts_stmt)).all()

        vector_results = [self._to_retrieved_chunk(row, query_embedding) for row in vector_rows]
        fts_results = [self._to_retrieved_chunk(row, query_embedding) for row in fts_rows]

        return reciprocal_rank_fusion(vector_results, fts_results, top_k=top_k)

    @staticmethod
    def _to_retrieved_chunk(row, query_embedding: list[float]) -> RetrievedChunk:
        chunk, title, source = row
        return RetrievedChunk(
            chunk_id=chunk.id,
            document_id=chunk.document_id,
            document_title=title,
            document_source=source,
            content=chunk.content,
            distance=cosine_distance(chunk.embedding, query_embedding),
        )
