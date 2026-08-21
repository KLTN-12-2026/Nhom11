import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_model import AiModel, AiModelStatus


class ModelNotFoundError(Exception):
    pass


class InvalidModelStateError(Exception):
    pass


class ModelRegistryService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def _get(self, model_id: str) -> AiModel:
        model = await self._db.get(AiModel, model_id)
        if model is None:
            raise ModelNotFoundError(model_id)
        return model

    async def _next_version(self, task: str) -> int:
        result = await self._db.execute(
            select(AiModel.version)
            .where(AiModel.task == task)
            .order_by(AiModel.version.desc())
            .limit(1)
        )
        current = result.scalar_one_or_none()
        return (current or 0) + 1

    async def register_training(
        self, task: str, name: str, base_model: str, dataset_version: int
    ) -> AiModel:
        model = AiModel(
            id=str(uuid.uuid4()),
            task=task,
            version=await self._next_version(task),
            name=name,
            base_model=base_model,
            dataset_version=dataset_version,
            status=AiModelStatus.TRAINING,
        )
        self._db.add(model)
        await self._db.commit()
        await self._db.refresh(model)
        return model

    async def complete_training(self, model_id: str, artifact_path: str) -> AiModel:
        model = await self._get(model_id)
        if model.status != AiModelStatus.TRAINING:
            raise InvalidModelStateError(
                f"Model {model_id} is {model.status.value}, expected TRAINING"
            )
        model.artifact_path = artifact_path
        model.status = AiModelStatus.EVALUATING
        await self._db.commit()
        await self._db.refresh(model)
        return model

    # `passed` is supplied by the caller (the Colab notebook / evaluation
    # step), not computed here — this service has no access to real model
    # predictions to judge quality from, and hardcoding an invented pass/fail
    # threshold would be worse than making the decision an explicit input.
    async def submit_evaluation(
        self, model_id: str, metrics: dict[str, Any], passed: bool
    ) -> AiModel:
        model = await self._get(model_id)
        if model.status != AiModelStatus.EVALUATING:
            raise InvalidModelStateError(
                f"Model {model_id} is {model.status.value}, expected EVALUATING"
            )
        model.metrics = metrics
        model.status = AiModelStatus.CANDIDATE if passed else AiModelStatus.REJECTED
        await self._db.commit()
        await self._db.refresh(model)
        return model

    async def _archive_current_active(self, task: str) -> None:
        result = await self._db.execute(
            select(AiModel).where(AiModel.task == task, AiModel.status == AiModelStatus.ACTIVE)
        )
        current_active = result.scalar_one_or_none()
        if current_active is not None:
            current_active.status = AiModelStatus.ARCHIVED

    # Human approval: CANDIDATE -> ACTIVE. Enforces "exactly one ACTIVE per
    # task" by construction — the previous ACTIVE row (if any) is archived in
    # the same transaction, never left dangling.
    async def approve(self, model_id: str) -> AiModel:
        model = await self._get(model_id)
        if model.status != AiModelStatus.CANDIDATE:
            raise InvalidModelStateError(
                f"Model {model_id} is {model.status.value}, expected CANDIDATE"
            )
        await self._archive_current_active(model.task)
        model.status = AiModelStatus.ACTIVE
        model.deployed_at = datetime.now(timezone.utc)
        await self._db.commit()
        await self._db.refresh(model)
        return model

    # Rollback: promote a model that was previously ACTIVE (deployed_at set,
    # now ARCHIVED) back to ACTIVE. Rejects rolling back to a model that was
    # never actually deployed (e.g. a REJECTED or still-CANDIDATE one) — that
    # would be an approval, not a rollback, and belongs to a different call.
    async def rollback(self, model_id: str) -> AiModel:
        model = await self._get(model_id)
        if model.status != AiModelStatus.ARCHIVED or model.deployed_at is None:
            raise InvalidModelStateError(
                f"Model {model_id} is {model.status.value} and was never deployed — "
                "only a previously-ACTIVE, now-ARCHIVED model can be rolled back to"
            )
        await self._archive_current_active(model.task)
        model.status = AiModelStatus.ACTIVE
        await self._db.commit()
        await self._db.refresh(model)
        return model

    async def list_models(self, task: str) -> list[AiModel]:
        result = await self._db.execute(
            select(AiModel).where(AiModel.task == task).order_by(AiModel.version.desc())
        )
        return list(result.scalars().all())

    async def get_active(self, task: str) -> AiModel | None:
        result = await self._db.execute(
            select(AiModel).where(AiModel.task == task, AiModel.status == AiModelStatus.ACTIVE)
        )
        return result.scalar_one_or_none()
