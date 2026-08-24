import time

from app.application import rag_retrieval_service as rag_module
from app.domain.rag.retrieved_chunk import RetrievedChunk


def _chunk(chunk_id: str = "c1") -> RetrievedChunk:
    return RetrievedChunk(
        chunk_id=chunk_id,
        document_id="d1",
        document_title="Doc",
        document_source="test",
        content="content",
        distance=0.1,
    )


class TestRagCache:
    def setup_method(self):
        rag_module.clear_cache()

    def teardown_method(self):
        rag_module.clear_cache()

    def test_miss_when_never_set(self):
        assert rag_module._cache_get(("query", 5)) is None

    def test_hit_after_set(self):
        chunks = [_chunk()]
        rag_module._cache_set(("query", 5), chunks)
        assert rag_module._cache_get(("query", 5)) == chunks

    def test_miss_for_different_top_k(self):
        rag_module._cache_set(("query", 5), [_chunk()])
        assert rag_module._cache_get(("query", 3)) is None

    def test_expires_after_ttl(self):
        rag_module._cache_set(("query", 5), [_chunk()])
        # Backdate the entry past the TTL instead of sleeping in a test.
        chunks = rag_module._cache[("query", 5)][1]
        rag_module._cache[("query", 5)] = (
            time.monotonic() - rag_module._CACHE_TTL_SECONDS - 1,
            chunks,
        )
        assert rag_module._cache_get(("query", 5)) is None

    def test_clear_cache_empties_everything(self):
        rag_module._cache_set(("query", 5), [_chunk()])
        rag_module.clear_cache()
        assert rag_module._cache_get(("query", 5)) is None

    def test_eviction_when_over_max_size(self):
        original_max = rag_module._CACHE_MAX_SIZE
        rag_module._CACHE_MAX_SIZE = 2
        try:
            rag_module._cache_set(("a", 5), [_chunk("a")])
            rag_module._cache_set(("b", 5), [_chunk("b")])
            rag_module._cache_set(("c", 5), [_chunk("c")])
            assert len(rag_module._cache) == 2
        finally:
            rag_module._CACHE_MAX_SIZE = original_max
