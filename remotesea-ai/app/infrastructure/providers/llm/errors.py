# Raised by every AiModelProvider implementation on a request failure — the
# application layer catches this (or Exception generally, as it already
# does in inference_service.py/orchestrator_service.py) without needing to
# know which vendor's HTTP error shape produced it.
class AiProviderError(Exception):
    pass
