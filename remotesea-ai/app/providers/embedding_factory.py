from functools import lru_cache

from app.core.config import get_settings
from app.providers.embedding_base import EmbeddingProvider
from app.providers.mock_embedding import MockEmbeddingProvider
from app.providers.ollama_embedding import OllamaEmbeddingProvider


@lru_cache
def get_embedding_provider() -> EmbeddingProvider:
    settings = get_settings()
    if settings.embedding_provider == "OLLAMA":
        return OllamaEmbeddingProvider()
    if settings.embedding_provider == "MOCK":
        return MockEmbeddingProvider()
    raise ValueError(f"Unsupported EMBEDDING_PROVIDER: {settings.embedding_provider}")
