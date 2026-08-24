from functools import lru_cache

from app.core.config import get_settings
from app.providers.base import AiModelProvider
from app.providers.mock import MockProvider
from app.providers.ollama import OllamaProvider


@lru_cache
def get_provider() -> AiModelProvider:
    settings = get_settings()
    if settings.ai_model_provider == "OLLAMA":
        return OllamaProvider()
    if settings.ai_model_provider == "MOCK":
        return MockProvider()
    raise ValueError(f"Unsupported AI_MODEL_PROVIDER: {settings.ai_model_provider}")
