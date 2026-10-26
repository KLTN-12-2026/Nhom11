import pytest

from app.infrastructure.providers.llm.errors import AiProviderError
from app.infrastructure.providers.llm.gemini import (
    _build_payload,
    _extract_text,
    _extract_text_optional,
)


class TestBuildPayload:
    def test_includes_system_and_user_content(self):
        payload = _build_payload("be helpful", "what is 2+2?", None)
        assert payload["systemInstruction"]["parts"][0]["text"] == "be helpful"
        assert payload["contents"][0]["parts"][0]["text"] == "what is 2+2?"

    def test_omits_generation_config_without_schema(self):
        payload = _build_payload("system", "prompt", None)
        assert "generationConfig" not in payload

    def test_includes_response_schema_when_given(self):
        schema = {"type": "object", "properties": {"score": {"type": "integer"}}}
        payload = _build_payload("system", "prompt", schema)
        assert payload["generationConfig"]["responseMimeType"] == "application/json"
        assert payload["generationConfig"]["responseSchema"] == schema


class TestExtractText:
    def test_extracts_text_from_well_formed_response(self):
        data = {"candidates": [{"content": {"parts": [{"text": "the answer"}]}}]}
        assert _extract_text(data) == "the answer"

    def test_raises_on_missing_candidates(self):
        with pytest.raises(AiProviderError):
            _extract_text({"candidates": []})

    def test_raises_on_malformed_response(self):
        with pytest.raises(AiProviderError):
            _extract_text({"unexpected": "shape"})

    def test_optional_variant_returns_none_instead_of_raising(self):
        assert _extract_text_optional({"candidates": []}) is None
        assert _extract_text_optional({"unexpected": "shape"}) is None
