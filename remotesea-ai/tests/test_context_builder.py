from app.domain.orchestrator.context_builder import build_context
from app.domain.orchestrator.history_turn import HistoryTurn
from app.domain.rag.retrieved_chunk import RetrievedChunk
from app.schemas.orchestrator import OrchestratorContext


def _context(**overrides) -> OrchestratorContext:
    defaults = dict(user_id="user-1", role="EMPLOYER", employer_id=None, company_role=None)
    defaults.update(overrides)
    return OrchestratorContext(**defaults)


def _chunk(title: str, content: str, distance: float = 0.3) -> RetrievedChunk:
    return RetrievedChunk(
        chunk_id="chunk-1",
        document_id="doc-1",
        document_title=title,
        document_source="test",
        content=content,
        distance=distance,
    )


class TestBuildContext:
    def test_includes_user_role(self):
        prompt = build_context(_context(role="TALENT"), "What is my status?", None, [])
        assert "Role: TALENT" in prompt

    def test_includes_company_info_for_employer(self):
        context = _context(role="EMPLOYER", employer_id="employer-1", company_role="OWNER")
        prompt = build_context(context, "question", None, [])
        assert "employer-1" in prompt
        assert "OWNER" in prompt

    def test_omits_live_data_section_when_no_application_data(self):
        prompt = build_context(_context(), "question", None, [])
        assert "AUTHORIZED LIVE DATA" not in prompt

    def test_includes_live_data_section_when_application_data_present(self):
        prompt = build_context(_context(), "question", {"id": "app-1", "status": "PENDING"}, [])
        assert "AUTHORIZED LIVE DATA" in prompt
        assert "app-1" in prompt

    def test_omits_knowledge_section_when_no_chunks(self):
        prompt = build_context(_context(), "question", None, [])
        assert "REMOTESEA KNOWLEDGE" not in prompt

    def test_includes_knowledge_section_with_chunk_content(self):
        chunks = [_chunk("Interview Policy", "Interviews need 48 hours notice.")]
        prompt = build_context(_context(), "question", None, chunks)
        assert "REMOTESEA KNOWLEDGE" in prompt
        assert "Interview Policy" in prompt
        assert "48 hours notice" in prompt

    def test_includes_question_verbatim(self):
        prompt = build_context(_context(), "Why was this candidate rejected?", None, [])
        assert "USER QUESTION" in prompt
        assert "Why was this candidate rejected?" in prompt

    def test_live_data_is_truncated_when_oversized(self):
        huge_data = {"summary": "x" * 5000}
        prompt = build_context(_context(), "question", huge_data, [])
        assert "[truncated]" in prompt
        assert len(prompt) < 3000

    def test_knowledge_is_truncated_when_chunks_are_large(self):
        chunks = [_chunk(f"Doc {i}", "y" * 2000) for i in range(5)]
        prompt = build_context(_context(), "question", None, chunks)
        knowledge_section = prompt.split("REMOTESEA KNOWLEDGE")[1]
        assert len(knowledge_section) < 3500

    def test_section_order_is_stable(self):
        chunks = [_chunk("Doc", "content")]
        prompt = build_context(_context(), "question", {"id": "app-1"}, chunks)
        user_pos = prompt.index("CURRENT USER")
        live_pos = prompt.index("AUTHORIZED LIVE DATA")
        knowledge_pos = prompt.index("REMOTESEA KNOWLEDGE")
        question_pos = prompt.index("USER QUESTION")
        assert user_pos < live_pos < knowledge_pos < question_pos

    def test_omits_related_conversations_section_when_absent(self):
        prompt = build_context(_context(), "question", None, [])
        assert "RELATED PAST CONVERSATIONS" not in prompt

    def test_includes_related_conversations_section_when_present(self):
        related = [HistoryTurn(question="What is our notice policy?", answer="48 hours.")]
        prompt = build_context(_context(), "question", None, [], related_turns=related)
        assert "RELATED PAST CONVERSATIONS" in prompt
        assert "What is our notice policy?" in prompt

    def test_related_conversations_distinct_from_current_history(self):
        history = [HistoryTurn(question="Current Q", answer="Current A")]
        related = [HistoryTurn(question="Past Q", answer="Past A")]
        prompt = build_context(_context(), "question", None, [], history=history, related_turns=related)
        assert "CONVERSATION HISTORY" in prompt
        assert "RELATED PAST CONVERSATIONS" in prompt
        history_section = prompt.split("CONVERSATION HISTORY")[1].split("RELATED PAST CONVERSATIONS")[0]
        assert "Current Q" in history_section
        assert "Past Q" not in history_section

    def test_related_conversations_truncated_when_oversized(self):
        related = [HistoryTurn(question=f"Q{i}", answer="y" * 500) for i in range(5)]
        prompt = build_context(_context(), "question", None, [], related_turns=related)
        related_section = prompt.split("RELATED PAST CONVERSATIONS")[1]
        assert len(related_section) < 1500
