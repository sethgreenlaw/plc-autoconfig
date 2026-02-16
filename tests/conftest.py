"""
Pytest configuration and fixtures for PLC AutoConfig tests.
Sets up FastAPI test client using httpx AsyncClient.
"""
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
import sys
import os

# Add the api directory to the path so we can import the app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))

from index import app


@pytest_asyncio.fixture
async def async_client():
    """Async HTTP client for testing FastAPI endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def test_client():
    """Synchronous test client (for reference, not used in async tests)."""
    return TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """Setup test environment variables."""
    os.environ["ANTHROPIC_API_KEY"] = "test-key-for-testing-only"
    yield
