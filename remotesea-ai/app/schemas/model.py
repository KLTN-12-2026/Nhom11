from typing import Any

from app.infrastructure.models.ai_interaction import AiTask
from app.infrastructure.models.ai_model import AiModelStatus
from app.schemas.base import CamelModel


class RegisterTrainingRequest(CamelModel):
    task: AiTask
    name: str
    base_model: str
    dataset_version: int


class CompleteTrainingRequest(CamelModel):
    artifact_path: str


class SubmitEvaluationRequest(CamelModel):
    metrics: dict[str, Any]
    passed: bool


class ModelResponse(CamelModel):
    id: str
    task: str
    version: int
    name: str
    base_model: str
    dataset_version: int
    artifact_path: str | None
    metrics: dict[str, Any] | None
    status: AiModelStatus
    created_at: str
    deployed_at: str | None
