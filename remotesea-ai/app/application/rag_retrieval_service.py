import time

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

# Module-level, not per-instance — RagRetrievalService is constructed fresh
# per request (see OrchestratorService/InferenceService), so a per-instance
# cache would never be hit twice. Bounded size + short TTL: this is a
# latency optimization for a repeated identical question (a real, observed
# pattern in this session's own FAQ-style test queries), not a correctness-
# critical structure — a stale hit for up to _CACHE_TTL_SECONDS is an
# acceptable tradeoff, and RagIngestionService clears it on every successful
# ingest so a newly-added document is never masked for the rest of the TTL.
_CACHE_TTL_SECONDS = 300.0
_CACHE_MAX_SIZE = 200
_cache: dict[tuple[str, int], tuple[float, list[RetrievedChunk]]] = {}


def clear_cache() -> None:
    _cache.clear()


def _cache_get(key: tuple[str, int]) -> list[RetrievedChunk] | None:
    entry = _cache.get(key)
    if entry is None:
        return None
    cached_at, chunks = entry
    if time.monotonic() - cached_at > _CACHE_TTL_SECONDS:
        del _cache[key]
        return None
    return chunks


def _cache_set(key: tuple[str, int], chunks: list[RetrievedChunk]) -> None:
    if len(_cache) >= _CACHE_MAX_SIZE:
        # Evict the oldest entry — simple bound, not a full LRU; this cache
        # is a latency optimization, not a structure worth more machinery.
        oldest_key = min(_cache, key=lambda k: _cache[k][0])
        del _cache[oldest_key]
    _cache[key] = (time.monotonic(), chunks)


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
        cache_key = (query.strip().lower(), top_k)
        cached = _cache_get(cache_key)
        if cached is not None:
            return cached

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

        result = reciprocal_rank_fusion(vector_results, fts_results, top_k=top_k)
        _cache_set(cache_key, result)
        return result

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
