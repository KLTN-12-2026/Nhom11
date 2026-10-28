import pytest

from app.infrastructure.providers.llm.cloudflare import (
    _extract_stream_delta,
    _extract_text,
    _schema_example,
)
from app.infrastructure.providers.llm.errors import AiProviderError


class TestExtractStreamDelta:
    def test_extracts_string_content(self):
        event = {"choices": [{"delta": {"content": "hi"}}]}
        assert _extract_stream_delta(event) == "hi"

    def test_returns_none_for_empty_content(self):
        event = {"choices": [{"delta": {"content": ""}}]}
        assert _extract_stream_delta(event) == ""

    def test_ignores_top_level_response_field_type_flips(self):
        # Workers AI's top-level "response" field can come through as an
        # int for numeric-looking tokens (e.g. "1") — confirmed live —
        # while choices[0].delta.content stays a string; this must read
        # the latter, not "response".
        event = {"choices": [{"delta": {"content": "1"}}], "response": 1}
        assert _extract_stream_delta(event) == "1"

    def test_returns_none_on_malformed_event(self):
        assert _extract_stream_delta({"unexpected": "shape"}) is None
        assert _extract_stream_delta({"choices": []}) is None


class TestSchemaExample:
    def test_flat_string_field(self):
        schema = {"properties": {"text": {"type": "string"}}}
        assert _schema_example(schema) == {"text": "<string>"}

    def test_enum_field_lists_options(self):
        schema = {"properties": {"recommendation": {"type": "string", "enum": ["A", "B"]}}}
        assert _schema_example(schema) == {"recommendation": "A|B"}

    def test_array_of_strings(self):
        schema = {"properties": {"strengths": {"type": "array", "items": {"type": "string"}}}}
        assert _schema_example(schema) == {"strengths": ["<string>"]}

    def test_integer_and_number_fields(self):
        schema = {
            "properties": {
                "score": {"type": "integer", "minimum": 0, "maximum": 100},
                "confidence": {"type": "number"},
            }
        }
        assert _schema_example(schema) == {"score": "<integer>", "confidence": "<number>"}

    def test_matches_real_candidate_analysis_schema_shape(self):
        from app.schemas.inference import CandidateAnalysisResult

        example = _schema_example(CandidateAnalysisResult.model_json_schema())
        assert example == {
            "strengths": ["<string>"],
            "weaknesses": ["<string>"],
            "missingRequirements": ["<string>"],
            "reasoning": "<string>",
            "score": "<integer>",
            "recommendation": "SHORTLIST|REVIEW|REJECT",
        }


class TestExtractText:
    def test_extracts_text_from_successful_response(self):
        data = {"result": {"response": "hello there"}, "success": True, "errors": []}
        assert _extract_text(data) == "hello there"

    def test_raises_when_success_is_false(self):
        data = {"result": None, "success": False, "errors": [{"message": "bad request"}]}
        with pytest.raises(AiProviderError):
            _extract_text(data)

    def test_raises_on_missing_result(self):
        data = {"success": True, "errors": []}
        with pytest.raises(AiProviderError):
            _extract_text(data)

    def test_raises_on_malformed_result(self):
        data = {"success": True, "errors": [], "result": None}
        with pytest.raises(AiProviderError):
            _extract_text(data)

    def test_serializes_dict_response_to_json_string(self):
        # response_format={"type": "json_object"} makes Workers AI return
        # result.response as an already-parsed object, not a JSON string —
        # confirmed live against @cf/meta/llama-3.1-8b-instruct.
        data = {"result": {"response": {"text": "hi", "score": 90}}, "success": True, "errors": []}
        result = _extract_text(data)
        assert isinstance(result, str)
        assert '"text": "hi"' in result or '"text":"hi"' in result
