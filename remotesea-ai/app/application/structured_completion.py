from typing import TypeVar

from pydantic import BaseModel

from app.domain.shared.llm_json import parse_json_object
from app.infrastructure.providers.llm.base import AiModelProvider

T = TypeVar("T", bound=BaseModel)

_MAX_ATTEMPTS = 2


# Schema-constrained decoding (AiModelProvider.complete's json_schema) makes
# an invalid response rare, not impossible — a provider whose schema
# support is imperfect (e.g. Gemini's OpenAPI-subset responseSchema), or a
# model that still deviates, gets one more chance before the caller falls
# back to its own existing failure handling. Shared by InferenceService and
# OrchestratorService instead of each reimplementing the same "call, parse,
# retry once on failure" loop. Returns the *last* attempt's raw text
# alongside the parsed result — parsed is None only if every attempt failed
# to validate, matching callers' existing "unparseable response" fallback
# behavior exactly, just with one more try first. `attempts` (how many LLM
# calls it took) is surfaced so callers can log a real reliability signal —
# a response that only validated on attempt 2 is a genuine, observable
# structured-output quality issue, not something worth losing once the
# retry silently succeeds.
async def complete_structured(
    provider: AiModelProvider,
    model_type: type[T],
    system: str,
    prompt: str,
    *,
    model: str | None = None,
) -> tuple[str, T | None, int]:
    raw = ""
    json_schema = model_type.model_json_schema()
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        raw = await provider.complete(system, prompt, json_schema=json_schema, model=model)
        parsed = parse_json_object(raw, model_type)
        if parsed is not None:
            return raw, parsed, attempt
    return raw, None, _MAX_ATTEMPTS
