from app.domain.candidate_analysis.historical_case import HistoricalCase
from app.domain.rag.retrieved_chunk import RetrievedChunk
from app.domain.shared.text import truncate
from app.schemas.inference import InferenceContext

# Same "bounded, not aspirational" caps as domain/orchestrator/context_builder.py
# — a handful of retrieved chunks/cases must not be able to balloon the
# prompt unchecked.
_MAX_KNOWLEDGE_CHARS = 1500
_MAX_HISTORY_CHARS = 1200


def build_candidate_analysis_prompt(
    context: InferenceContext,
    rag_chunks: list[RetrievedChunk] | None = None,
    historical_cases: list[HistoricalCase] | None = None,
) -> str:
    candidate, job = context.candidate, context.job
    parts = [
        f"Job title: {job.title}",
        f"Seniority level: {job.level}" if job.level else None,
        f"Job description:\n{job.description}",
        f"Requirements:\n{job.requirements}" if job.requirements else None,
        f"\nCandidate name: {candidate.name}" if candidate.name else None,
        f"Candidate headline: {candidate.headline}" if candidate.headline else None,
        f"Candidate bio: {candidate.bio}" if candidate.bio else None,
        f"Candidate skills: {', '.join(candidate.skills)}"
        if candidate.skills
        else None,
        f"Years of experience: {candidate.years_experience}"
        if candidate.years_experience is not None
        else None,
        f"Resume text:\n{candidate.resume_text}" if candidate.resume_text else None,
        f"\nCover letter:\n{context.application.cover_letter}"
        if context.application and context.application.cover_letter
        else None,
    ]

    if rag_chunks:
        knowledge_parts = []
        remaining = _MAX_KNOWLEDGE_CHARS
        for chunk in rag_chunks:
            if remaining <= 0:
                break
            entry = truncate(f"[{chunk.document_title}] {chunk.content}", remaining)
            knowledge_parts.append(entry)
            remaining -= len(entry)
        parts.append("\nRELEVANT KNOWLEDGE\n" + "\n\n".join(knowledge_parts))

    if historical_cases:
        case_parts = []
        remaining = _MAX_HISTORY_CHARS
        for case in historical_cases:
            if remaining <= 0:
                break
            note = (
                f" (human corrected: {case.correction_reason})"
                if case.was_corrected and case.correction_reason
                else ""
            )
            entry = truncate(
                f"- {case.job_title}"
                + (f" ({case.job_level})" if case.job_level else "")
                + f": {case.recommendation}, score {case.score}. {case.reasoning}{note}",
                remaining,
            )
            case_parts.append(entry)
            remaining -= len(entry)
        parts.append(
            "\nSIMILAR HISTORICAL CASES (reference only, not policy)\n" + "\n".join(case_parts)
        )

    return "\n".join(p for p in parts if p)
