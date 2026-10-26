from app.domain.rag.fusion import cosine_distance, reciprocal_rank_fusion
from app.domain.rag.retrieved_chunk import RetrievedChunk


def _chunk(chunk_id: str, distance: float = 0.3) -> RetrievedChunk:
    return RetrievedChunk(
        chunk_id=chunk_id,
        document_id=f"doc-{chunk_id}",
        document_title=f"Doc {chunk_id}",
        document_source="test",
        content="content",
        distance=distance,
    )


class TestReciprocalRankFusion:
    def test_empty_fts_degrades_to_vector_order(self):
        vector_results = [_chunk("a"), _chunk("b"), _chunk("c")]
        fused = reciprocal_rank_fusion(vector_results, [], top_k=3)
        assert [c.chunk_id for c in fused] == ["a", "b", "c"]

    def test_chunk_found_by_both_ranks_above_single_method_matches(self):
        vector_results = [_chunk("a"), _chunk("b"), _chunk("c")]
        fts_results = [_chunk("b"), _chunk("d")]
        fused = reciprocal_rank_fusion(vector_results, fts_results, top_k=4)
        assert fused[0].chunk_id == "b"

    def test_disjoint_result_sets_both_included(self):
        vector_results = [_chunk("a"), _chunk("b")]
        fts_results = [_chunk("c"), _chunk("d")]
        fused = reciprocal_rank_fusion(vector_results, fts_results, top_k=4)
        assert {c.chunk_id for c in fused} == {"a", "b", "c", "d"}

    def test_respects_top_k(self):
        vector_results = [_chunk(str(i)) for i in range(10)]
        fused = reciprocal_rank_fusion(vector_results, [], top_k=3)
        assert len(fused) == 3

    def test_fts_only_chunk_included_when_vector_empty(self):
        fts_results = [_chunk("x")]
        fused = reciprocal_rank_fusion([], fts_results, top_k=3)
        assert [c.chunk_id for c in fused] == ["x"]


class TestCosineDistance:
    def test_identical_vectors_have_zero_distance(self):
        assert cosine_distance([1.0, 0.0], [1.0, 0.0]) == 0.0

    def test_orthogonal_vectors_have_distance_one(self):
        assert cosine_distance([1.0, 0.0], [0.0, 1.0]) == 1.0

    def test_opposite_vectors_have_distance_two(self):
        assert cosine_distance([1.0, 0.0], [-1.0, 0.0]) == 2.0

    def test_zero_vector_returns_max_distance(self):
        assert cosine_distance([0.0, 0.0], [1.0, 0.0]) == 1.0
