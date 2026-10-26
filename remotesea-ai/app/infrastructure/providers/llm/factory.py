from functools import lru_cache

from app.infrastructure.config import get_settings
from app.infrastructure.providers.llm.anthropic import AnthropicProvider
from app.infrastructure.providers.llm.base import AiModelProvider
from app.infrastructure.providers.llm.gemini import GeminiProvider
from app.infrastructure.providers.llm.mock import MockProvider
from app.infrastructure.providers.llm.ollama import OllamaProvider


@lru_cache
def get_provider() -> AiModelProvider:
    settings = get_settings()
    if settings.ai_provider == "OLLAMA":
        return OllamaProvider()
    if settings.ai_provider == "ANTHROPIC":
        return AnthropicProvider()
    if settings.ai_provider == "GEMINI":
        return GeminiProvider()
    if settings.ai_provider == "MOCK":
        return MockProvider()
    raise ValueError(f"Unsupported AI_PROVIDER: {settings.ai_provider}")
