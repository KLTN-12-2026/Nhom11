import httpx

from app.core.config import get_settings
from app.providers.embedding_base import EmbeddingProvider

_REQUEST_TIMEOUT_SECONDS = 60.0


class OllamaEmbeddingProvider(EmbeddingProvider):
    def __init__(self) -> None:
        settings = get_settings()
        self._base_url = settings.ollama_base_url
        self._model = settings.ollama_embedding_model

    # Ollama's /api/embed accepts a batch (`input: [...]`) natively, so this
    # is one HTTP call regardless of how many chunks are being embedded —
    # not a loop of per-text requests.
    async def embed(self, texts: list[str]) -> list[list[float]]:
        async with httpx.AsyncClient(timeout=_REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{self._base_url}/api/embed",
                json={"model": self._model, "input": texts},
            )
            response.raise_for_status()
            data = response.json()
            return data["embeddings"]
