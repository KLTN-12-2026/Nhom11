from functools import lru_cache
from typing import Literal

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
    ai_model_provider: Literal["OLLAMA", "MOCK"] = "OLLAMA"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:3b-instruct"
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
    # infrastructure/rag_db.py). Needs the pgvector extension enabled on
    # this DB.
    rag_database_url: str
    embedding_provider: Literal["OLLAMA", "MOCK"] = "OLLAMA"
    ollama_embedding_model: str = "nomic-embed-text"
    # nomic-embed-text's output dimension — the pgvector column width is
    # fixed at table-creation time, so this has to be a known constant, not
    # something read off a live embedding response.
    embedding_dimensions: int = 768


# lru_cache, not a module-level instance — same reasoning as NestJS's
# ConfigService: Settings() re-reads/re-validates env vars on first call
# (useful for pytest overriding env before import), then every subsequent
# call anywhere in the app reuses the exact same validated instance.
@lru_cache
def get_settings() -> Settings:
    return Settings()
