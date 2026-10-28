import pytest

from app.infrastructure.config import Settings, get_settings


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


class TestProviderSelection:
    def test_ai_model_provider_is_read(self, monkeypatch):
        monkeypatch.setenv("AI_MODEL_PROVIDER", "CLOUDFLARE")
        assert get_settings().ai_model_provider == "CLOUDFLARE"

    def test_ai_model_provider_accepts_lowercase(self, monkeypatch):
        monkeypatch.setenv("AI_MODEL_PROVIDER", "cloudflare")
        assert get_settings().ai_model_provider == "CLOUDFLARE"

    def test_falls_back_to_legacy_ai_provider_when_unset(self, monkeypatch):
        monkeypatch.delenv("AI_MODEL_PROVIDER", raising=False)
        monkeypatch.setenv("AI_PROVIDER", "GEMINI")
        assert get_settings().ai_model_provider == "GEMINI"

    def test_ai_model_provider_wins_over_legacy_ai_provider(self, monkeypatch):
        monkeypatch.setenv("AI_MODEL_PROVIDER", "CLOUDFLARE")
        monkeypatch.setenv("AI_PROVIDER", "OLLAMA")
        assert get_settings().ai_model_provider == "CLOUDFLARE"

    def test_defaults_to_ollama_when_neither_is_set(self):
        # Goes through the field default directly, bypassing this repo's own
        # .env (which sets AI_MODEL_PROVIDER=cloudflare for local dev) —
        # that's a real, deliberate project config value, not the class's
        # default, so it must not be asserted against here.
        assert Settings.model_fields["ai_model_provider"].default == "OLLAMA"


class TestResolvedModel:
    def test_cloudflare_model_falls_back_to_shared_ai_model(self, monkeypatch):
        monkeypatch.delenv("CLOUDFLARE_MODEL", raising=False)
        monkeypatch.setenv("AI_MODEL", "@cf/meta/llama-3.1-8b-instruct")
        assert get_settings().resolved_cloudflare_model == "@cf/meta/llama-3.1-8b-instruct"

    def test_cloudflare_model_overrides_shared_ai_model_when_set(self, monkeypatch):
        monkeypatch.setenv("AI_MODEL", "@cf/meta/llama-3.1-8b-instruct")
        monkeypatch.setenv("CLOUDFLARE_MODEL", "@cf/meta/llama-3.2-1b-instruct")
        assert get_settings().resolved_cloudflare_model == "@cf/meta/llama-3.2-1b-instruct"

    def test_ollama_model_falls_back_to_shared_ai_model(self, monkeypatch):
        monkeypatch.delenv("OLLAMA_MODEL", raising=False)
        monkeypatch.setenv("AI_MODEL", "qwen2.5:3b-instruct")
        assert get_settings().resolved_ollama_model == "qwen2.5:3b-instruct"

    def test_ollama_model_overrides_shared_ai_model_when_set(self, monkeypatch):
        monkeypatch.setenv("AI_MODEL", "qwen2.5:3b-instruct")
        monkeypatch.setenv("OLLAMA_MODEL", "llama3.1:8b-instruct")
        assert get_settings().resolved_ollama_model == "llama3.1:8b-instruct"
