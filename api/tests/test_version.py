"""Tests for version endpoint functionality."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_version_endpoint_exists():
    """Test that /version endpoint exists and returns 200."""
    resp = client.get("/version")
    assert resp.status_code == 200


def test_version_endpoint_returns_required_fields():
    """Test that /version endpoint returns all required fields."""
    resp = client.get("/version")
    data = resp.json()
    
    required_fields = [
        "version",
        "git_branch",
        "git_commit",
        "git_commit_full",
        "git_commit_date",
        "git_uncommitted_changes",
        "environment"
    ]
    
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"


def test_version_endpoint_field_types():
    """Test that /version endpoint returns correct data types."""
    resp = client.get("/version")
    data = resp.json()
    
    assert isinstance(data["version"], str)
    assert isinstance(data["git_branch"], str)
    assert isinstance(data["git_commit"], str)
    assert isinstance(data["git_commit_full"], str)
    assert isinstance(data["git_commit_date"], str)
    assert isinstance(data["git_uncommitted_changes"], bool)
    assert isinstance(data["environment"], str)


def test_version_endpoint_version_not_empty():
    """Test that version is not empty (reads from VERSION file)."""
    resp = client.get("/version")
    data = resp.json()
    
    # Version should not be empty unless VERSION file is missing
    assert len(data["version"]) > 0


def test_version_endpoint_environment_is_development():
    """Test that environment defaults to development in tests."""
    resp = client.get("/version")
    data = resp.json()
    
    assert data["environment"] == "development"


def test_version_endpoint_git_info_format():
    """Test that git info has expected format (may be 'unknown' in some environments)."""
    resp = client.get("/version")
    data = resp.json()
    
    # Git branch should be a string (may be 'unknown' if not in git repo)
    assert isinstance(data["git_branch"], str)
    
    # Git commit should be string (may be 'unknown')
    assert isinstance(data["git_commit"], str)
    
    # If not unknown, commit should be a short hash (7 chars typically)
    if data["git_commit"] != "unknown":
        assert len(data["git_commit"]) >= 7
    
    # Full commit should be longer than short commit (40 chars for SHA-1)
    if data["git_commit_full"] != "unknown":
        assert len(data["git_commit_full"]) >= 40

