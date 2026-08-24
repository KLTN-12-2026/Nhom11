from functools import lru_cache

from app.infrastructure.config import get_settings
from app.infrastructure.providers.llm.base import AiModelProvider
from app.infrastructure.providers.llm.mock import MockProvider
from app.infrastructure.providers.llm.ollama import OllamaProvider


@lru_cache
def get_provider() -> AiModelProvider:
    settings = get_settings()
    if settings.ai_model_provider == "OLLAMA":
        return OllamaProvider()
    if settings.ai_model_provider == "MOCK":
        return MockProvider()
    raise ValueError(f"Unsupported AI_MODEL_PROVIDER: {settings.ai_model_provider}")
