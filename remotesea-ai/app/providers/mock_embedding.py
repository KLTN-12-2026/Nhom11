import hashlib

from app.core.config import get_settings
from app.providers.embedding_base import EmbeddingProvider


# Deterministic, zero-network — a text's embedding is derived from its own
# hash, not a real semantic representation. Good enough to exercise
# ingestion/storage/pgvector-search plumbing in tests without Ollama
# running; not meant to produce meaningful similarity rankings.
class MockEmbeddingProvider(EmbeddingProvider):
    async def embed(self, texts: list[str]) -> list[list[float]]:
        dimensions = get_settings().embedding_dimensions
        return [self._vector_for(text, dimensions) for text in texts]

    @staticmethod
    def _vector_for(text: str, dimensions: int) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        return [digest[i % len(digest)] / 255.0 for i in range(dimensions)]
