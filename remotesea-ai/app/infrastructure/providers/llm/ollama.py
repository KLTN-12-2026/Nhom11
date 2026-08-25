import json
from collections.abc import AsyncIterator

import httpx

from app.infrastructure.config import get_settings
from app.infrastructure.providers.llm.base import AiModelProvider
from app.infrastructure.providers.llm.retry import with_retry


class OllamaProvider(AiModelProvider):
    # get_provider() caches this instance for the process lifetime
    # (@lru_cache in factory.py), so building the client once here — instead
    # of a fresh `async with httpx.AsyncClient(...)` per call — gives real
    # HTTP keep-alive connection reuse across every request the service
    # ever handles, not just within one.
    def __init__(self) -> None:
        settings = get_settings()
        self._base_url = settings.ollama_base_url
        self._model = settings.resolved_ollama_model
        self._keep_alive = settings.ollama_keep_alive
        self._temperature = settings.ai_temperature
        # CPU-only local inference (see README: no GPU in dev) is slow —
        # ai_request_timeout_seconds is generous so a real answer doesn't
        # get cut off mid-generation on a small machine, matching
        # production's own eventual bound (vLLM/GPU) being far faster in
        # practice.
        self._client = httpx.AsyncClient(timeout=settings.ai_request_timeout_seconds)

    @property
    def model_version(self) -> str:
        return f"ollama:{self._model}"

    def _payload(
        self, system: str, prompt: str, json_schema: dict | None, stream: bool, model: str | None
    ) -> dict:
        return {
            "model": model or self._model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "stream": stream,
            # A full JSON Schema here requests grammar-constrained
            # decoding — Ollama cannot emit a field/type the schema
            # doesn't allow (verified live against this model). Falls back
            # to free-form "valid JSON, any shape" mode when the caller has
            # no schema to enforce.
            "format": json_schema if json_schema is not None else "json",
            # Keeps the model resident in memory between requests —
            # without this, Ollama's own (shorter) default unload window
            # can evict it, and the next call pays a multi-second reload
            # cost on top of generation time (observed live: a cold call's
            # load_duration alone was ~15.8s).
            "keep_alive": self._keep_alive,
            # Ollama defaults to 0.8 (fairly high randomness) — explicit
            # and low here since every call is a structured business
            # decision, not creative text (see Settings.ai_temperature).
            "options": {"temperature": self._temperature},
        }

    async def complete(
        self, system: str, prompt: str, json_schema: dict | None = None, model: str | None = None
    ) -> str:
        async def _call() -> dict:
            response = await self._client.post(
                f"{self._base_url}/api/chat",
                json=self._payload(system, prompt, json_schema, stream=False, model=model),
            )
            response.raise_for_status()
            return response.json()

        data = await with_retry(_call)
        return data["message"]["content"]

    async def stream(self, system: str, prompt: str, model: str | None = None) -> AsyncIterator[str]:
        payload = self._payload(system, prompt, json_schema=None, stream=True, model=model)
        async with self._client.stream("POST", f"{self._base_url}/api/chat", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                chunk = json.loads(line)
                content = chunk.get("message", {}).get("content", "")
                if content:
                    yield content
                if chunk.get("done"):
                    break

    async def aclose(self) -> None:
        await self._client.aclose()
