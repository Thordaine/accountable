"""Shared fixtures: a temporary database, a fixed today and a test client."""

from datetime import date

import pytest
from fastapi.testclient import TestClient

from accountable.db import engine_for, get_today, metadata
from accountable.main import create_app

TODAY = date(2026, 11, 15)


@pytest.fixture
def client(tmp_path, monkeypatch):
    """A client for a fresh app on an empty temporary database."""
    path = tmp_path / "test.db"
    metadata.create_all(engine_for(path))
    monkeypatch.setenv("ACCOUNTABLE_DB", str(path))
    monkeypatch.delenv("ACCOUNTABLE_RESET", raising=False)
    app = create_app()
    app.dependency_overrides[get_today] = lambda: TODAY
    with TestClient(app) as c:
        yield c


def add(client, kind: str, **fields) -> dict:
    """Create a record through the API and return it."""
    response = client.post(f"/api/{kind}", json=fields)
    assert response.status_code == 201, response.text
    return response.json()
