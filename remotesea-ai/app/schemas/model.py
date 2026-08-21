from typing import Any

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from app.models.ai_interaction import AiTask
from app.models.ai_model import AiModelStatus

_CAMEL_CONFIG = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class RegisterTrainingRequest(BaseModel):
    model_config = _CAMEL_CONFIG

    task: AiTask
    name: str
    base_model: str
    dataset_version: int


class CompleteTrainingRequest(BaseModel):
    model_config = _CAMEL_CONFIG

    artifact_path: str


class SubmitEvaluationRequest(BaseModel):
    model_config = _CAMEL_CONFIG

    metrics: dict[str, Any]
    passed: bool


class ModelResponse(BaseModel):
    model_config = _CAMEL_CONFIG

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
