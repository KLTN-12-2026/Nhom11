from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_service_auth
from app.models.ai_interaction import AiTask
from app.schemas.dataset import BuildDatasetRequest, DatasetResponse
from app.services.dataset_builder import DatasetBuilder

router = APIRouter(
    prefix="/v1/datasets", tags=["datasets"], dependencies=[Depends(require_service_auth)]
)


def _get_builder(db: AsyncSession = Depends(get_db)) -> DatasetBuilder:
    return DatasetBuilder(db)


def _to_response(dataset) -> DatasetResponse:
    return DatasetResponse(
        id=dataset.id,
        task=dataset.task,
        version=dataset.version,
        status=dataset.status,
        sample_count=dataset.sample_count,
        train_count=dataset.train_count,
        validation_count=dataset.validation_count,
        test_count=dataset.test_count,
        train_path=dataset.train_path,
        validation_path=dataset.validation_path,
        test_path=dataset.test_path,
        build_summary=dataset.build_summary,
        created_at=dataset.created_at.isoformat(),
    )


# Deliberately synchronous, no job queue — a build is a bounded DB read +
# JSONL write over however many interactions exist today, not the training
# run itself (that's Colab's job, see notebooks/qlora_training.ipynb).
# Explicitly invoked, per the architecture doc's hard rule that feedback
# must never auto-trigger dataset building or training.
@router.post("/build", response_model=DatasetResponse, status_code=201)
async def build_dataset(
    request: BuildDatasetRequest,
    builder: DatasetBuilder = Depends(_get_builder),
) -> DatasetResponse:
    dataset = await builder.build(request.task)
    return _to_response(dataset)


@router.get("", response_model=list[DatasetResponse])
async def list_datasets(
    task: AiTask = Query(default=AiTask.CANDIDATE_ANALYSIS),
    builder: DatasetBuilder = Depends(_get_builder),
) -> list[DatasetResponse]:
    datasets = await builder.list_versions(task)
    return [_to_response(d) for d in datasets]
