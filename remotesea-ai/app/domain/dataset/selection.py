import hashlib
import json
import random

from pydantic import ValidationError

from app.domain.candidate_analysis.prompts import CANDIDATE_ANALYSIS_SYSTEM
from app.infrastructure.models.ai_feedback import AiFeedback, AiFeedbackAction
from app.infrastructure.models.ai_interaction import AiInteraction, AiTask
from app.schemas.inference import CandidateAnalysisResult

# NOTE on layering: these functions are I/O-free (no DB/filesystem access,
# unit-testable without Postgres — that property is preserved from before
# this move) but their *type hints* still reference infrastructure-layer
# ORM classes (AiInteraction, AiFeedback, AiTask), which a strictly pure
# domain layer wouldn't depend on. Decoupling that would mean changing
# build_examples's signature to accept plain data instead of ORM rows,
# which would also change what tests/test_dataset_builder.py exercises
# (it constructs real ORM instances and asserts UnsupportedDatasetTaskError
# is raised *from this function*) — beyond this refactor's "same
# assertions, imports only" scope for tests. Disclosed here rather than
# silently left inconsistent with historical_case.py's pure (string-based,
# ORM-free) equivalent.

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
            "instruction": CANDIDATE_ANALYSIS_SYSTEM,
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
