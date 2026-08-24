from abc import ABC, abstractmethod


# Same reasoning as AiModelProvider: RAG ingestion/retrieval never talks to
# Ollama's embeddings API (or any future embedding backend) directly, only
# to this interface — swapping embedding models/backends means adding a
# class here, not touching the application layer.
class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Returns one embedding vector per input text, same order, same
        length as `texts`. Callers must not assume a fixed dimension here —
        that's a property of the concrete provider/model in use."""
