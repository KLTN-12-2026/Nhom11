import json
from collections.abc import AsyncIterator

import httpx

from app.infrastructure.config import get_settings
from app.infrastructure.providers.llm.base import AiModelProvider
from app.infrastructure.providers.llm.errors import AiProviderError
from app.infrastructure.providers.llm.retry import with_retry

_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


# Raw httpx, not the `google-genai` SDK — same reasoning as
# AnthropicProvider: generateContent is a stable, simple REST endpoint, and
# responseSchema/responseMimeType is Gemini's own documented
# schema-constrained-output mechanism (functionally the same idea as
# Ollama's `format: <schema>`), so no prompt-only JSON-mode fallback is
# needed. Note: Gemini's responseSchema is an OpenAPI-3.0 subset, not full
# JSON Schema (no $defs/$ref support) — this service's schema-using models
# (CandidateAnalysisResult, _ParsedAnswer, _ToolSelection) are all flat, so
# Pydantic's model_json_schema() output should be compatible as-is; this is
# an assumption to confirm against a real key, not something verified here.
class GeminiProvider(AiModelProvider):
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required when AI_PROVIDER=GEMINI")
        self._model = settings.ai_model
        self._api_key = settings.gemini_api_key
        self._client = httpx.AsyncClient(base_url=_API_BASE, timeout=settings.ai_request_timeout_seconds)

    @property
    def model_version(self) -> str:
        return f"gemini:{self._model}"

    async def complete(self, system: str, prompt: str, json_schema: dict | None = None) -> str:
        payload = _build_payload(system, prompt, json_schema)

        async def _call() -> dict:
            response = await self._client.post(
                f"/models/{self._model}:generateContent",
                params={"key": self._api_key},
                json=payload,
            )
            response.raise_for_status()
            return response.json()

        data = await with_retry(_call)
        return _extract_text(data)

    async def stream(self, system: str, prompt: str) -> AsyncIterator[str]:
        payload = _build_payload(system, prompt, json_schema=None)
        async with self._client.stream(
            "POST",
            f"/models/{self._model}:streamGenerateContent",
            params={"key": self._api_key, "alt": "sse"},
            json=payload,
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                event = json.loads(line[len("data: ") :])
                text = _extract_text_optional(event)
                if text:
                    yield text

    async def aclose(self) -> None:
        await self._client.aclose()


# Pure — no I/O — so both are unit-testable without a live API key.
def _build_payload(system: str, prompt: str, json_schema: dict | None) -> dict:
    payload: dict = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": system}]},
    }
    if json_schema is not None:
        payload["generationConfig"] = {
            "responseMimeType": "application/json",
            "responseSchema": json_schema,
        }
    return payload


def _extract_text(data: dict) -> str:
    text = _extract_text_optional(data)
    if text is None:
        raise AiProviderError("Gemini response had no text content")
    return text


def _extract_text_optional(data: dict) -> str | None:
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return None
