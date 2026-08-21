from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    ai_service_secret: str
    ai_model_provider: Literal["OLLAMA"] = "OLLAMA"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:3b-instruct"
    port: int = 8000
    # Where the Dataset Builder (Phase 6) writes train/validation/test.jsonl.
    # Relative paths resolve against the process cwd (repo root when run via
    # uvicorn/pytest from there, same convention as alembic.ini).
    datasets_dir: str = "datasets"


# lru_cache, not a module-level instance — same reasoning as NestJS's
# ConfigService: Settings() re-reads/re-validates env vars on first call
# (useful for pytest overriding env before import), then every subsequent
# call anywhere in the app reuses the exact same validated instance.
@lru_cache
def get_settings() -> Settings:
    return Settings()
