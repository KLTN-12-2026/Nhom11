from dataclasses import dataclass


@dataclass
class RetrievedChunk:
    chunk_id: str
    document_id: str
    document_title: str
    document_source: str
    content: str
    # Cosine distance, not similarity — 0.0 is an exact match, larger is
    # less similar. Left as the raw pgvector distance rather than converted
    # to a 0-1 "similarity score" so callers aren't misled into thinking
    # it's calibrated/comparable across embedding models.
    distance: float
