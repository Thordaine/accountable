"""The FastAPI app: lifespan, routers and health check."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI

from accountable import activities, contacts, dashboard, deals, organizations
from accountable.db import db_path, engine_for, get_today, metadata
from accountable.seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Open the database, creating and seeding it if it's new or ACCOUNTABLE_RESET=1."""
    path = db_path()
    is_new = not path.exists()
    engine = engine_for(path)
    metadata.create_all(engine)
    if is_new or os.environ.get("ACCOUNTABLE_RESET") == "1":
        with engine.begin() as conn:
            seed(conn, get_today())
    app.state.engine = engine
    yield
    engine.dispose()


def create_app() -> FastAPI:
    """Build the app with all its routes."""
    app = FastAPI(title="Accountable", lifespan=lifespan)

    for module in (organizations, contacts, deals, activities, dashboard):
        app.include_router(module.router)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
