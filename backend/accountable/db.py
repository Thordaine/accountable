"""Database location, engine, tables and the request dependencies."""

import os
from datetime import date, datetime
from pathlib import Path

from fastapi import HTTPException, Request
from sqlalchemy import (
    Boolean, Column, Connection, Date, DateTime, Engine, ForeignKey, Integer, MetaData, String,
    Table, Text, create_engine, event, select,
)

ROOT = Path(__file__).resolve().parents[2]

metadata = MetaData()


def timestamps() -> list[Column]:
    """The created_at and updated_at columns every table has."""
    return [
        Column("created_at", DateTime, nullable=False, default=datetime.now),
        Column("updated_at", DateTime, nullable=False, default=datetime.now, onupdate=datetime.now),
    ]


organizations = Table(
    "organizations", metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("website", String),
    Column("industry", String),
    Column("notes", Text),
    *timestamps(),
)

contacts = Table(
    "contacts", metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("email", String),
    Column("phone", String),
    Column("job_title", String),
    Column("organization_id", ForeignKey("organizations.id"), index=True),
    Column("status", String, nullable=False),
    *timestamps(),
)

deals = Table(
    "deals", metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("organization_id", ForeignKey("organizations.id"), index=True),
    Column("contact_id", ForeignKey("contacts.id"), index=True),
    Column("stage", String, nullable=False),
    Column("value", Integer, nullable=False),
    Column("probability", Integer, nullable=False),
    Column("close_date", Date, nullable=False),
    Column("position", Integer, nullable=False),
    *timestamps(),
)

activities = Table(
    "activities", metadata,
    Column("id", Integer, primary_key=True),
    Column("type", String, nullable=False),
    Column("contact_id", ForeignKey("contacts.id"), index=True),
    Column("deal_id", ForeignKey("deals.id"), index=True),
    Column("description", Text, nullable=False),
    Column("happened_at", DateTime, nullable=False),
    Column("follow_up_date", Date),
    Column("done", Boolean, nullable=False, default=False),
    *timestamps(),
)


def db_path() -> Path:
    """The database file: ACCOUNTABLE_DB if set, else data/accountable.db."""
    return Path(os.environ.get("ACCOUNTABLE_DB") or ROOT / "data" / "accountable.db")


def engine_for(path: Path) -> Engine:
    """An engine for the SQLite file at path, creating its folder if needed."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(f"sqlite:///{path}")
    event.listen(engine, "connect", lambda dbapi, _: dbapi.execute("PRAGMA foreign_keys = ON"))
    return engine


def get_conn(request: Request):
    """Yield a connection inside a transaction that commits on success."""
    with request.app.state.engine.begin() as conn:
        yield conn


def get_today() -> date:
    """Today's date; tests override this dependency."""
    return date.today()


def get_or_404(conn: Connection, table: Table, record_id: int) -> dict:
    """The record with this id as a dict, or a 404."""
    row = conn.execute(select(table).where(table.c.id == record_id)).mappings().first()
    if row is None:
        raise HTTPException(404, "Not found")
    return dict(row)
