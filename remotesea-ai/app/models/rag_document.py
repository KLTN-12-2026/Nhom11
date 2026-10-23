import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.rag_database import RagBase


# The source knowledge item before chunking — a policy doc, an FAQ entry, a
# guideline. `content` keeps the full original text (chunks are derived,
# re-chunkable from here without re-ingesting from wherever the source came
# from). Deleting a document cascades to its chunks at the DB level (see
# RagChunk.document_id's ondelete="CASCADE") — a document is re-ingested as
# a whole, never patched chunk-by-chunk.
class RagDocument(RagBase):
    __tablename__ = "rag_documents"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    # Free-form label for where this knowledge came from (e.g. "recruitment-
    # policy", "interview-guidelines") — not an enum, since the spec's own
    # knowledge-base categories (business rules, evaluation guidelines,
    # historical cases, ...) aren't a fixed, known-in-advance set.
    source: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
