import httpx

from app.infrastructure.config import get_settings
from app.infrastructure.providers.embedding.base import EmbeddingProvider

_REQUEST_TIMEOUT_SECONDS = 60.0


class OllamaEmbeddingProvider(EmbeddingProvider):
    # get_embedding_provider() caches this instance for the process
    # lifetime (@lru_cache in factory.py) — same reasoning as
    # OllamaProvider: build the client once for real keep-alive reuse
    # across every embed() call, not a fresh connection per call.
    def __init__(self) -> None:
        settings = get_settings()
        self._base_url = settings.ollama_base_url
        self._model = settings.ollama_embedding_model
        self._keep_alive = settings.ollama_keep_alive
        self._client = httpx.AsyncClient(timeout=_REQUEST_TIMEOUT_SECONDS)

    # Ollama's /api/embed accepts a batch (`input: [...]`) natively, so this
    # is one HTTP call regardless of how many chunks are being embedded —
    # not a loop of per-text requests.
    async def embed(self, texts: list[str]) -> list[list[float]]:
        response = await self._client.post(
            f"{self._base_url}/api/embed",
            json={"model": self._model, "input": texts, "keep_alive": self._keep_alive},
        )
        response.raise_for_status()
        data = response.json()
        return data["embeddings"]

    async def aclose(self) -> None:
        await self._client.aclose()
