from app.domain.candidate_analysis.consistency import check_score_recommendation_consistency


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
