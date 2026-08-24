from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


# Every schema on this API boundary speaks camelCase (matching the
# architecture doc's own request/response examples, and
# remotesea-api/remotesea-web's convention on the other side of the wire)
# while staying snake_case internally — populate_by_name lets callers
# construct instances with either name in tests. One shared base instead of
# every schema file redefining the same ConfigDict.
class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# Same, but tolerates unknown fields — for wrapping another service's
# response shape verbatim (see InterviewToolResult) where a field this
# service hasn't independently verified byte-for-byte shouldn't 500 the
# whole call.
class PermissiveCamelModel(CamelModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="allow")
