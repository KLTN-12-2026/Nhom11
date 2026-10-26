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


# Targets one specific, checkable hallucination pattern rather than a
# general "fact-check everything" pass (which would need either a second
# LLM call or much more elaborate NLP than this is worth): a small model
# sometimes claims a job requirement is "missing" from a candidate who
# actually listed exactly that skill. Case-insensitive substring match is
# deliberately simple — it flags for a human to notice, it doesn't rewrite
# the model's output, so a false positive costs a glance, not a wrong
# answer silently shipped.
def check_missing_requirements_against_skills(
    missing_requirements: list[str], candidate_skills: list[str]
) -> list[str]:
    skills_lower = [skill.lower() for skill in candidate_skills if skill]
    return [
        requirement
        for requirement in missing_requirements
        if any(skill in requirement.lower() for skill in skills_lower)
    ]
