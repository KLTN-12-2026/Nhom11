# Soft monitoring only — bands are heuristics for flagging a likely model
# mistake, never a business rule this service enforces. The model's own
# score/recommendation are always what gets persisted/returned; this only
# adds visibility when the two look mismatched (e.g. a high score paired
# with REJECT), consistent with the system prompt's own stated boundary:
# "Business rules... belong to RemoteSea's own code, not to you."
_SHORTLIST_MIN_SCORE = 65
_REJECT_MAX_SCORE = 40


def check_score_recommendation_consistency(score: int, recommendation: str) -> str | None:
    if recommendation == "SHORTLIST" and score < _SHORTLIST_MIN_SCORE:
        return f"SHORTLIST with a low score ({score})"
    if recommendation == "REJECT" and score > _REJECT_MAX_SCORE:
        return f"REJECT with a high score ({score})"
    return None
