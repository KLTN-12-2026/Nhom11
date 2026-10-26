import pytest
from pydantic import BaseModel, Field

from app.application.structured_completion import complete_structured
from app.infrastructure.providers.llm.mock import MockProvider


class _Answer(BaseModel):
    text: str
    score: int = Field(ge=0, le=100)


class _SequencedProvider(MockProvider):
    """Returns a different canned response on each successive call —
    MockProvider always returns the same string, which can't exercise the
    "first attempt fails, second succeeds" retry path."""

    def __init__(self, responses: list[str]) -> None:
        super().__init__()
        self._responses = list(responses)
        self.call_count = 0

    async def complete(self, system, prompt, json_schema=None, model=None) -> str:
        self.call_count += 1
        return self._responses[min(self.call_count - 1, len(self._responses) - 1)]


class TestCompleteStructured:
    @pytest.mark.asyncio
    async def test_succeeds_on_first_attempt(self):
        provider = _SequencedProvider(['{"text": "hi", "score": 90}'])
        raw, parsed = await complete_structured(provider, _Answer, "system", "prompt")
        assert parsed is not None
        assert parsed.text == "hi"
        assert provider.call_count == 1

    @pytest.mark.asyncio
    async def test_retries_once_after_unparseable_first_attempt(self):
        provider = _SequencedProvider(["not json at all", '{"text": "recovered", "score": 50}'])
        raw, parsed = await complete_structured(provider, _Answer, "system", "prompt")
        assert parsed is not None
        assert parsed.text == "recovered"
        assert provider.call_count == 2

    @pytest.mark.asyncio
    async def test_returns_none_when_both_attempts_fail(self):
        provider = _SequencedProvider(["still not json", "also not json"])
        raw, parsed = await complete_structured(provider, _Answer, "system", "prompt")
        assert parsed is None
        assert raw == "also not json"
        assert provider.call_count == 2

    @pytest.mark.asyncio
    async def test_passes_model_override_through(self):
        provider = _SequencedProvider(['{"text": "ok", "score": 1}'])
        await complete_structured(provider, _Answer, "system", "prompt", model="tiny-model")
        # MockProvider ignores the model param but must accept it without error.
        assert provider.call_count == 1
