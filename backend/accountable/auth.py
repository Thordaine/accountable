"""Who is signed in: Supabase tokens on the shared app, the test sign-in on local runs."""

from collections.abc import Callable
from typing import Annotated, Any

import jwt
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from accountable.settings import Settings

LOCAL_TOKEN = "local-test-user"
LOCAL_PASSWORD = "test"
ALGORITHMS = ["ES256", "RS256"]

KeyFinder = Callable[[str], Any]


class User(BaseModel):
    """The signed-in person."""

    name: str
    email: str


TEST_USER = User(name="Test User", email="test@example.com")


class LocalSignIn(BaseModel):
    """The test sign-in's email and password."""

    email: str
    password: str


def signed_out() -> HTTPException:
    """The 401 for a missing, wrong or expired token."""
    return HTTPException(401, "Not signed in", headers={"WWW-Authenticate": "Bearer"})


def supabase_user(token: str, find_key: KeyFinder) -> User:
    """The person a Supabase access token names, checked against the project's public key."""
    try:
        claims = jwt.decode(
            token, find_key(token), algorithms=ALGORITHMS, audience="authenticated"
        )
    except jwt.PyJWTError:
        raise signed_out()
    name = claims.get("user_metadata", {}).get("display_name")
    return User(name=name or claims["email"], email=claims["email"])


def local_user(token: str) -> User:
    """Test User, for the test sign-in's token."""
    if token != LOCAL_TOKEN:
        raise signed_out()
    return TEST_USER


bearer = HTTPBearer(auto_error=False)


def current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> User:
    """The person whose token the request carries; a 401 without a valid one."""
    if credentials is None:
        raise signed_out()
    token = credentials.credentials
    if request.app.state.settings.is_local:
        return local_user(token)
    return supabase_user(token, request.app.state.find_signing_key)


CurrentUser = Annotated[User, Depends(current_user)]

router = APIRouter(prefix="/api", tags=["auth"])
local_router = APIRouter(prefix="/api", tags=["auth"])


@router.get("/config")
def config(request: Request) -> dict:
    """Which sign-in the browser should use."""
    settings: Settings = request.app.state.settings
    if settings.is_local:
        return {"mode": "local"}
    return {
        "mode": "supabase",
        "supabase_url": settings.supabase_url,
        "supabase_publishable_key": settings.supabase_publishable_key,
    }


@router.get("/me")
def me(user: CurrentUser) -> User:
    """The signed-in person."""
    return user


@local_router.post("/local-sign-in")
def local_sign_in(body: LocalSignIn) -> dict:
    """The test sign-in's token, for Test User's email and password."""
    if (body.email, body.password) != (TEST_USER.email, LOCAL_PASSWORD):
        raise HTTPException(401, "Wrong email or password")
    return {"token": LOCAL_TOKEN}


def add_sign_in(app: FastAPI, settings: Settings) -> None:
    """The sign-in routes, and on the shared app the Supabase project's key lookup."""
    app.state.settings = settings
    app.include_router(router)
    if settings.is_local:
        app.include_router(local_router)
    else:
        jwks = jwt.PyJWKClient(settings.jwks_url)
        app.state.find_signing_key = jwks.get_signing_key_from_jwt
