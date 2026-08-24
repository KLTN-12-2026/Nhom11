# available_tools is empty when there's no applicationId (nothing
# application-specific to fetch) — the classification call still runs in
# that case, just to decide needsKnowledge alone (see
# OrchestratorService._select_tools).
def build_tool_selection_prompt(question: str, available_tools: list[str]) -> str:
    sources = ", ".join(available_tools) if available_tools else "none (no specific application in context)"
    return "\n".join(
        [
            f"Available data sources: {sources}",
            "",
            "QUESTION",
            question,
        ]
    )
