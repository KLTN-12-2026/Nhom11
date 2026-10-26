from fastapi import Header, HTTPException, status


# Tools/ask/chat need the raw token to forward to remotesea-api, not just
# the decoded context — require_orchestrator_context already proved this
# token is valid, so this just extracts the same string rather than
# re-deciding anything.
def bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token"
        )
    return authorization.removeprefix("Bearer ")
