"""The settings from the environment, and which sign-in they choose."""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """What the app runs against: Supabase when database_url is set, else the local file."""

    database_url: str
    supabase_url: str
    supabase_publishable_key: str
    reset: bool

    @property
    def is_local(self) -> bool:
        """True for the local SQLite file and the test sign-in."""
        return not self.database_url

    @property
    def jwks_url(self) -> str:
        """Where the Supabase project publishes the public keys its tokens are signed with."""
        return f"{self.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"


def load_settings() -> Settings:
    """Read the settings; on Render, refuse to start without DATABASE_URL so the test sign-in never runs there."""
    database_url = os.environ.get("DATABASE_URL", "")
    if os.environ.get("RENDER") and not database_url:
        raise RuntimeError("DATABASE_URL must be set on Render")
    return Settings(
        database_url=database_url,
        supabase_url=os.environ.get("SUPABASE_URL", ""),
        supabase_publishable_key=os.environ.get("SUPABASE_PUBLISHABLE_KEY", ""),
        reset=os.environ.get("ACCOUNTABLE_RESET") == "1",
    )
