from app.infrastructure.config import get_settings
from app.infrastructure.database import create_database

# The AI Learning Loop's own database — deliberately separate from
# remotesea-api's Supabase instance ("AI Service phải là một service độc
# lập") and from the RAG database (see rag_db.py) — this holds
# ai_interactions/ai_feedback/ai_datasets/ai_models/ai_conversations/
# ai_conversation_turns.
_handle = create_database(get_settings().database_url)

Base = _handle.base
get_db = _handle.get_session
