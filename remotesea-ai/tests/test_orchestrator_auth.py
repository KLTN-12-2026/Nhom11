from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import HTTPException

from app.infrastructure.config import get_settings
from app.infrastructure.security import require_orchestrator_context

SECRET = "test-secret-for-orchestrator-auth"


def _token(payload: dict, secret: str = SECRET, exp_delta: timedelta = timedelta(minutes=5)) -> str:
    claims = {
        **payload,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + exp_delta,
    }
    return jwt.encode(claims, secret, algorithm="HS256")


@pytest.fixture(autouse=True)
def _settings_secret(monkeypatch):
    monkeypatch.setenv("AI_SERVICE_SECRET", SECRET)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


class TestRequireOrchestratorContext:
    @pytest.mark.asyncio
    async def test_valid_token_decodes_context(self):
        token = _token(
            {"sub": "user-1", "role": "EMPLOYER", "employerId": "employer-1", "companyRole": "OWNER"}
        )
        context = await require_orchestrator_context(f"Bearer {token}")
        assert context.user_id == "user-1"
        assert context.role == "EMPLOYER"
        assert context.employer_id == "employer-1"
        assert context.company_role == "OWNER"

    @pytest.mark.asyncio
    async def test_talent_token_has_no_company_fields(self):
        token = _token({"sub": "user-2", "role": "TALENT"})
        context = await require_orchestrator_context(f"Bearer {token}")
        assert context.role == "TALENT"
        assert context.employer_id is None
        assert context.company_role is None

    @pytest.mark.asyncio
    async def test_missing_header_rejected(self):
        with pytest.raises(HTTPException) as exc_info:
            await require_orchestrator_context(None)
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_non_bearer_header_rejected(self):
        with pytest.raises(HTTPException) as exc_info:
            await require_orchestrator_context("Basic somevalue")
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_expired_token_rejected(self):
        token = _token({"sub": "user-1", "role": "TALENT"}, exp_delta=timedelta(minutes=-1))
        with pytest.raises(HTTPException) as exc_info:
            await require_orchestrator_context(f"Bearer {token}")
        assert exc_info.value.status_code == 401
        assert "expired" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_wrong_secret_rejected(self):
        token = _token({"sub": "user-1", "role": "TALENT"}, secret="wrong-secret")
        with pytest.raises(HTTPException) as exc_info:
            await require_orchestrator_context(f"Bearer {token}")
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_missing_required_claim_rejected(self):
        token = _token({"role": "TALENT"})  # no "sub"
        with pytest.raises(HTTPException) as exc_info:
            await require_orchestrator_context(f"Bearer {token}")
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_invalid_role_rejected(self):
        token = _token({"sub": "user-1", "role": "NOT_A_REAL_ROLE"})
        with pytest.raises(HTTPException) as exc_info:
            await require_orchestrator_context(f"Bearer {token}")
        assert exc_info.value.status_code == 401
