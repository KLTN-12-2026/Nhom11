import httpx

from app.infrastructure.config import get_settings
from app.infrastructure.providers.llm.base import AiModelProvider

# CPU-only local inference (see README: no GPU in dev) is slow — generous
# timeout so a real answer doesn't get cut off mid-generation on a small
# machine, matching production's own eventual bound (vLLM/GPU) being far
# faster in practice. Bumped from 180s after CANDIDATE_ANALYSIS's richer
# output schema (5 fields incl. missingRequirements + reasoning, vs. the
# original 4) pushed real generation time past that on this dev machine.
REQUEST_TIMEOUT_SECONDS = 300.0


class OllamaProvider(AiModelProvider):
    # get_provider() caches this instance for the process lifetime
    # (@lru_cache in factory.py), so building the client once here — instead
    # of a fresh `async with httpx.AsyncClient(...)` per call — gives real
    # HTTP keep-alive connection reuse across every request the service
    # ever handles, not just within one.
    def __init__(self) -> None:
        settings = get_settings()
        self._base_url = settings.ollama_base_url
        self._model = settings.ollama_model
        self._keep_alive = settings.ollama_keep_alive
        self._client = httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS)

    @property
    def model_version(self) -> str:
        return f"ollama:{self._model}"

    async def complete(self, system: str, prompt: str, json_schema: dict | None = None) -> str:
        response = await self._client.post(
            f"{self._base_url}/api/chat",
            json={
                "model": self._model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "stream": False,
                # A full JSON Schema here requests grammar-constrained
                # decoding — Ollama cannot emit a field/type the schema
                # doesn't allow (verified live against this model).
                # Falls back to free-form "valid JSON, any shape" mode
                # when the caller has no schema to enforce.
                "format": json_schema if json_schema is not None else "json",
                # Keeps the model resident in memory between requests —
                # without this, Ollama's own (shorter) default unload
                # window can evict it, and the next call pays a multi-
                # second reload cost on top of generation time (observed
                # live: a cold call's load_duration alone was ~15.8s).
                "keep_alive": self._keep_alive,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["message"]["content"]

    async def aclose(self) -> None:
        await self._client.aclose()
