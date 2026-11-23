import pytest

from accountable.settings import load_settings

POSTGRES = "postgresql://user:secret@db.example.com/postgres"


@pytest.mark.parametrize("database_url", [None, ""])
def test_no_database_url_is_local(monkeypatch, database_url):
    if database_url is not None:
        monkeypatch.setenv("DATABASE_URL", database_url)
    settings = load_settings()
    assert settings.is_local
    assert settings.database_url == ""


def test_database_url_is_shared_with_the_supabase_settings(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", POSTGRES)
    monkeypatch.setenv("SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc")
    settings = load_settings()
    assert not settings.is_local
    assert settings.database_url == POSTGRES
    assert settings.supabase_url == "https://project.supabase.co"
    assert settings.supabase_publishable_key == "sb_publishable_abc"
    assert (
        settings.jwks_url == "https://project.supabase.co/auth/v1/.well-known/jwks.json"
    )


def test_reset_only_when_one(monkeypatch):
    assert not load_settings().reset
    monkeypatch.setenv("ACCOUNTABLE_RESET", "1")
    assert load_settings().reset


def test_render_without_database_url_refuses_to_start(monkeypatch):
    monkeypatch.setenv("RENDER", "true")
    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        load_settings()


def test_render_with_database_url_starts(monkeypatch):
    monkeypatch.setenv("RENDER", "true")
    monkeypatch.setenv("DATABASE_URL", POSTGRES)
    assert not load_settings().is_local
