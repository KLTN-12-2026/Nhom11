from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.candidate_analysis.historical_case import HistoricalCase, build_historical_case
from app.infrastructure.models.ai_feedback import AiFeedback
from app.infrastructure.models.ai_interaction import AiInteraction, AiInteractionStatus, AiTask

_OVER_FETCH_FACTOR = 3


def _escape_like(value: str) -> str:
    """Escapes literal SQL LIKE/ILIKE metacharacters in user-controlled
    input. Without this, a job title containing `%` or `_` (e.g. "Support
    Engineer (50% Remote)") turns into unintended wildcards, silently
    matching (and grounding an analysis in) unrelated job titles — found by
    code review, not something that ever surfaced in this session's own
    test data (none of it happened to contain these characters)."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


# "Case Retrieval" per the architecture doc's Historical Cases concept — but
# deliberately not semantic search: matching on job title text only. Real
# similarity search would need embeddings on AiInteraction too, which
# doesn't exist yet; this is a disclosed simplification, same spirit as
# OrchestratorService's rule-based routing rather than an LLM intent
# classifier.
#
# Never includes candidate name/skills/resume text — only the anonymized
# outcome (score/recommendation/reasoning, plus the human correction if
# any) via domain.candidate_analysis.historical_case.build_historical_case.
# AiInteraction spans every company's candidates, so leaking one company's
# applicant details into another company's CANDIDATE_ANALYSIS prompt would
# be a real cross-tenant PII exposure — the exact gap flagged in the System
# Understanding Report this was built from.
class HistoricalCaseService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def find_similar(self, job_title: str, limit: int = 3) -> list[HistoricalCase]:
        stmt = (
            select(AiInteraction, AiFeedback)
            .join(AiFeedback, AiFeedback.interaction_id == AiInteraction.id)
            .where(
                AiInteraction.task == AiTask.CANDIDATE_ANALYSIS,
                AiInteraction.status == AiInteractionStatus.SUCCESS,
                AiInteraction.output.isnot(None),
                # .as_string(), not .astext — the column is generic
                # sqlalchemy.JSON, not postgresql.JSONB; .astext only exists
                # on the JSONB-specific comparator. escape="\\" pairs with
                # _escape_like() above.
                AiInteraction.input["job"]["title"]
                .as_string()
                .ilike(f"%{_escape_like(job_title)}%", escape="\\"),
            )
            .order_by(AiFeedback.created_at.desc())
            .limit(limit * _OVER_FETCH_FACTOR)
        )
        result = await self._db.execute(stmt)

        seen_interaction_ids: set[str] = set()
        cases: list[HistoricalCase] = []
        for interaction, feedback in result.all():
            # Rows are ordered feedback-newest-first, so the first time an
            # interaction_id appears here is necessarily that interaction's
            # own most recent feedback — later (older) rows for the same
            # interaction are correctly skipped by the seen-set below.
            if interaction.id in seen_interaction_ids:
                continue
            seen_interaction_ids.add(interaction.id)

            case = build_historical_case(
                job_title_fallback=job_title,
                job=interaction.input.get("job", {}),
                feedback_action=feedback.action,
                corrected_output=feedback.corrected_output,
                interaction_output=interaction.output,
                correction_reason=feedback.reason,
            )
            if case is None:
                continue

            cases.append(case)
            if len(cases) >= limit:
                break

        return cases
