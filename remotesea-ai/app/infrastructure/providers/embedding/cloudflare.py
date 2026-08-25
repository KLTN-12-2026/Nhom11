import httpx

from app.infrastructure.config import get_settings
from app.infrastructure.providers.embedding.base import EmbeddingProvider
from app.infrastructure.providers.llm.errors import AiProviderError
from app.infrastructure.providers.llm.retry import with_retry

_API_BASE = "https://api.cloudflare.com/client/v4"


# Same account/token as CloudflareProvider (LLM) — Workers AI auth is
# account-scoped, one token covers every model that account can run,
# embedding included. Exists for deployments with no self-hosted Ollama to
# point OLLAMA_EMBEDDING_MODEL at (see OllamaEmbeddingProvider): RAG
# retrieval and chat's question-embedding otherwise have no working
# EMBEDDING_PROVIDER at all in that case, and fail every request rather
# than degrade gracefully — this was a real production 502 on every chat
# message, not a hypothetical.
class CloudflareEmbeddingProvider(EmbeddingProvider):
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.cloudflare_account_id or not settings.cloudflare_api_token:
            raise ValueError(
                "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required "
                "when EMBEDDING_PROVIDER=CLOUDFLARE"
            )
        self._model = settings.cloudflare_embedding_model
        self._run_path = f"/accounts/{settings.cloudflare_account_id}/ai/run/{self._model}"
        self._client = httpx.AsyncClient(
            base_url=_API_BASE,
            timeout=settings.ai_request_timeout_seconds,
            headers={"Authorization": f"Bearer {settings.cloudflare_api_token}"},
        )

    # Workers AI's BGE embedding models accept a batch (`text: [...]`)
    # natively, same "one HTTP call, not a loop of per-text requests"
    # reasoning OllamaEmbeddingProvider's /api/embed call already follows.
    async def embed(self, texts: list[str]) -> list[list[float]]:
        async def _call() -> dict:
            response = await self._client.post(self._run_path, json={"text": texts})
            response.raise_for_status()
            return response.json()

        data = await with_retry(_call)
        return _extract_vectors(data)

    async def aclose(self) -> None:
        await self._client.aclose()


# Pure — no I/O — so this is unit-testable without a live API token. Same
# {"result": ..., "success": ...} envelope as the LLM provider's
# _extract_text — Workers AI's response shape is consistent across model
# types, only `result`'s own shape differs (`{"shape": [n, dim], "data":
# [[...], ...]}` for embedding models vs `{"response": ...}` for text ones).
def _extract_vectors(data: dict) -> list[list[float]]:
    if not data.get("success", False):
        raise AiProviderError(f"Cloudflare Workers AI embedding request failed: {data.get('errors')}")
    try:
        return data["result"]["data"]
    except (KeyError, TypeError):
        raise AiProviderError("Cloudflare Workers AI embedding response had no result.data") from None
