from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.datasets import router as datasets_router
from app.api.feedback import router as feedback_router
from app.api.health import router as health_router
from app.api.inference import router as inference_router
from app.api.model_registry import router as model_registry_router
from app.api.orchestrator import router as orchestrator_router
from app.api.rag import router as rag_router
from app.infrastructure import remotesea_api_client
from app.infrastructure.logging import configure_logging
from app.infrastructure.providers.embedding.factory import get_embedding_provider
from app.infrastructure.providers.llm.factory import get_provider
from app.infrastructure.qdrant_client import get_qdrant_client

configure_logging()


# get_provider()/get_embedding_provider() are @lru_cache singletons holding
# a persistent httpx.AsyncClient each (see infrastructure/providers/*/ollama.py)
# — this closes those connections on shutdown, same for
# remotesea_api_client's module-level client and the Qdrant client
# (AsyncQdrantClient.close(), not aclose() — hence checking both names).
# MockProvider/MockEmbeddingProvider hold no client, hence the getattr guard
# rather than assuming every provider has a close method.
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    provider = get_provider()
    if aclose := getattr(provider, "aclose", None):
        await aclose()
    embedding_provider = get_embedding_provider()
    if aclose := getattr(embedding_provider, "aclose", None):
        await aclose()
    await remotesea_api_client.aclose()
    await get_qdrant_client().close()


app = FastAPI(
    title="RemoteSea AI Service",
    description="Self-hosted AI microservice for RemoteSea — inference, "
    "RAG, feedback, dataset, training, evaluation, model registry, and the "
    "AI Orchestrator (see README.md for the phased rollout).",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(inference_router)
app.include_router(feedback_router)
app.include_router(datasets_router)
app.include_router(model_registry_router)
app.include_router(orchestrator_router)
app.include_router(rag_router)
