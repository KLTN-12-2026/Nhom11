from abc import ABC, abstractmethod


# Every AI feature (inference_service.py today; RAG/training-aware inference
# later) talks to this interface, never to a vendor/runtime SDK directly —
# same reasoning as remotesea-api's AiService abstraction over
# Anthropic/Gemini. Swapping OLLAMA for a VLLM- or TransformersProvider later
# (see the README's Phase 9) means adding a new class here, not touching any
# caller.
class AiModelProvider(ABC):
    @property
    @abstractmethod
    def model_version(self) -> str:
        """Identifier persisted on AiInteraction.model_version — must be
        specific enough to tell two different models/checkpoints apart."""

    @abstractmethod
    async def complete(self, system: str, prompt: str) -> str:
        """Raw text completion — prompt construction and response parsing
        are the caller's job (see inference_service.py), not this layer's."""
