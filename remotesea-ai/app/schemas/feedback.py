from typing import Any

from pydantic import BaseModel, ConfigDict, model_validator
from pydantic.alias_generators import to_camel

from app.models.ai_feedback import AiFeedbackAction

_CAMEL_CONFIG = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class FeedbackRequest(BaseModel):
    model_config = _CAMEL_CONFIG

    interaction_id: str
    user_id: str
    action: AiFeedbackAction
    # Required when action is EDIT (the human's corrected output — see
    # AiFeedback.corrected_output), meaningless otherwise. Validated below
    # rather than at the DB layer, so a bad request 422s immediately instead
    # of silently storing an EDIT with no correction.
    corrected_output: dict[str, Any] | None = None
    reason: str | None = None

    @model_validator(mode="after")
    def _corrected_output_required_for_edit(self) -> "FeedbackRequest":
        if self.action == AiFeedbackAction.EDIT and self.corrected_output is None:
            raise ValueError("correctedOutput is required when action is EDIT")
        return self


class FeedbackResponse(BaseModel):
    model_config = _CAMEL_CONFIG

    id: str
    interaction_id: str
    action: AiFeedbackAction
    created_at: str
