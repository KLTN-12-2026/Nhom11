import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rag_chunk import RagChunk
from app.models.rag_document import RagDocument
from app.providers.embedding_base import EmbeddingProvider
from app.services.chunker import chunk_text


class RagIngestionService:
    def __init__(self, db: AsyncSession, embedding_provider: EmbeddingProvider) -> None:
        self._db = db
        self._embedding_provider = embedding_provider

    async def ingest_document(self, title: str, source: str, content: str) -> RagDocument:
        chunks = chunk_text(content)
        if not chunks:
            raise ValueError("Document content produced zero chunks (empty after stripping)")

        embeddings = await self._embedding_provider.embed(chunks)

        document = RagDocument(id=str(uuid.uuid4()), title=title, source=source, content=content)
        self._db.add(document)
        # Flush before adding chunks — RagChunk.document_id is a plain FK
        # column, not an ORM relationship() (this codebase doesn't use
        # relationship() elsewhere either), so SQLAlchemy has no declared
        # dependency to order the inserts by and will otherwise insert
        # child rows before the parent they reference, violating the FK
        # constraint.
        await self._db.flush()
        for index, (chunk_content, embedding) in enumerate(zip(chunks, embeddings, strict=True)):
            self._db.add(
                RagChunk(
                    id=str(uuid.uuid4()),
                    document_id=document.id,
                    chunk_index=index,
                    content=chunk_content,
                    embedding=embedding,
                )
            )

        await self._db.commit()
        await self._db.refresh(document)
        return document
