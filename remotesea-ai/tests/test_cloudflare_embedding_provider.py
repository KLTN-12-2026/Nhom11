import pytest

from app.infrastructure.providers.embedding.cloudflare import _extract_vectors
from app.infrastructure.providers.llm.errors import AiProviderError


class TestExtractVectors:
    def test_extracts_vectors_from_successful_response(self):
        data = {
            "result": {"shape": [2, 3], "data": [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]},
            "success": True,
            "errors": [],
        }
        assert _extract_vectors(data) == [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]

    def test_raises_when_success_is_false(self):
        data = {"result": None, "success": False, "errors": [{"message": "bad request"}]}
        with pytest.raises(AiProviderError):
            _extract_vectors(data)

    def test_raises_on_missing_result(self):
        data = {"success": True, "errors": []}
        with pytest.raises(AiProviderError):
            _extract_vectors(data)

    def test_raises_on_malformed_result(self):
        data = {"success": True, "errors": [], "result": None}
        with pytest.raises(AiProviderError):
            _extract_vectors(data)
