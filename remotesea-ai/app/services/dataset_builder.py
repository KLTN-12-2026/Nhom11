import hashlib
import json
import random
import uuid
from pathlib import Path

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.ai_dataset import AiDataset, AiDatasetStatus
from app.models.ai_feedback import AiFeedback, AiFeedbackAction
from app.models.ai_interaction import AiInteraction, AiInteractionStatus, AiTask
from app.schemas.inference import CandidateAnalysisResult

logger = get_logger(__name__)

# The instruction text training examples are labeled with. Deliberately the
# same string the live system prompt uses (see inference_service.py's
# _CANDIDATE_ANALYSIS_SYSTEM) — a fine-tuned model should be trained on the
# exact instruction it will be served with at inference time, not a
# paraphrase that could drift from it.
from app.services.inference_service import _CANDIDATE_ANALYSIS_SYSTEM

_SPLIT_SEED = 42
_TRAIN_RATIO = 0.8
_VALIDATION_RATIO = 0.1
# whatever's left goes to test


class UnsupportedDatasetTaskError(Exception):
    pass


def _dedupe_key(input_payload: dict) -> str:
    canonical = json.dumps(input_payload, sort_keys=True)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _validate_ground_truth(task: AiTask, output: dict) -> bool:
    if task != AiTask.CANDIDATE_ANALYSIS:
        raise UnsupportedDatasetTaskError(
            f"Dataset building for task {task.value} is not supported yet — "
            "only CANDIDATE_ANALYSIS has a result schema to validate against."
        )
    try:
        CandidateAnalysisResult.model_validate(output)
        return True
    except ValidationError:
        return False


def build_examples(
    rows: list[tuple[AiInteraction, AiFeedback]], task: AiTask
) -> tuple[list[dict], dict]:
    """Pure transform: (interaction, latest feedback) pairs -> training
    examples + a summary of what was included/excluded and why. No DB or
    filesystem access, so this is unit-testable without a running Postgres.
    """
    excluded_reject = 0
    excluded_invalid_schema = 0
    seen_keys: dict[str, int] = {}
    examples: list[dict] = []

    for interaction, feedback in rows:
        if feedback.action == AiFeedbackAction.REJECT:
            excluded_reject += 1
            continue

        ground_truth = (
            feedback.corrected_output
            if feedback.action == AiFeedbackAction.EDIT
            else interaction.output
        )
        if ground_truth is None or not _validate_ground_truth(task, ground_truth):
            excluded_invalid_schema += 1
            continue

        key = _dedupe_key(interaction.input)
        example = {
            "instruction": _CANDIDATE_ANALYSIS_SYSTEM,
            "input": interaction.input,
            "output": ground_truth,
        }
        if key in seen_keys:
            # Later interactions are processed later (rows are ordered by
            # created_at ascending by the caller) — the newest human
            # judgment on an identical input wins over an earlier one.
            examples[seen_keys[key]] = example
        else:
            seen_keys[key] = len(examples)
            examples.append(example)

    summary = {
        "interactionsWithFeedback": len(rows),
        "excludedReject": excluded_reject,
        "excludedInvalidOrMissingGroundTruth": excluded_invalid_schema,
        "deduplicatedTo": len(examples),
    }
    return examples, summary


def split_examples(
    examples: list[dict], seed: int = _SPLIT_SEED
) -> tuple[list[dict], list[dict], list[dict]]:
    """Deterministic 80/10/10 split. Small N degrades gracefully — everything
    lands in train rather than crashing or producing empty-but-required
    splits (a handful of examples isn't enough to hold out anything)."""
    shuffled = list(examples)
    random.Random(seed).shuffle(shuffled)

    n = len(shuffled)
    if n < 10:
        return shuffled, [], []

    train_end = int(n * _TRAIN_RATIO)
    validation_end = train_end + int(n * _VALIDATION_RATIO)
    return shuffled[:train_end], shuffled[train_end:validation_end], shuffled[validation_end:]


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
