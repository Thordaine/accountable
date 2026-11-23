"""Requests from someone other than the signed-in Test User."""

from accountable.auth import User, current_user


def sign_in_as(client, name: str) -> None:
    """Make the client's next requests come from the named person."""
    user = User(name=name, email="someone@example.com")
    client.app.dependency_overrides[current_user] = lambda: user
