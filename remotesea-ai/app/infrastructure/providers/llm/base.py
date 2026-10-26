from abc import ABC, abstractmethod
from collections.abc import AsyncIterator


# Every AI feature talks to this interface, never to a vendor/runtime SDK
# directly — same reasoning as remotesea-api's AiService abstraction over
# Anthropic/Gemini. Swapping OLLAMA for ANTHROPIC/GEMINI (or a different
# open-weight model — Qwen/Llama/Mistral) means adding/selecting a class
# here (see factory.py's AI_PROVIDER switch), not touching any caller.
class AiModelProvider(ABC):
    @property
    @abstractmethod
    def model_version(self) -> str:
        """Identifier persisted on AiInteraction.model_version — must be
        specific enough to tell two different models/checkpoints apart."""

    @abstractmethod
    async def complete(
        self, system: str, prompt: str, json_schema: dict | None = None, model: str | None = None
    ) -> str:
        """Raw text completion — prompt construction and response parsing
        are the caller's job (application layer), not this layer's.
        json_schema, when given, requests grammar-constrained decoding from
        providers that support it (guarantees the shape, not just valid
        JSON) — providers that don't support it may ignore it and fall back
        to free-form JSON mode. model, when given, overrides this
        provider's configured default model for this one call only (e.g. a
        smaller/faster model for a simple classification task) — the
        provider itself stays a single long-lived instance either way."""

    @abstractmethod
    def stream(self, system: str, prompt: str, model: str | None = None) -> AsyncIterator[str]:
        """Yields incremental text chunks as they're generated. Not
        schema-constrained (streaming + grammar-constrained decoding is not
        how any of these providers' APIs compose) — prepared for a future
        streaming endpoint; no current caller consumes this yet, since
        every existing one (InferenceService, OrchestratorService) needs a
        complete, parseable JSON object, not partial text."""
