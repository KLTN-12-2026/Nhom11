from app.infrastructure.providers.llm.base import AiModelProvider


# Zero-cost, zero-network, zero-GPU provider — for tests and for verifying
# orchestrator plumbing (auth, context forwarding, routing) without needing
# Ollama running or a real model loaded. Not meant to produce usable
# analysis output; callers that need a specific JSON shape back should
# construct MockProvider(response=...) with that exact shape pre-baked.
class MockProvider(AiModelProvider):
    def __init__(self, response: str = '{"mock": true}') -> None:
        self._response = response

    @property
    def model_version(self) -> str:
        return "mock:static"

    async def complete(self, system: str, prompt: str) -> str:
        return self._response
