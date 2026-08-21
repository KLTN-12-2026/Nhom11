from fastapi import FastAPI

from app.api.datasets import router as datasets_router
from app.api.feedback import router as feedback_router
from app.api.health import router as health_router
from app.api.inference import router as inference_router
from app.api.models import router as models_router
from app.core.logging import configure_logging

configure_logging()

app = FastAPI(
    title="RemoteSea AI Service",
    description="Self-hosted AI microservice for RemoteSea — inference, "
    "feedback, dataset, training, evaluation, and model registry "
    "(see README.md for the phased rollout).",
    version="0.1.0",
)

app.include_router(health_router)
app.include_router(inference_router)
app.include_router(feedback_router)
app.include_router(datasets_router)
app.include_router(models_router)
