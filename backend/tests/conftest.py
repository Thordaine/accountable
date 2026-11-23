"""Shared fixtures: a migrated temporary database, a fixed today and signed-in and signed-out clients."""

import shutil
from datetime import date

import pytest
from fastapi.testclient import TestClient

from accountable.auth import LOCAL_TOKEN
from accountable.db import engine_for, get_today
from accountable.main import create_app
from accountable.migrate import upgrade

TODAY = date(2026, 11, 15)
SIGNED_IN = {"Authorization": f"Bearer {LOCAL_TOKEN}"}
SHARED_SETTINGS = (
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "ACCOUNTABLE_RESET",
    "RENDER",
)


@pytest.fixture(autouse=True)
def local_settings(monkeypatch):
    """Run every test locally, even when the shell exports the shared app's settings."""
    for name in SHARED_SETTINGS:
        monkeypatch.delenv(name, raising=False)


@pytest.fixture(scope="session")
def template_db(tmp_path_factory):
    """One migrated, empty database file, migrated once per test session."""
    path = tmp_path_factory.mktemp("template") / "template.db"
    engine = engine_for(path)
    upgrade(engine)
    engine.dispose()
    return path


@pytest.fixture
def app(tmp_path, monkeypatch, template_db):
    """A fresh app on its own copy of the empty template database, with a fixed today."""
    path = tmp_path / "test.db"
    shutil.copy(template_db, path)
    monkeypatch.setenv("ACCOUNTABLE_DB", str(path))
    app = create_app()
    app.dependency_overrides[get_today] = lambda: TODAY
    return app


@pytest.fixture
def client(app):
    """A client signed in as Test User."""
    with TestClient(app, headers=SIGNED_IN) as c:
        yield c


@pytest.fixture
def signed_out_client(app):
    """A client with no token."""
    with TestClient(app) as c:
        yield c


def add(client, kind: str, **fields) -> dict:
    """Create a record through the API and return it."""
    response = client.post(f"/api/{kind}", json=fields)
    assert response.status_code == 201, response.text
    return response.json()
