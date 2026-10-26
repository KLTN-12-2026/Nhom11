import pytest
from pydantic import ValidationError

from app.infrastructure.models.ai_feedback import AiFeedbackAction
from app.schemas.feedback import FeedbackRequest


def _base(**overrides) -> dict:
    defaults = dict(interactionId="interaction-1", userId="user-1", action="ACCEPT")
    defaults.update(overrides)
    return defaults


class TestFeedbackRequestValidation:
    def test_accept_without_corrected_output_is_valid(self):
        request = FeedbackRequest.model_validate(_base(action="ACCEPT"))
        assert request.action == AiFeedbackAction.ACCEPT
        assert request.corrected_output is None

    def test_reject_without_corrected_output_is_valid(self):
        request = FeedbackRequest.model_validate(_base(action="REJECT"))
        assert request.action == AiFeedbackAction.REJECT

    def test_edit_without_corrected_output_is_rejected(self):
        with pytest.raises(ValidationError, match="correctedOutput is required"):
            FeedbackRequest.model_validate(_base(action="EDIT"))

    def test_edit_with_corrected_output_is_valid(self):
        request = FeedbackRequest.model_validate(
            _base(action="EDIT", correctedOutput={"score": 50})
        )
        assert request.corrected_output == {"score": 50}

    def test_invalid_action_is_rejected(self):
        with pytest.raises(ValidationError):
            FeedbackRequest.model_validate(_base(action="MAYBE"))
