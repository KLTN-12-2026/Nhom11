import json

from app.services.inference_service import (
    _build_candidate_analysis_prompt,
    _parse_candidate_analysis,
)
from app.schemas.inference import ApplicationContext, CandidateContext, InferenceContext, JobContext


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


class TestBuildCandidateAnalysisPrompt:
    def test_includes_job_and_candidate_fields(self):
        prompt = _build_candidate_analysis_prompt(_context())
        assert "Backend Engineer" in prompt
        assert "Mai Nguyen" in prompt
        assert "Python, SQL" in prompt

    def test_omits_unset_optional_fields(self):
        prompt = _build_candidate_analysis_prompt(_context())
        assert "Cover letter" not in prompt
        assert "Requirements:" not in prompt

    def test_includes_cover_letter_when_present(self):
        prompt = _build_candidate_analysis_prompt(
            _context(application=ApplicationContext(cover_letter="I'd love to join."))
        )
        assert "I'd love to join." in prompt


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
