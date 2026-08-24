import json
from typing import TypeVar

from pydantic import BaseModel, ValidationError

T = TypeVar("T", bound=BaseModel)


# LLMs are told to return only JSON but are never trusted to — a stray code
# fence or leading sentence is common enough to guard against rather than
# let it surface as an opaque 500. Extracts the first `{...}` substring,
# parses it, and validates against `model`; returns None on any failure
# (no `{...}` found, malformed JSON, or a schema mismatch) rather than
# raising — every caller treats "unparseable" as a normal, handled outcome.
def parse_json_object(raw: str, model: type[T]) -> T | None:
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1 or end < start:
        return None
    try:
        candidate = json.loads(raw[start : end + 1])
        return model.model_validate(candidate)
    except (json.JSONDecodeError, ValidationError):
        return None
