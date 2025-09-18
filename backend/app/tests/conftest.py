"""Test configuration and fixtures."""
import pytest
from fastapi.testclient import TestClient
from ..main import app


@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)


@pytest.fixture
def sample_search_request():
    """Sample search request for testing."""
    return {
        "query": "test search",
        "size": 10,
        "from_": 0
    }
