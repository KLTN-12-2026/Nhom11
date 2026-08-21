from typing import Any

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from app.models.ai_dataset import AiDatasetStatus
from app.models.ai_interaction import AiTask

_CAMEL_CONFIG = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class BuildDatasetRequest(BaseModel):
    model_config = _CAMEL_CONFIG

    task: AiTask = AiTask.CANDIDATE_ANALYSIS


class DatasetResponse(BaseModel):
    model_config = _CAMEL_CONFIG

    id: str
    task: str
    version: int
    status: AiDatasetStatus
    sample_count: int
    train_count: int
    validation_count: int
    test_count: int
    train_path: str | None
    validation_path: str | None
    test_path: str | None
    build_summary: dict[str, Any]
    created_at: str
