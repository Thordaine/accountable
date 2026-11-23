"""Serves the built frontend, with index.html for every page address."""

from pathlib import Path

from fastapi import FastAPI
from starlette.exceptions import HTTPException
from starlette.staticfiles import StaticFiles
from starlette.types import Scope

from accountable.db import ROOT

FRONTEND_DIST = ROOT / "frontend" / "dist"


class SinglePageApp(StaticFiles):
    """Static files, falling back to index.html so the browser's router shows the page."""

    async def get_response(self, path: str, scope: Scope):
        if path.split("/")[0] == "api":
            raise HTTPException(404)
        try:
            return await super().get_response(path, scope)
        except HTTPException as error:
            if error.status_code != 404:
                raise
            return await super().get_response("index.html", scope)


def serve_frontend(app: FastAPI, dist: Path) -> None:
    """Serve dist at the root when it's been built; added last, so the API routes come first."""
    if dist.is_dir():
        app.mount("/", SinglePageApp(directory=dist), name="frontend")
