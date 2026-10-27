import asyncio
import time

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.rag.fusion import cosine_distance, reciprocal_rank_fusion
from app.domain.rag.retrieved_chunk import RetrievedChunk
from app.domain.shared.errors import error_message
from app.infrastructure.config import get_settings
from app.infrastructure.logging import get_logger
from app.infrastructure.models.rag_chunk import RagChunk
from app.infrastructure.models.rag_document import RagDocument
from app.infrastructure.providers.embedding.base import EmbeddingProvider
from app.infrastructure.qdrant_client import get_qdrant_client

logger = get_logger(__name__)

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
    # quan"). Hybrid: Qdrant vector search (semantic similarity) plus
    # Postgres full-text search (exact keyword/term matches vector search
    # alone can under-rank), combined via Reciprocal Rank Fusion — see
    # domain/rag/fusion.py. Chunk vectors live in Qdrant; chunk id/content
    # live in Postgres too (denormalized) so the full-text half needs no
    # cross-store round trip. `to_tsvector` is computed inline rather than
    # from an indexed generated column — correct at the current knowledge
    # base's scale, a real but separate follow-up once it grows much larger.
    async def retrieve(self, query: str, top_k: int = 5) -> list[RetrievedChunk]:
        started_at = time.monotonic()
        cache_key = (query.strip().lower(), top_k)
        cached = _cache_get(cache_key)
        if cached is not None:
            logger.info(
                "rag_retrieve cache=hit elapsed_ms=%d chunks=%d",
                int((time.monotonic() - started_at) * 1000),
                len(cached),
            )
            return cached

        # Qdrant is a real external network dependency now (previously this
        # was a local Postgres query only) — an auth failure, a network
        # blip, or the collection not existing yet must not surface as a
        # bare, undetailed 500. Converted to RuntimeError here so the API
        # layer can map it to a clean 502, the same convention already used
        # for RAG/LLM failures in OrchestratorService.generate().
        try:
            [query_embedding] = await self._embedding_provider.embed([query])
            over_fetch = top_k * _OVER_FETCH_FACTOR

            # Qdrant (vector) and Postgres (full-text) are independent
            # external round trips — run them concurrently rather than
            # back-to-back, same "independent I/O -> gather" rule already
            # applied to Tool calls/RAG in OrchestratorService and to the
            # two DB lookups in InferenceService.run().
            vector_results, fts_rows = await asyncio.gather(
                self._search_vector(query_embedding, over_fetch),
                self._search_fts(query, over_fetch),
            )
            fts_results = await self._to_retrieved_chunks_with_distance(fts_rows, query_embedding)
        except Exception as exc:  # noqa: BLE001 - converted to a clean 502 below
            message = error_message(exc)
            logger.warning("RAG retrieval failed: %s", message)
            raise RuntimeError(message) from exc

        result = reciprocal_rank_fusion(vector_results, fts_results, top_k=top_k)
        _cache_set(cache_key, result)
        logger.info(
            "rag_retrieve cache=miss elapsed_ms=%d vector_candidates=%d fts_candidates=%d chunks=%d",
            int((time.monotonic() - started_at) * 1000),
            len(vector_results),
            len(fts_results),
            len(result),
        )
        return result

    async def _search_fts(self, query: str, limit: int) -> list:
        tsquery = func.plainto_tsquery("english", query)
        tsvector = func.to_tsvector("english", RagChunk.content)
        fts_stmt = (
            select(RagChunk, RagDocument.title, RagDocument.source)
            .join(RagDocument, RagChunk.document_id == RagDocument.id)
            .where(tsvector.op("@@")(tsquery))
            .order_by(func.ts_rank(tsvector, tsquery).desc())
            .limit(limit)
        )
        return (await self._db.execute(fts_stmt)).all()

    # Qdrant's `score` for a Cosine-distance collection is a similarity
    # (higher = better match) — the opposite convention from this
    # codebase's RetrievedChunk.distance (lower = more similar, matching
    # pgvector's `<=>` and domain/rag/fusion.py's cosine_distance()).
    # Converted here at the boundary so nothing downstream has to know
    # which backend produced a result.
    async def _search_vector(self, query_embedding: list[float], limit: int) -> list[RetrievedChunk]:
        settings = get_settings()
        response = await get_qdrant_client().query_points(
            collection_name=settings.qdrant_collection_name,
            query=query_embedding,
            limit=limit,
            with_payload=True,
        )
        return [
            RetrievedChunk(
                chunk_id=str(point.id),
                document_id=point.payload["document_id"],
                document_title=point.payload["document_title"],
                document_source=point.payload["document_source"],
                content=point.payload["content"],
                distance=1.0 - point.score,
            )
            for point in response.points
        ]

    # A chunk found only by the full-text query above has no distance from
    # that query alone (ts_rank is a relevance rank, not a distance — the
    # exact "don't mislabel a rank as a distance" bug fixed when hybrid
    # search was first built). Its vector still exists in Qdrant, so one
    # batched retrieve() (not one call per chunk) fetches it and computes a
    # real cosine distance via the same pure function the vector path's
    # semantics rely on.
    async def _to_retrieved_chunks_with_distance(
        self, rows: list, query_embedding: list[float]
    ) -> list[RetrievedChunk]:
        if not rows:
            return []
        settings = get_settings()
        records = await get_qdrant_client().retrieve(
            collection_name=settings.qdrant_collection_name,
            ids=[chunk.id for chunk, _, _ in rows],
            with_vectors=True,
        )
        vectors_by_id = {str(record.id): record.vector for record in records}

        results = []
        for chunk, title, source in rows:
            vector = vectors_by_id.get(chunk.id)
            # A chunk whose Qdrant point is missing (e.g. the ingest's
            # Postgres commit succeeded but its Qdrant upsert didn't — see
            # RagIngestionService) has no vector to compare — 1.0 (maximum
            # cosine distance) is an honest "least similar" fallback, not a
            # fabricated close match.
            distance = cosine_distance(vector, query_embedding) if vector is not None else 1.0
            results.append(
                RetrievedChunk(
                    chunk_id=chunk.id,
                    document_id=chunk.document_id,
                    document_title=title,
                    document_source=source,
                    content=chunk.content,
                    distance=distance,
                )
            )
        return results
