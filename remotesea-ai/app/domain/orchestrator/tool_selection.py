def build_tool_selection_prompt(question: str, available_tools: list[str]) -> str:
    return "\n".join(
        [
            f"Available data sources: {', '.join(available_tools)}",
            "",
            "QUESTION",
            question,
        ]
    )
