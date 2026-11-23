import re
import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient

from accountable.auth import LOCAL_TOKEN, supabase_user
from accountable.main import create_app

KEY = ec.generate_private_key(ec.SECP256R1())
OTHER_KEY = ec.generate_private_key(ec.SECP256R1())
OPEN_ROUTES = {"/api/health", "/api/config", "/api/local-sign-in"}
SUPABASE_URL = "https://project.supabase.co"


def token(key=KEY, **claims) -> str:
    """A Supabase-style access token for Sam Lee, signed with key."""
    payload = {
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        "email": "sam@example.com",
        "user_metadata": {"display_name": "Sam Lee"},
    } | claims
    return jwt.encode(payload, key, algorithm="ES256")


def find_key(_token: str):
    return KEY.public_key()


@pytest.fixture
def shared_client(monkeypatch):
    """A client for the shared app, with the test's key as the project's; no database."""
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:secret@db.example.com/db")
    monkeypatch.setenv("SUPABASE_URL", SUPABASE_URL)
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_abc")
    app = create_app()
    app.state.find_signing_key = find_key
    return TestClient(app)


def guarded_calls(app):
    """Every method and path of the app's API, except the open routes."""
    for path, operations in app.openapi()["paths"].items():
        if path not in OPEN_ROUTES:
            for method in operations:
                yield method, re.sub(r"\{\w+\}", "1", path)


@pytest.mark.parametrize("headers", [{}, {"Authorization": "Bearer wrong"}])
def test_every_api_route_needs_a_token(signed_out_client, headers):
    calls = list(guarded_calls(signed_out_client.app))
    assert len(calls) > 10
    for method, path in calls:
        response = signed_out_client.request(method, path, headers=headers)
        assert response.status_code == 401, (method, path)


def test_open_routes_need_no_token(signed_out_client):
    assert signed_out_client.get("/api/health").status_code == 200
    assert signed_out_client.get("/api/config").status_code == 200


def test_local_sign_in_gives_test_user(signed_out_client):
    response = signed_out_client.post(
        "/api/local-sign-in", json={"email": "test@example.com", "password": "test"}
    )
    assert response.json() == {"token": LOCAL_TOKEN}
    me = signed_out_client.get(
        "/api/me", headers={"Authorization": f"Bearer {LOCAL_TOKEN}"}
    )
    assert me.json() == {"name": "Test User", "email": "test@example.com"}


def test_local_sign_in_with_wrong_password_is_401(signed_out_client):
    response = signed_out_client.post(
        "/api/local-sign-in", json={"email": "test@example.com", "password": "nope"}
    )
    assert response.status_code == 401


def test_client_is_signed_in_as_test_user(client):
    assert client.get("/api/me").json()["name"] == "Test User"


def test_supabase_token_gives_display_name_and_email():
    user = supabase_user(token(), find_key)
    assert (user.name, user.email) == ("Sam Lee", "sam@example.com")


def test_supabase_token_without_display_name_goes_by_email():
    user = supabase_user(token(user_metadata={}), find_key)
    assert user.name == "sam@example.com"


@pytest.mark.parametrize(
    "bad_token",
    [
        token(exp=int(time.time()) - 60),
        token(aud="anon"),
        token(key=OTHER_KEY),
    ],
    ids=["expired", "wrong audience", "another key"],
)
def test_bad_supabase_token_is_401(shared_client, bad_token):
    response = shared_client.get(
        "/api/me", headers={"Authorization": f"Bearer {bad_token}"}
    )
    assert response.status_code == 401


def test_shared_app_takes_the_user_from_the_token(shared_client):
    response = shared_client.get(
        "/api/me", headers={"Authorization": f"Bearer {token()}"}
    )
    assert response.json() == {"name": "Sam Lee", "email": "sam@example.com"}


def test_shared_app_refuses_the_local_token(shared_client):
    response = shared_client.get(
        "/api/me", headers={"Authorization": f"Bearer {LOCAL_TOKEN}"}
    )
    assert response.status_code == 401


def test_shared_app_has_no_local_sign_in(shared_client):
    response = shared_client.post(
        "/api/local-sign-in", json={"email": "test@example.com", "password": "test"}
    )
    assert response.status_code == 404


def test_a_user_in_the_body_is_ignored(client):
    created = client.post(
        "/api/organizations",
        json={"name": "Acme", "created_by": "Mallory", "updated_by": "Mallory"},
    ).json()
    assert (created["created_by"], created["updated_by"]) == ("Test User", "Test User")


def test_config_in_local_mode(signed_out_client):
    assert signed_out_client.get("/api/config").json() == {"mode": "local"}


def test_config_in_supabase_mode_gives_only_the_url_and_publishable_key(shared_client):
    assert shared_client.get("/api/config").json() == {
        "mode": "supabase",
        "supabase_url": SUPABASE_URL,
        "supabase_publishable_key": "sb_publishable_abc",
    }
