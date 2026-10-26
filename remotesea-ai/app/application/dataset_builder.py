import json
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# UnsupportedDatasetTaskError is raised from inside build_examples (via its
# _validate_ground_truth check) — importing it here too means callers of
# this module don't need to know it actually lives in the domain layer.
from app.domain.dataset.selection import (
    UnsupportedDatasetTaskError,  # noqa: F401
    build_examples,
    split_examples,
)
from app.infrastructure.config import get_settings
from app.infrastructure.logging import get_logger
from app.infrastructure.models.ai_dataset import AiDataset, AiDatasetStatus
from app.infrastructure.models.ai_feedback import AiFeedback
from app.infrastructure.models.ai_interaction import AiInteraction, AiInteractionStatus, AiTask

logger = get_logger(__name__)


def _write_jsonl(path: Path, examples: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for example in examples:
            f.write(json.dumps(example, ensure_ascii=False) + "\n")


class DatasetBuilder:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def _next_version(self, task: AiTask) -> int:
        result = await self._db.execute(
            select(AiDataset.version)
            .where(AiDataset.task == task.value)
            .order_by(AiDataset.version.desc())
            .limit(1)
        )
        current = result.scalar_one_or_none()
        return (current or 0) + 1

    async def _latest_feedback_by_interaction(
        self, interaction_ids: list[str]
    ) -> dict[str, AiFeedback]:
        if not interaction_ids:
            return {}
        result = await self._db.execute(
            select(AiFeedback)
            .where(AiFeedback.interaction_id.in_(interaction_ids))
            .order_by(AiFeedback.created_at)
        )
        latest: dict[str, AiFeedback] = {}
        for feedback in result.scalars().all():
            # Rows come back ordered oldest-first, so the last write for a
            # given interaction_id in this loop is the most recent feedback.
            latest[feedback.interaction_id] = feedback
        return latest

    async def build(self, task: AiTask) -> AiDataset:
        interactions_result = await self._db.execute(
            select(AiInteraction)
            .where(
                AiInteraction.task == task,
                AiInteraction.status == AiInteractionStatus.SUCCESS,
                AiInteraction.output.isnot(None),
            )
            .order_by(AiInteraction.created_at)
        )
        interactions = list(interactions_result.scalars().all())
        feedback_by_interaction = await self._latest_feedback_by_interaction(
            [i.id for i in interactions]
        )

        rows: list[tuple[AiInteraction, AiFeedback]] = []
        excluded_no_feedback = 0
        for interaction in interactions:
            feedback = feedback_by_interaction.get(interaction.id)
            if feedback is None:
                excluded_no_feedback += 1
                continue
            rows.append((interaction, feedback))

        examples, summary = build_examples(rows, task)
        summary["totalInteractionsRetrieved"] = len(interactions)
        summary["excludedNoFeedback"] = excluded_no_feedback
        train, validation, test = split_examples(examples)

        version = await self._next_version(task)
        settings = get_settings()
        base_dir = Path(settings.datasets_dir) / task.value.lower() / f"v{version}"

        dataset_id = str(uuid.uuid4())
        if not examples:
            dataset = AiDataset(
                id=dataset_id,
                task=task.value,
                version=version,
                status=AiDatasetStatus.FAILED,
                sample_count=0,
                build_summary=summary,
            )
        else:
            train_path = base_dir / "train.jsonl"
            validation_path = base_dir / "validation.jsonl"
            test_path = base_dir / "test.jsonl"
            _write_jsonl(train_path, train)
            _write_jsonl(validation_path, validation)
            _write_jsonl(test_path, test)

            dataset = AiDataset(
                id=dataset_id,
                task=task.value,
                version=version,
                status=AiDatasetStatus.READY,
                sample_count=len(examples),
                train_count=len(train),
                validation_count=len(validation),
                test_count=len(test),
                train_path=str(train_path),
                validation_path=str(validation_path),
                test_path=str(test_path),
                build_summary=summary,
            )

        self._db.add(dataset)
        await self._db.commit()
        await self._db.refresh(dataset)
        logger.info(
            "Built dataset %s v%d for %s: %s", dataset.status.value, version, task.value, summary
        )
        return dataset

    async def list_versions(self, task: AiTask) -> list[AiDataset]:
        result = await self._db.execute(
            select(AiDataset)
            .where(AiDataset.task == task.value)
            .order_by(AiDataset.version.desc())
        )
        return list(result.scalars().all())
