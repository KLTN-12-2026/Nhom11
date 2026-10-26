from app.domain.candidate_analysis.consistency import (
    check_missing_requirements_against_skills,
    check_score_recommendation_consistency,
)


class TestCheckScoreRecommendationConsistency:
    def test_shortlist_with_high_score_is_consistent(self):
        assert check_score_recommendation_consistency(85, "SHORTLIST") is None

    def test_reject_with_low_score_is_consistent(self):
        assert check_score_recommendation_consistency(10, "REJECT") is None

    def test_review_never_flagged(self):
        assert check_score_recommendation_consistency(0, "REVIEW") is None
        assert check_score_recommendation_consistency(100, "REVIEW") is None

    def test_shortlist_with_low_score_is_flagged(self):
        warning = check_score_recommendation_consistency(30, "SHORTLIST")
        assert warning is not None
        assert "30" in warning

    def test_reject_with_high_score_is_flagged(self):
        warning = check_score_recommendation_consistency(90, "REJECT")
        assert warning is not None
        assert "90" in warning

    def test_boundary_scores_are_not_flagged(self):
        assert check_score_recommendation_consistency(65, "SHORTLIST") is None
        assert check_score_recommendation_consistency(40, "REJECT") is None


class TestCheckMissingRequirementsAgainstSkills:
    def test_no_overlap_returns_empty(self):
        result = check_missing_requirements_against_skills(
            ["5+ years distributed systems"], ["Python", "SQL"]
        )
        assert result == []

    def test_flags_requirement_that_names_a_listed_skill(self):
        result = check_missing_requirements_against_skills(
            ["Experience with Kubernetes in production"], ["Kubernetes"]
        )
        assert result == ["Experience with Kubernetes in production"]

    def test_case_insensitive_match(self):
        result = check_missing_requirements_against_skills(["Needs AWS experience"], ["aws"])
        assert result == ["Needs AWS experience"]

    def test_empty_missing_requirements_returns_empty(self):
        assert check_missing_requirements_against_skills([], ["Python"]) == []

    def test_empty_skills_returns_empty(self):
        assert check_missing_requirements_against_skills(["Needs Go"], []) == []

    def test_only_flags_the_matching_entry_not_all(self):
        result = check_missing_requirements_against_skills(
            ["Needs Kubernetes", "Needs 10 years leadership"], ["Kubernetes"]
        )
        assert result == ["Needs Kubernetes"]
