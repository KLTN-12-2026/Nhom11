from datetime import datetime

from pydantic import Field

from app.schemas.base import CamelModel


class IngestDocumentRequest(CamelModel):
    title: str
    source: str
    content: str = Field(min_length=1)


class DocumentResponse(CamelModel):
    id: str
    title: str
    source: str
    created_at: datetime


class SearchRequest(CamelModel):
    query: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)


class RetrievedChunkResponse(CamelModel):
    chunk_id: str
    document_id: str
    document_title: str
    document_source: str
    content: str
    distance: float
