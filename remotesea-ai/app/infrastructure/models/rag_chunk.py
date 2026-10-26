import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.rag_db import RagBase


# One row per chunk of a RagDocument, embedded once at ingestion time. The
# embedding vector itself lives in Qdrant (infrastructure/qdrant_client.py),
# keyed by this same id — this table keeps id/document_id/chunk_index/
# content only, which RagRetrievalService's full-text search half still
# queries directly (Postgres does ranked full-text search; Qdrant does
# vector search — see the RRF fusion of the two in that service). Chunks
# are the unit of retrieval, not documents, since a whole document is
# usually far more than what should ever land in a single prompt (see the
# architecture doc: "không đưa toàn bộ knowledge base vào prompt, chỉ
# retrieve context liên quan").
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
