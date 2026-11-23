"""The FastAPI app: lifespan, routers, health check and the built frontend."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI

from accountable import activities, contacts, dashboard, deals, organizations, search
from accountable.auth import add_sign_in, current_user
from accountable.db import get_today, make_engine
from accountable.migrate import upgrade
from accountable.seed import seed
from accountable.settings import Settings, load_settings
from accountable.web import FRONTEND_DIST, serve_frontend


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Bring the database up to date, seeding it when it was just created or a local run asks."""
    settings: Settings = app.state.settings
    engine = make_engine(settings.database_url)
    created = upgrade(engine)
    if created or (settings.is_local and settings.reset):
        with engine.begin() as conn:
            seed(conn, get_today())
    app.state.engine = engine
    yield
    engine.dispose()


def create_app(frontend: Path = FRONTEND_DIST) -> FastAPI:
    """Build the app with all its routes, the record routes for signed-in people only."""
    app = FastAPI(title="Accountable", lifespan=lifespan)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    add_sign_in(app, load_settings())
    for module in (organizations, contacts, deals, activities, dashboard, search):
        app.include_router(module.router, dependencies=[Depends(current_user)])
    serve_frontend(app, frontend)
    return app


app = create_app()
