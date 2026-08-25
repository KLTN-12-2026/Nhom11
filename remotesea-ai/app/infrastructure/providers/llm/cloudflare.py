import json
from collections.abc import AsyncIterator

import httpx

from app.infrastructure.config import get_settings
from app.infrastructure.providers.llm.base import AiModelProvider
from app.infrastructure.providers.llm.errors import AiProviderError
from app.infrastructure.providers.llm.retry import with_retry

_API_BASE = "https://api.cloudflare.com/client/v4"


# Raw httpx, not a Cloudflare SDK — same "no new dependency unless truly
# needed" reasoning every other provider follows; Workers AI's /ai/run
# endpoint is a stable, simple REST call. Structured output uses Cloudflare's
# OpenAI-compatible `response_format: {"type": "json_object"}` — this only
# guarantees syntactically valid JSON, not schema conformance (unlike
# Ollama's grammar-constrained `format: <schema>` or Anthropic's forced
# tool-use). Cloudflare's stricter `json_schema` response_format exists but
# is only documented for a subset of models, so this doesn't depend on it —
# the schema is also spelled out in the prompt as an explicit instruction,
# and complete_structured's existing retry-once-on-invalid-JSON covers the
# gap versus true grammar-constrained decoding. Same honest,
# not-overclaiming treatment already given to Gemini's OpenAPI-subset
# responseSchema.
class CloudflareProvider(AiModelProvider):
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.cloudflare_account_id or not settings.cloudflare_api_token:
            raise ValueError(
                "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required when AI_PROVIDER=CLOUDFLARE"
            )
        self._account_id = settings.cloudflare_account_id
        self._model = settings.ai_model
        self._temperature = settings.ai_temperature
        self._client = httpx.AsyncClient(
            base_url=_API_BASE,
            timeout=settings.ai_request_timeout_seconds,
            headers={"Authorization": f"Bearer {settings.cloudflare_api_token}"},
        )

    @property
    def model_version(self) -> str:
        return f"cloudflare:{self._model}"

    def _run_path(self, model: str | None) -> str:
        return f"/accounts/{self._account_id}/ai/run/{model or self._model}"

    def _payload(self, system: str, prompt: str, json_schema: dict | None, stream: bool) -> dict:
        user_content = prompt
        if json_schema is not None:
            # response_format below only guarantees valid JSON syntax, not
            # this schema's shape — spelling out the expected shape here is
            # the actual mechanism steering the model toward the right
            # fields. A flat example object (not the raw JSON Schema
            # dump — properties/required/title/type keys and all) is what
            # actually works: live-tested against @cf/meta/llama-3.1-8b-
            # instruct, the raw schema made it echo the *schema's own*
            # structure back (a "properties"/"required" object) instead of
            # data conforming to it, every attempt; the example form fixed
            # this immediately.
            user_content = (
                f"{prompt}\n\nRespond with ONLY a JSON object in exactly this shape "
                f"(replace the placeholder values with real ones):\n"
                f"{json.dumps(_schema_example(json_schema))}"
            )
        payload: dict = {
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user_content},
            ],
            "stream": stream,
            # Cloudflare defaults vary by model — low here for the same
            # reason every other provider's is (see Settings.ai_temperature).
            "temperature": self._temperature,
        }
        if json_schema is not None:
            payload["response_format"] = {"type": "json_object"}
        return payload

    async def complete(
        self, system: str, prompt: str, json_schema: dict | None = None, model: str | None = None
    ) -> str:
        payload = self._payload(system, prompt, json_schema, stream=False)

        async def _call() -> dict:
            response = await self._client.post(self._run_path(model), json=payload)
            response.raise_for_status()
            return response.json()

        data = await with_retry(_call)
        return _extract_text(data)

    async def stream(self, system: str, prompt: str, model: str | None = None) -> AsyncIterator[str]:
        payload = self._payload(system, prompt, json_schema=None, stream=True)
        async with self._client.stream("POST", self._run_path(model), json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                raw_event = line[len("data: ") :]
                if raw_event == "[DONE]":
                    break
                event = json.loads(raw_event)
                text = _extract_stream_delta(event)
                if text:
                    yield text

    async def aclose(self) -> None:
        await self._client.aclose()


# Pure — no I/O. Each stream chunk's top-level "response" field is the raw
# next token, but Workers AI serializes it inconsistently — a numeric-
# looking token (e.g. "1", "2") comes through as a JSON number, not a
# string (confirmed live: choices[0].delta.content stayed a string the
# whole time while response flipped between str/int chunk to chunk).
# choices[0].delta.content is the standard OpenAI-compatible streaming
# field and was reliably a string throughout, so this reads that instead.
def _extract_stream_delta(event: dict) -> str | None:
    try:
        return event["choices"][0]["delta"].get("content")
    except (KeyError, IndexError, TypeError):
        return None


# Pure — no I/O. Converts a JSON Schema into a flat "fill in this shape"
# example object — see _payload's comment for why (raw JSON Schema syntax
# confused this model into echoing the schema itself back). Every
# json_schema this codebase passes (_ParsedAnswer, _ToolSelection,
# CandidateAnalysisResult) is a flat object of primitives/enums/string-
# arrays, so this only needs to handle those shapes, not arbitrary nesting.
def _schema_example(schema: dict) -> dict:
    return {name: _placeholder_for(prop) for name, prop in schema.get("properties", {}).items()}


def _placeholder_for(prop: dict) -> object:
    if "enum" in prop:
        return "|".join(str(value) for value in prop["enum"])
    prop_type = prop.get("type")
    if prop_type == "array":
        return [_placeholder_for(prop.get("items", {}))]
    if prop_type == "object":
        return _schema_example(prop)
    return {
        "string": "<string>",
        "integer": "<integer>",
        "number": "<number>",
        "boolean": "<true or false>",
    }.get(prop_type, "<value>")


# Pure — no I/O — so this is unit-testable without a live API token.
def _extract_text(data: dict) -> str:
    if not data.get("success", False):
        raise AiProviderError(f"Cloudflare Workers AI request failed: {data.get('errors')}")
    try:
        response = data["result"]["response"]
    except (KeyError, TypeError):
        raise AiProviderError("Cloudflare Workers AI response had no result.response") from None
    # response_format={"type": "json_object"} makes Workers AI return
    # result.response as an already-parsed JSON object (dict), not a JSON
    # string like the plain-text case — confirmed live against
    # @cf/meta/llama-3.1-8b-instruct. complete()'s contract is always a
    # string (parse_json_object re-parses it downstream either way), so
    # serialize it back rather than pass the dict through raw.
    if isinstance(response, dict):
        return json.dumps(response)
    return response
