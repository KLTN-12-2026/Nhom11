from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

_CAMEL_CONFIG = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class IngestDocumentRequest(BaseModel):
    model_config = _CAMEL_CONFIG

    title: str
    source: str
    content: str = Field(min_length=1)


class DocumentResponse(BaseModel):
    model_config = _CAMEL_CONFIG

    id: str
    title: str
    source: str
    created_at: datetime


class SearchRequest(BaseModel):
    model_config = _CAMEL_CONFIG

    query: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)


class RetrievedChunkResponse(BaseModel):
    model_config = _CAMEL_CONFIG

    chunk_id: str
    document_id: str
    document_title: str
    document_source: str
    content: str
    distance: float
