import httpx

from app.infrastructure.config import get_settings
from app.infrastructure.providers.llm.base import AiModelProvider

# CPU-only local inference (see README: no GPU in dev) is slow — generous
# timeout so a real answer doesn't get cut off mid-generation on a small
# machine, matching production's own eventual bound (vLLM/GPU) being far
# faster in practice. Bumped from 180s after CANDIDATE_ANALYSIS's richer
# output schema (5 fields incl. missingRequirements + reasoning, vs. the
# original 4) pushed real generation time past that on this dev machine.
REQUEST_TIMEOUT_SECONDS = 300.0


class OllamaProvider(AiModelProvider):
    def __init__(self) -> None:
        settings = get_settings()
        self._base_url = settings.ollama_base_url
        self._model = settings.ollama_model

    @property
    def model_version(self) -> str:
        return f"ollama:{self._model}"

    async def complete(self, system: str, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{self._base_url}/api/chat",
                json={
                    "model": self._model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    "stream": False,
                    # Ollama constrains decoding to valid JSON when set —
                    # the response can still be semantically wrong, but it's
                    # never malformed JSON, which is most of what the
                    # application layer's parsing has to guard against.
                    "format": "json",
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]
