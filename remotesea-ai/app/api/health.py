from fastapi import APIRouter

router = APIRouter(tags=["health"])


# No auth, no DB round-trip — a container orchestrator's liveness probe
# should never fail because the database or Ollama is briefly unreachable
# (that's what readiness checks are for).
@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
