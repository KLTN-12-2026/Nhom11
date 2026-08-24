from app.infrastructure.config import get_settings
from app.infrastructure.database import create_database

# A genuinely separate database (remotesea_rag), not a schema inside the
# main one — per the explicit decision to keep "system knowledge" storage
# independent from the AI Learning Loop's interaction/feedback/dataset/model
# tables. Needs the pgvector extension enabled on this database.
_handle = create_database(get_settings().rag_database_url)

RagBase = _handle.base
get_rag_db = _handle.get_session
