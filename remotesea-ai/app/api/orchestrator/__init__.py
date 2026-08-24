from fastapi import APIRouter

from app.api.orchestrator import ask, chat, health, tools

router = APIRouter(prefix="/v1/orchestrator")
router.include_router(health.router)
router.include_router(tools.router)
router.include_router(ask.router)
router.include_router(chat.router)
