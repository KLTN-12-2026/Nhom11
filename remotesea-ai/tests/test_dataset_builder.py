from datetime import datetime, timezone

from app.models.ai_feedback import AiFeedback, AiFeedbackAction
from app.models.ai_interaction import AiInteraction, AiInteractionStatus, AiTask
from app.services.dataset_builder import (
    UnsupportedDatasetTaskError,
    build_examples,
    split_examples,
)

VALID_OUTPUT = {
    "score": 78,
    "recommendation": "SHORTLIST",
    "strengths": ["5 years Python"],
    "weaknesses": [],
    "missingRequirements": [],
    "reasoning": "Strong candidate.",
}


def _interaction(input_payload: dict, output: dict | None = VALID_OUTPUT) -> AiInteraction:
    return AiInteraction(
        id="interaction-1",
        task=AiTask.CANDIDATE_ANALYSIS,
        user_id="user-1",
        input=input_payload,
        output=output,
        model_version="ollama:qwen2.5:3b-instruct",
        latency_ms=100,
        status=AiInteractionStatus.SUCCESS,
        created_at=datetime.now(timezone.utc),
    )


def _feedback(action: AiFeedbackAction, corrected_output: dict | None = None) -> AiFeedback:
    return AiFeedback(
        id="feedback-1",
        interaction_id="interaction-1",
        user_id="user-2",
        action=action,
        corrected_output=corrected_output,
        created_at=datetime.now(timezone.utc),
    )


class TestBuildExamples:
    def test_accept_uses_interaction_output(self):
        interaction = _interaction({"candidate": {"name": "Mai"}})
        feedback = _feedback(AiFeedbackAction.ACCEPT)

        examples, summary = build_examples([(interaction, feedback)], AiTask.CANDIDATE_ANALYSIS)

        assert len(examples) == 1
        assert examples[0]["output"] == VALID_OUTPUT
        assert examples[0]["input"] == {"candidate": {"name": "Mai"}}
        assert summary["deduplicatedTo"] == 1

    def test_edit_uses_corrected_output(self):
        corrected = {**VALID_OUTPUT, "score": 40, "recommendation": "REJECT"}
        interaction = _interaction({"candidate": {"name": "Mai"}})
        feedback = _feedback(AiFeedbackAction.EDIT, corrected_output=corrected)

        examples, _ = build_examples([(interaction, feedback)], AiTask.CANDIDATE_ANALYSIS)

        assert examples[0]["output"] == corrected

    def test_reject_is_excluded(self):
        interaction = _interaction({"candidate": {"name": "Mai"}})
        feedback = _feedback(AiFeedbackAction.REJECT)

        examples, summary = build_examples([(interaction, feedback)], AiTask.CANDIDATE_ANALYSIS)

        assert examples == []
        assert summary["excludedReject"] == 1

    def test_invalid_ground_truth_schema_is_excluded(self):
        interaction = _interaction({"candidate": {"name": "Mai"}})
        feedback = _feedback(AiFeedbackAction.EDIT, corrected_output={"score": "not-a-number"})

        examples, summary = build_examples([(interaction, feedback)], AiTask.CANDIDATE_ANALYSIS)

        assert examples == []
        assert summary["excludedInvalidOrMissingGroundTruth"] == 1

    def test_duplicate_input_keeps_latest(self):
        interaction_a = _interaction({"candidate": {"name": "Mai"}}, output=VALID_OUTPUT)
        interaction_a.id = "interaction-a"
        feedback_a = _feedback(AiFeedbackAction.ACCEPT)
        feedback_a.interaction_id = "interaction-a"

        newer_output = {**VALID_OUTPUT, "score": 90}
        interaction_b = _interaction({"candidate": {"name": "Mai"}}, output=newer_output)
        interaction_b.id = "interaction-b"
        feedback_b = _feedback(AiFeedbackAction.ACCEPT)
        feedback_b.interaction_id = "interaction-b"

        examples, summary = build_examples(
            [(interaction_a, feedback_a), (interaction_b, feedback_b)],
            AiTask.CANDIDATE_ANALYSIS,
        )

        assert len(examples) == 1
        assert examples[0]["output"]["score"] == 90

    def test_unsupported_task_raises(self):
        interaction = _interaction({"candidate": {"name": "Mai"}})
        interaction.task = AiTask.JOB_MATCHING
        feedback = _feedback(AiFeedbackAction.ACCEPT)

        try:
            build_examples([(interaction, feedback)], AiTask.JOB_MATCHING)
            assert False, "expected UnsupportedDatasetTaskError"
        except UnsupportedDatasetTaskError:
            pass


class TestSplitExamples:
    def test_small_n_all_goes_to_train(self):
        examples = [{"i": i} for i in range(5)]
        train, validation, test = split_examples(examples)
        assert len(train) == 5
        assert validation == []
        assert test == []

    def test_larger_n_splits_roughly_80_10_10(self):
        examples = [{"i": i} for i in range(100)]
        train, validation, test = split_examples(examples)
        assert len(train) == 80
        assert len(validation) == 10
        assert len(test) == 10
        assert len(train) + len(validation) + len(test) == 100

    def test_deterministic_across_calls(self):
        examples = [{"i": i} for i in range(50)]
        first = split_examples(examples)
        second = split_examples(examples)
        assert first == second
