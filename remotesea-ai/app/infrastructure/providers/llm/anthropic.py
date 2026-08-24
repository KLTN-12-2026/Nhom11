import json
from collections.abc import AsyncIterator

import httpx

from app.infrastructure.config import get_settings
from app.infrastructure.providers.llm.base import AiModelProvider
from app.infrastructure.providers.llm.errors import AiProviderError
from app.infrastructure.providers.llm.retry import with_retry

_API_VERSION = "2023-06-01"
# Generous but bounded — every current caller's schema is small (a handful
# of fields), so this is a ceiling against a runaway response, not a tuned
# budget.
_MAX_TOKENS = 4096
_STRUCTURED_OUTPUT_TOOL_NAME = "structured_output"


# Raw httpx, not the `anthropic` SDK — same "no new dependency unless truly
# needed" reasoning OllamaProvider already follows; the Messages API is a
# stable, simple REST endpoint (POST /v1/messages). Structured output uses
# Anthropic's documented tool-use pattern (a single forced tool whose
# input_schema is the caller's json_schema) rather than prompt-only JSON
# mode — Claude has no bare "format: json"/schema equivalent, and forcing a
# tool call is Anthropic's own recommended mechanism for schema-constrained
# output.
class AnthropicProvider(AiModelProvider):
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY is required when AI_PROVIDER=ANTHROPIC")
        self._model = settings.ai_model
        self._client = httpx.AsyncClient(
            base_url="https://api.anthropic.com",
            timeout=settings.ai_request_timeout_seconds,
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": _API_VERSION,
                "content-type": "application/json",
            },
        )

    @property
    def model_version(self) -> str:
        return f"anthropic:{self._model}"

    def _payload(self, system: str, prompt: str, json_schema: dict | None, stream: bool) -> dict:
        payload: dict = {
            "model": self._model,
            "max_tokens": _MAX_TOKENS,
            "system": system,
            "messages": [{"role": "user", "content": prompt}],
            "stream": stream,
        }
        if json_schema is not None:
            payload["tools"] = [{"name": _STRUCTURED_OUTPUT_TOOL_NAME, "input_schema": json_schema}]
            payload["tool_choice"] = {"type": "tool", "name": _STRUCTURED_OUTPUT_TOOL_NAME}
        return payload

    async def complete(self, system: str, prompt: str, json_schema: dict | None = None) -> str:
        payload = self._payload(system, prompt, json_schema, stream=False)

        async def _call() -> dict:
            response = await self._client.post("/v1/messages", json=payload)
            response.raise_for_status()
            return response.json()

        data = await with_retry(_call)
        return _extract_text(data, structured=json_schema is not None)

    async def stream(self, system: str, prompt: str) -> AsyncIterator[str]:
        payload = self._payload(system, prompt, json_schema=None, stream=True)
        async with self._client.stream("POST", "/v1/messages", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                event = json.loads(line[len("data: ") :])
                if event.get("type") == "content_block_delta":
                    text = event.get("delta", {}).get("text")
                    if text:
                        yield text

    async def aclose(self) -> None:
        await self._client.aclose()


# Pure — no I/O — so this is unit-testable without a live API key.
def _extract_text(data: dict, structured: bool) -> str:
    content = data.get("content", [])
    if structured:
        for block in content:
            if block.get("type") == "tool_use":
                return json.dumps(block.get("input", {}))
        raise AiProviderError("Anthropic response had no tool_use block for structured output")
    for block in content:
        if block.get("type") == "text":
            return block.get("text", "")
    raise AiProviderError("Anthropic response had no text block")
