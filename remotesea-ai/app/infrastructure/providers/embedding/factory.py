from functools import lru_cache

from app.infrastructure.config import get_settings
from app.infrastructure.providers.embedding.base import EmbeddingProvider
from app.infrastructure.providers.embedding.cloudflare import CloudflareEmbeddingProvider
from app.infrastructure.providers.embedding.mock import MockEmbeddingProvider
from app.infrastructure.providers.embedding.ollama import OllamaEmbeddingProvider


@lru_cache
def get_embedding_provider() -> EmbeddingProvider:
    settings = get_settings()
    if settings.embedding_provider == "OLLAMA":
        return OllamaEmbeddingProvider()
    if settings.embedding_provider == "CLOUDFLARE":
        return CloudflareEmbeddingProvider()
    if settings.embedding_provider == "MOCK":
        return MockEmbeddingProvider()
    raise ValueError(f"Unsupported EMBEDDING_PROVIDER: {settings.embedding_provider}")
