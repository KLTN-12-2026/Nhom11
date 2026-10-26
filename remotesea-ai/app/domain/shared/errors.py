def error_message(exc: Exception) -> str:
    """str(exc) is blank for some exception types (httpx.ReadTimeout,
    notably) — always fall back to the exception's class name so a
    persisted/returned error is never a silently empty string."""
    return str(exc) or type(exc).__name__
