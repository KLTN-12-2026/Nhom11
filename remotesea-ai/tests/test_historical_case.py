from app.domain.candidate_analysis.historical_case import build_historical_case

VALID_OUTPUT = {
    "score": 78,
    "recommendation": "SHORTLIST",
    "strengths": ["5 years Python"],
    "weaknesses": [],
    "missingRequirements": [],
    "reasoning": "Strong candidate.",
}


class TestBuildHistoricalCase:
    def test_accept_uses_interaction_output(self):
        case = build_historical_case(
            job_title_fallback="Backend Engineer",
            job={"title": "Backend Engineer", "level": "SENIOR"},
            feedback_action="ACCEPT",
            corrected_output=None,
            interaction_output=VALID_OUTPUT,
            correction_reason=None,
        )
        assert case is not None
        assert case.score == 78
        assert case.recommendation == "SHORTLIST"
        assert case.was_corrected is False

    def test_edit_uses_corrected_output(self):
        corrected = {**VALID_OUTPUT, "score": 40, "recommendation": "REJECT"}
        case = build_historical_case(
            job_title_fallback="Backend Engineer",
            job={"title": "Backend Engineer"},
            feedback_action="EDIT",
            corrected_output=corrected,
            interaction_output=VALID_OUTPUT,
            correction_reason="Salary expectation too high",
        )
        assert case is not None
        assert case.score == 40
        assert case.recommendation == "REJECT"
        assert case.was_corrected is True
        assert case.correction_reason == "Salary expectation too high"

    def test_reject_returns_none(self):
        case = build_historical_case(
            job_title_fallback="Backend Engineer",
            job={"title": "Backend Engineer"},
            feedback_action="REJECT",
            corrected_output=None,
            interaction_output=VALID_OUTPUT,
            correction_reason=None,
        )
        assert case is None

    def test_missing_ground_truth_returns_none(self):
        case = build_historical_case(
            job_title_fallback="Backend Engineer",
            job={"title": "Backend Engineer"},
            feedback_action="ACCEPT",
            corrected_output=None,
            interaction_output=None,
            correction_reason=None,
        )
        assert case is None

    def test_stale_schema_ground_truth_returns_none(self):
        # Real data surfaced this: interactions from before a schema change
        # (old fitScore/summary shape) still exist in ai_interactions.
        stale_output = {"fitScore": 90, "summary": "Great fit", "recommendation": "STRONG_YES"}
        case = build_historical_case(
            job_title_fallback="Backend Engineer",
            job={"title": "Backend Engineer"},
            feedback_action="ACCEPT",
            corrected_output=None,
            interaction_output=stale_output,
            correction_reason=None,
        )
        assert case is None

    def test_job_title_fallback_used_when_job_dict_missing_title(self):
        case = build_historical_case(
            job_title_fallback="Backend Engineer",
            job={},
            feedback_action="ACCEPT",
            corrected_output=None,
            interaction_output=VALID_OUTPUT,
            correction_reason=None,
        )
        assert case is not None
        assert case.job_title == "Backend Engineer"

    def test_never_includes_candidate_pii_fields(self):
        # HistoricalCase's own fields are the real guard (no name/skills
        # attributes exist on the dataclass at all) — this just confirms
        # passing a job dict with extra keys doesn't leak them through.
        case = build_historical_case(
            job_title_fallback="Backend Engineer",
            job={"title": "Backend Engineer", "candidateName": "Should Not Appear"},
            feedback_action="ACCEPT",
            corrected_output=None,
            interaction_output=VALID_OUTPUT,
            correction_reason=None,
        )
        assert case is not None
        assert not hasattr(case, "candidate_name")
        assert "Should Not Appear" not in vars(case).values()
