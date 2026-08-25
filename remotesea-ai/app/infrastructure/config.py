from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    # Dual purpose: (1) legacy static bearer secret compared via
    # require_service_auth for the existing inference/feedback/datasets/
    # models endpoints, (2) HMAC-SHA256 signing key for the short-lived
    # orchestrator context tokens remotesea-api mints (require_orchestrator_
    # context) — same value configured on both services, not two secrets.
    ai_service_secret: str
    # AiModelProvider selection — see infrastructure/providers/llm/factory.py.
    # OLLAMA is the default: self-hosted, zero API key, zero-config beyond
    # what's already here. ANTHROPIC/GEMINI/CLOUDFLARE are opt-in
    # alternatives, each requiring their own credentials below.
    # AI_MODEL_PROVIDER is the current env var name; AI_PROVIDER (its old
    # name) is still accepted as a fallback so an environment (e.g. Render)
    # that hasn't been migrated to the new name yet doesn't silently fall
    # back to the OLLAMA default. AI_MODEL_PROVIDER wins when both are set.
    ai_model_provider: Literal["OLLAMA", "ANTHROPIC", "GEMINI", "CLOUDFLARE", "MOCK"] = Field(
        default="OLLAMA",
        validation_alias=AliasChoices("AI_MODEL_PROVIDER", "AI_PROVIDER"),
    )

    @field_validator("ai_model_provider", mode="before")
    @classmethod
    def _normalize_provider(cls, value: object) -> object:
        # Accepts any case ("cloudflare", "Cloudflare", "CLOUDFLARE") rather
        # than failing validation over a casing mismatch in whatever set the
        # env var.
        return value.upper() if isinstance(value, str) else value

    # Meaning depends on ai_model_provider: an Ollama tag, an Anthropic
    # model id, a Gemini model id, or a Cloudflare Workers AI model id.
    # Shared fallback for every provider that doesn't have its own
    # <VENDOR>_MODEL var below (currently ANTHROPIC/GEMINI/MOCK) — kept so
    # switching between those is still just two env vars. OLLAMA/CLOUDFLARE
    # each read their own var first (ollama_model/cloudflare_model) and only
    # fall back to this when that's unset.
    ai_model: str = "qwen2.5:3b-instruct"
    # Optional override for the tool-selection/RAG-necessity classification
    # call specifically (OrchestratorService._select_tools) — that's a much
    # simpler decision than a full answer, so a smaller/faster model is a
    # reasonable fit there without touching CANDIDATE_ANALYSIS or the main
    # answer call. None (default) means "use ai_model" — opt-in, changes
    # nothing for anyone who doesn't set it.
    ai_classification_model: str | None = None
    # Shared across all three providers — Ollama's CPU-only local inference
    # is the slow case this was originally sized for; cloud providers
    # (Anthropic/Gemini) finish well within it in practice.
    ai_request_timeout_seconds: float = 300.0
    # Low, not each provider's own default (Ollama defaults to 0.8) —
    # every call this service makes is a structured business decision
    # (CANDIDATE_ANALYSIS's score/recommendation, tool-selection routing,
    # ask/chat answers), where consistency matters more than creative
    # variety. Not 0.0 — a small amount of randomness still lets the model
    # phrase reasoning naturally; 0.0 on some models produces repetitive or
    # degenerate text. Shared across all calls (not just CANDIDATE_ANALYSIS)
    # since every one of them benefits from the same "same input, same
    # answer" property.
    ai_temperature: float = 0.2
    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None
    # Workers AI: account-scoped, not a single global key — both required
    # together when ai_model_provider=CLOUDFLARE (see
    # providers/llm/cloudflare.py).
    cloudflare_account_id: str | None = None
    cloudflare_api_token: str | None = None
    # Cloudflare Workers AI model id (e.g. "@cf/meta/llama-3.1-8b-instruct").
    # None (default) means "use ai_model" — see resolved_cloudflare_model.
    cloudflare_model: str | None = None
    # Not required in production when ai_model_provider=CLOUDFLARE (or any
    # non-OLLAMA provider) — only OllamaProvider ever reads this. The
    # default points at a local Ollama daemon so an unset var never sends a
    # request anywhere unexpected; it's simply never consulted outside the
    # OLLAMA path.
    ollama_base_url: str = "http://localhost:11434"
    # Ollama tag (e.g. "qwen2.5:3b-instruct"). None (default) means "use
    # ai_model" — see resolved_ollama_model.
    ollama_model: str | None = None
    # How long Ollama keeps the model loaded in memory after a request —
    # Ollama's own default is short enough that spaced-out requests can
    # trigger a multi-second reload on the next call (observed live:
    # ~15.8s just to reload before generation even starts). Ollama accepts
    # a duration string ("30m") or a negative value to keep it loaded
    # indefinitely.
    ollama_keep_alive: str = "30m"
    port: int = 8000
    # Where the Dataset Builder writes train/validation/test.jsonl. Relative
    # paths resolve against the process cwd (repo root when run via uvicorn/
    # pytest from there, same convention as alembic.ini).
    datasets_dir: str = "datasets"
    # Base URL this service calls remotesea-api back on (Tool Calling, and
    # the orchestrator health check's round-trip proof) — never queries
    # remotesea-api's database directly, only its authenticated HTTP API.
    remotesea_api_base_url: str = "http://localhost:4000"
    # RAG's own database — a second, separate database (not a schema inside
    # the main one) on the same Postgres server, per the explicit decision
    # to keep "system knowledge" storage independent from the AI Learning
    # Loop's interaction/feedback/dataset/model tables (see
    # infrastructure/rag_db.py). Holds RagDocument (title/source/content)
    # and the slim RagChunk metadata/content rows used for full-text search
    # — chunk *vectors* live in Qdrant instead (see qdrant_client.py),
    # not this database, so this DB no longer needs the pgvector extension
    # for RAG's own sake (the main DB still needs it, for
    # ai_conversation_turns.embedding — an unrelated feature).
    rag_database_url: str
    embedding_provider: Literal["OLLAMA", "MOCK"] = "OLLAMA"
    ollama_embedding_model: str = "nomic-embed-text"
    # nomic-embed-text's output dimension — Qdrant's collection vector size
    # is fixed at collection-creation time, so this has to be a known
    # constant, not something read off a live embedding response.
    embedding_dimensions: int = 768
    # RAG chunk vector storage/search — see infrastructure/qdrant_client.py.
    # Qdrant Cloud (a managed cluster), not self-hosted, so this is just a
    # URL + API key, no docker-compose service.
    qdrant_url: str
    qdrant_api_key: str | None = None
    qdrant_collection_name: str = "remotesea_rag_chunks"

    # The model id CloudflareProvider actually uses — CLOUDFLARE_MODEL when
    # set, otherwise AI_MODEL. Kept as a method on Settings (not duplicated
    # per-provider) so the fallback rule lives in exactly one place.
    @property
    def resolved_cloudflare_model(self) -> str:
        return self.cloudflare_model or self.ai_model

    # Same fallback rule as resolved_cloudflare_model, for OLLAMA_MODEL.
    @property
    def resolved_ollama_model(self) -> str:
        return self.ollama_model or self.ai_model


# lru_cache, not a module-level instance — same reasoning as NestJS's
# ConfigService: Settings() re-reads/re-validates env vars on first call
# (useful for pytest overriding env before import), then every subsequent
# call anywhere in the app reuses the exact same validated instance.
@lru_cache
def get_settings() -> Settings:
    return Settings()
