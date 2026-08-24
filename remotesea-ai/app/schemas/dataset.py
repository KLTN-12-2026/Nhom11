from typing import Any

from app.infrastructure.models.ai_dataset import AiDatasetStatus
from app.infrastructure.models.ai_interaction import AiTask
from app.schemas.base import CamelModel


class BuildDatasetRequest(CamelModel):
    task: AiTask = AiTask.CANDIDATE_ANALYSIS


class DatasetResponse(CamelModel):
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
