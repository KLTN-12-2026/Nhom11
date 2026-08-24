import json

from app.domain.candidate_analysis.historical_case import HistoricalCase
from app.domain.candidate_analysis.prompt_builder import build_candidate_analysis_prompt
from app.domain.rag.retrieved_chunk import RetrievedChunk
from app.domain.shared.llm_json import parse_json_object
from app.schemas.inference import (
    ApplicationContext,
    CandidateAnalysisResult,
    CandidateContext,
    InferenceContext,
    JobContext,
)


def _context(**overrides) -> InferenceContext:
    defaults = dict(
        candidate=CandidateContext(name="Mai Nguyen", skills=["Python", "SQL"]),
        job=JobContext(title="Backend Engineer", description="Build APIs."),
        application=None,
    )
    defaults.update(overrides)
    return InferenceContext(**defaults)


VALID_RESULT = {
    "score": 78,
    "recommendation": "SHORTLIST",
    "strengths": ["5 years Python", "Led a team of 3"],
    "weaknesses": ["No GraphQL experience listed"],
    "missingRequirements": [],
    "reasoning": "Strong backend generalist with relevant experience.",
}


def _parse_candidate_analysis(raw: str) -> CandidateAnalysisResult | None:
    return parse_json_object(raw, CandidateAnalysisResult)


class TestBuildCandidateAnalysisPrompt:
    def test_includes_job_and_candidate_fields(self):
        prompt = build_candidate_analysis_prompt(_context())
        assert "Backend Engineer" in prompt
        assert "Mai Nguyen" in prompt
        assert "Python, SQL" in prompt

    def test_omits_unset_optional_fields(self):
        prompt = build_candidate_analysis_prompt(_context())
        assert "Cover letter" not in prompt
        assert "Requirements:" not in prompt

    def test_includes_cover_letter_when_present(self):
        prompt = build_candidate_analysis_prompt(
            _context(application=ApplicationContext(cover_letter="I'd love to join."))
        )
        assert "I'd love to join." in prompt

    def test_omits_knowledge_and_history_sections_when_absent(self):
        prompt = build_candidate_analysis_prompt(_context())
        assert "RELEVANT KNOWLEDGE" not in prompt
        assert "SIMILAR HISTORICAL CASES" not in prompt

    def test_includes_rag_chunk_content(self):
        chunks = [
            RetrievedChunk(
                chunk_id="c1",
                document_id="d1",
                document_title="Evaluation Guidelines",
                document_source="test",
                content="Prioritize demonstrated backend experience.",
                distance=0.2,
            )
        ]
        prompt = build_candidate_analysis_prompt(_context(), rag_chunks=chunks)
        assert "RELEVANT KNOWLEDGE" in prompt
        assert "Evaluation Guidelines" in prompt
        assert "Prioritize demonstrated backend experience." in prompt

    def test_includes_historical_case_and_marks_reference_only(self):
        cases = [
            HistoricalCase(
                job_title="Backend Engineer",
                job_level="SENIOR",
                score=70,
                recommendation="REVIEW",
                reasoning="Solid generalist, light on distributed systems.",
                was_corrected=False,
                correction_reason=None,
            )
        ]
        prompt = build_candidate_analysis_prompt(_context(), historical_cases=cases)
        assert "SIMILAR HISTORICAL CASES" in prompt
        assert "reference only, not policy" in prompt
        assert "Solid generalist" in prompt

    def test_includes_correction_reason_for_edited_case(self):
        cases = [
            HistoricalCase(
                job_title="Backend Engineer",
                job_level=None,
                score=90,
                recommendation="SHORTLIST",
                reasoning="Strong fit.",
                was_corrected=True,
                correction_reason="Salary expectation exceeded budget",
            )
        ]
        prompt = build_candidate_analysis_prompt(_context(), historical_cases=cases)
        assert "human corrected: Salary expectation exceeded budget" in prompt

    def test_never_leaks_candidate_name_in_historical_case_section(self):
        # HistoricalCase itself has no name/skills fields at all — this
        # pins that invariant at the prompt-building boundary too, so a
        # future field addition to HistoricalCase can't silently leak PII
        # into another company's prompt without a test noticing.
        cases = [
            HistoricalCase(
                job_title="Backend Engineer",
                job_level=None,
                score=50,
                recommendation="REJECT",
                reasoning="Insufficient experience.",
                was_corrected=False,
                correction_reason=None,
            )
        ]
        prompt = build_candidate_analysis_prompt(_context(), historical_cases=cases)
        assert "Mai Nguyen" not in prompt.split("SIMILAR HISTORICAL CASES")[1]


class TestParseCandidateAnalysis:
    def test_parses_well_formed_json(self):
        result = _parse_candidate_analysis(json.dumps(VALID_RESULT))
        assert result is not None
        assert result.score == 78
        assert result.recommendation == "SHORTLIST"

    def test_extracts_json_wrapped_in_prose(self):
        wrapped = f"Here you go:\n```json\n{json.dumps(VALID_RESULT)}\n```"
        result = _parse_candidate_analysis(wrapped)
        assert result is not None
        assert result.score == 78

    def test_returns_none_for_missing_required_field(self):
        broken = {**VALID_RESULT}
        del broken["recommendation"]
        assert _parse_candidate_analysis(json.dumps(broken)) is None

    def test_returns_none_for_invalid_recommendation_value(self):
        broken = {**VALID_RESULT, "recommendation": "MAYBE"}
        assert _parse_candidate_analysis(json.dumps(broken)) is None

    def test_returns_none_for_non_json_text(self):
        assert _parse_candidate_analysis("I couldn't analyze this candidate.") is None

    def test_returns_none_for_malformed_json(self):
        assert _parse_candidate_analysis("{score: 78, reasoning: }") is None
