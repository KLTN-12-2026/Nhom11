import uuid
from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.config import get_settings
from app.core.rag_database import RagBase

_EMBEDDING_DIMENSIONS = get_settings().embedding_dimensions


# One row per chunk of a RagDocument, embedded once at ingestion time.
# Retrieval (RagRetrievalService) does a pgvector similarity search directly
# against `embedding` — chunks are the unit of retrieval, not documents,
# since a whole document is usually far more than what should ever land in
# a single prompt (see the architecture doc: "không đưa toàn bộ knowledge
# base vào prompt, chỉ retrieve context liên quan").
class RagChunk(RagBase):
    __tablename__ = "rag_chunks"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    document_id: Mapped[str] = mapped_column(
        String, ForeignKey("rag_documents.id", ondelete="CASCADE"), nullable=False
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(Vector(_EMBEDDING_DIMENSIONS), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
