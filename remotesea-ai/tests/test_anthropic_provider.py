import pytest

from app.infrastructure.providers.llm.anthropic import _extract_text
from app.infrastructure.providers.llm.errors import AiProviderError


class TestExtractText:
    def test_extracts_plain_text_response(self):
        data = {"content": [{"type": "text", "text": "hello there"}]}
        assert _extract_text(data, structured=False) == "hello there"

    def test_extracts_tool_use_input_as_json_string(self):
        data = {
            "content": [
                {"type": "tool_use", "name": "structured_output", "input": {"score": 78}}
            ]
        }
        result = _extract_text(data, structured=True)
        assert result == '{"score": 78}'

    def test_skips_non_text_blocks_when_looking_for_text(self):
        data = {
            "content": [
                {"type": "tool_use", "name": "irrelevant", "input": {}},
                {"type": "text", "text": "the answer"},
            ]
        }
        assert _extract_text(data, structured=False) == "the answer"

    def test_raises_when_structured_response_has_no_tool_use(self):
        data = {"content": [{"type": "text", "text": "no tool call here"}]}
        with pytest.raises(AiProviderError):
            _extract_text(data, structured=True)

    def test_raises_when_plain_response_has_no_text_block(self):
        data = {"content": [{"type": "tool_use", "name": "x", "input": {}}]}
        with pytest.raises(AiProviderError):
            _extract_text(data, structured=False)

    def test_raises_on_empty_content(self):
        with pytest.raises(AiProviderError):
            _extract_text({"content": []}, structured=False)
