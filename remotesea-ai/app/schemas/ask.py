from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

_CAMEL_CONFIG = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class AskRequest(BaseModel):
    model_config = _CAMEL_CONFIG

    question: str = Field(min_length=1)
    # Optional page context — e.g. the recruiter is asking about a specific
    # candidate while looking at that Application Workspace page. When
    # given, its data is fetched as an authorized Tool call (see
    # tool_service.get_application) and folded into the prompt; when
    # omitted, this is treated as a general knowledge question and answered
    # from RAG alone.
    application_id: str | None = None


class AskResponse(BaseModel):
    model_config = _CAMEL_CONFIG

    answer: str
    # The model's own self-reported confidence — a soft signal, not a
    # calibrated probability. Never trust it for an automated decision.
    confidence: float = Field(ge=0.0, le=1.0)
    # Always computed by this service from what was actually
    # retrieved/fetched, never taken from the model's own output — an LLM
    # asked to name its sources is exactly the kind of claim worth not
    # trusting at face value.
    sources: list[str]
