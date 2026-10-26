import math

from app.domain.rag.retrieved_chunk import RetrievedChunk

# Same definition pgvector's `<=>` operator uses (1 - cosine similarity) —
# kept in Python so a chunk found only via full-text search (no SQL-computed
# vector distance available for it) can still get a real, comparable
# distance value rather than a ts_rank score mislabeled as one.
def cosine_distance(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 1.0
    return 1.0 - dot / (norm_a * norm_b)


# Standard RRF constant — large enough that rank differences among the top
# few results still matter (a small k would let rank 1 dominate too
# strongly), the conventional default in RRF literature/implementations.
_DEFAULT_RRF_K = 60


# Combines two independently-ranked result lists (vector similarity, full-
# text search) into one ranking without needing their scores to be on
# comparable scales — cosine distance and ts_rank aren't directly
# comparable, but rank position always is. A chunk found by only one method
# still ranks by that method's position alone; when the FTS side returns
# nothing (no keyword overlap), this reduces to exactly the vector-only
# ranking — never worse than retrieval before this existed.
def reciprocal_rank_fusion(
    vector_results: list[RetrievedChunk],
    fts_results: list[RetrievedChunk],
    top_k: int,
    k: int = _DEFAULT_RRF_K,
) -> list[RetrievedChunk]:
    scores: dict[str, float] = {}
    chunks_by_id: dict[str, RetrievedChunk] = {}

    for rank, chunk in enumerate(vector_results, start=1):
        scores[chunk.chunk_id] = scores.get(chunk.chunk_id, 0.0) + 1.0 / (k + rank)
        chunks_by_id[chunk.chunk_id] = chunk

    for rank, chunk in enumerate(fts_results, start=1):
        scores[chunk.chunk_id] = scores.get(chunk.chunk_id, 0.0) + 1.0 / (k + rank)
        chunks_by_id.setdefault(chunk.chunk_id, chunk)

    ranked_ids = sorted(scores, key=lambda chunk_id: scores[chunk_id], reverse=True)
    return [chunks_by_id[chunk_id] for chunk_id in ranked_ids[:top_k]]
