from abc import ABC, abstractmethod


# Every AI feature talks to this interface, never to a vendor/runtime SDK
# directly — same reasoning as remotesea-api's AiService abstraction over
# Anthropic/Gemini. Swapping OLLAMA for a VLLM- or TransformersProvider
# later (or a different open-weight model — Qwen/Llama/Mistral) means
# adding a new class here, not touching any caller.
class AiModelProvider(ABC):
    @property
    @abstractmethod
    def model_version(self) -> str:
        """Identifier persisted on AiInteraction.model_version — must be
        specific enough to tell two different models/checkpoints apart."""

    @abstractmethod
    async def complete(self, system: str, prompt: str, json_schema: dict | None = None) -> str:
        """Raw text completion — prompt construction and response parsing
        are the caller's job (application layer), not this layer's.
        json_schema, when given, requests grammar-constrained decoding from
        providers that support it (guarantees the shape, not just valid
        JSON) — providers that don't support it may ignore it and fall back
        to free-form JSON mode."""
