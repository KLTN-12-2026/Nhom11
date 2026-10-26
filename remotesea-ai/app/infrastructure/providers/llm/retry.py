import asyncio
from collections.abc import Awaitable, Callable
from typing import TypeVar

import httpx

from app.infrastructure.providers.llm.errors import AiProviderError

T = TypeVar("T")

_MAX_ATTEMPTS = 3
_BASE_DELAY_SECONDS = 1.0
_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


def _is_retryable(exc: Exception) -> bool:
    # Connection errors and 429/5xx are transient — worth one more try.
    # Deliberately NOT httpx.TimeoutException: on Ollama's CPU-only local
    # inference a timeout usually means "still generating," not "transient
    # network blip," and retrying would restart an already-slow generation
    # from scratch instead of helping. A 400/401 (bad request/bad API key)
    # will never succeed on retry either way, so those raise immediately.
    if isinstance(exc, httpx.ConnectError):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in _RETRYABLE_STATUS_CODES
    return False


# Shared by every provider's HTTP call (Ollama/Anthropic/Gemini all use raw
# httpx, not vendor SDKs) so retry/backoff behavior is identical across
# vendors rather than reimplemented per provider — call your request inside
# a zero-arg async closure and pass it here.
async def with_retry(call: Callable[[], Awaitable[T]]) -> T:
    last_exc: Exception | None = None
    for attempt in range(_MAX_ATTEMPTS):
        try:
            return await call()
        except Exception as exc:  # noqa: BLE001 - re-raised as AiProviderError below
            last_exc = exc
            if not _is_retryable(exc) or attempt == _MAX_ATTEMPTS - 1:
                raise AiProviderError(str(exc)) from exc
            await asyncio.sleep(_BASE_DELAY_SECONDS * (2**attempt))
    raise AiProviderError(str(last_exc)) from last_exc
