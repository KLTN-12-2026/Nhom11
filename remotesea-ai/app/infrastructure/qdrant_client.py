from functools import lru_cache

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams

from app.infrastructure.config import get_settings

# get_qdrant_client() caches this instance for the process lifetime (same
# @lru_cache pattern as infrastructure/providers/llm/factory.py) — one
# long-lived client reused across every RAG ingest/search call, not a fresh
# connection per call.
@lru_cache
def get_qdrant_client() -> AsyncQdrantClient:
    settings = get_settings()
    return AsyncQdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)


# Idempotent — checks existence first, so calling this on every ingest (not
# just once at setup) is safe and cheap, and there's no separate "did you
# remember to run the setup script" onboarding step beyond the two env vars.
# Cosine distance matches this codebase's own convention everywhere else
# (pgvector's `<=>` operator, domain/rag/fusion.py's cosine_distance()).
async def ensure_collection() -> None:
    settings = get_settings()
    client = get_qdrant_client()
    if not await client.collection_exists(settings.qdrant_collection_name):
        await client.create_collection(
            collection_name=settings.qdrant_collection_name,
            vectors_config=VectorParams(
                size=settings.embedding_dimensions, distance=Distance.COSINE
            ),
        )
