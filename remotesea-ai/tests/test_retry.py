import httpx
import pytest

from app.infrastructure.providers.llm.errors import AiProviderError
from app.infrastructure.providers.llm.retry import with_retry


def _status_error(status_code: int) -> httpx.HTTPStatusError:
    request = httpx.Request("POST", "http://example.test")
    response = httpx.Response(status_code, request=request)
    return httpx.HTTPStatusError("error", request=request, response=response)


class _FlakyCall:
    def __init__(self, exceptions: list[Exception], result: str = "ok") -> None:
        self._exceptions = list(exceptions)
        self._result = result
        self.attempts = 0

    async def __call__(self) -> str:
        self.attempts += 1
        if self._exceptions:
            raise self._exceptions.pop(0)
        return self._result


class TestWithRetry:
    @pytest.mark.asyncio
    async def test_succeeds_on_first_try(self):
        call = _FlakyCall([])
        result = await with_retry(call)
        assert result == "ok"
        assert call.attempts == 1

    @pytest.mark.asyncio
    async def test_retries_connect_error_then_succeeds(self):
        call = _FlakyCall([httpx.ConnectError("refused")])
        result = await with_retry(call)
        assert result == "ok"
        assert call.attempts == 2

    @pytest.mark.asyncio
    async def test_retries_503_then_succeeds(self):
        call = _FlakyCall([_status_error(503)])
        result = await with_retry(call)
        assert result == "ok"
        assert call.attempts == 2

    @pytest.mark.asyncio
    async def test_retries_429_then_succeeds(self):
        call = _FlakyCall([_status_error(429)])
        result = await with_retry(call)
        assert result == "ok"
        assert call.attempts == 2

    @pytest.mark.asyncio
    async def test_does_not_retry_400(self):
        call = _FlakyCall([_status_error(400)])
        with pytest.raises(AiProviderError):
            await with_retry(call)
        assert call.attempts == 1

    @pytest.mark.asyncio
    async def test_does_not_retry_timeout(self):
        call = _FlakyCall([httpx.TimeoutException("slow")])
        with pytest.raises(AiProviderError):
            await with_retry(call)
        assert call.attempts == 1

    @pytest.mark.asyncio
    async def test_exhausts_retries_and_raises(self):
        call = _FlakyCall([_status_error(500), _status_error(500), _status_error(500)])
        with pytest.raises(AiProviderError):
            await with_retry(call)
        assert call.attempts == 3
