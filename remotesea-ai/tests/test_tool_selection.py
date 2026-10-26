from app.domain.orchestrator.tool_selection import build_tool_selection_prompt


class TestBuildToolSelectionPrompt:
    def test_includes_question_verbatim(self):
        prompt = build_tool_selection_prompt(
            "How did the interview go?", ["application", "candidate_analysis", "interview"]
        )
        assert "How did the interview go?" in prompt

    def test_includes_available_tools(self):
        prompt = build_tool_selection_prompt("question", ["application", "interview"])
        assert "application" in prompt
        assert "interview" in prompt

    def test_omits_tool_not_in_available_list(self):
        prompt = build_tool_selection_prompt("question", ["application"])
        assert "candidate_analysis" not in prompt

    def test_handles_empty_available_tools_without_crashing(self):
        prompt = build_tool_selection_prompt("hello, thanks!", [])
        assert "hello, thanks!" in prompt
        assert "none" in prompt.lower()
