from dataclasses import dataclass
from typing import Any

from pydantic import ValidationError

from app.schemas.inference import CandidateAnalysisResult


@dataclass
class HistoricalCase:
    job_title: str
    job_level: str | None
    score: int
    recommendation: str
    reasoning: str
    was_corrected: bool
    correction_reason: str | None


# Pure — no DB, no I/O — so it's unit-testable without a running Postgres
# (this exact gap was flagged by code review: the selection rules below had
# no test coverage while living inline inside a DB-querying method).
# Encapsulates the same ground-truth selection rules the Dataset Builder
# applies: REJECT is excluded (no usable ground truth), EDIT uses the
# human's corrected_output, ACCEPT uses the model's own output — and the
# result is validated against the *current* CandidateAnalysisResult schema,
# since real data confirmed rows from before a schema change (the old
# fitScore/summary shape) still exist in this table and would otherwise
# produce a case with score=None/recommendation=None.
#
# feedback_action is a plain string, not the AiFeedbackAction enum — this
# file is domain, and the enum lives on the infrastructure-layer ORM model;
# comparing string values keeps this layer free of an infrastructure
# import. (AiFeedbackAction is itself a str-enum, so passing its .value —
# or the enum member itself, since `AiFeedbackAction.EDIT == "EDIT"` is
# True — both work at the call site.)
def build_historical_case(
    *,
    job_title_fallback: str,
    job: dict[str, Any],
    feedback_action: str,
    corrected_output: dict | None,
    interaction_output: dict | None,
    correction_reason: str | None,
) -> HistoricalCase | None:
    if feedback_action == "REJECT":
        return None

    ground_truth = corrected_output if feedback_action == "EDIT" else interaction_output
    if not ground_truth:
        return None

    try:
        validated = CandidateAnalysisResult.model_validate(ground_truth)
    except ValidationError:
        return None

    return HistoricalCase(
        job_title=job.get("title", job_title_fallback),
        job_level=job.get("level"),
        score=validated.score,
        recommendation=validated.recommendation,
        reasoning=validated.reasoning,
        was_corrected=feedback_action == "EDIT",
        correction_reason=correction_reason,
    )
