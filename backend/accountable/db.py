"""Database location, engine, tables and the request dependencies."""

import os
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import Depends, Header, HTTPException, Request
from sqlalchemy import (
    Boolean,
    Column,
    Connection,
    Date,
    DateTime,
    Dialect,
    Engine,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    TypeDecorator,
    create_engine,
    event,
    insert,
    select,
)

ROOT = Path(__file__).resolve().parents[2]

metadata = MetaData()


class UtcDateTime(TypeDecorator):
    """A time stored in UTC without a zone, and given back aware, in UTC."""

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError(f"A time needs its zone: {value}")
        return value.astimezone(UTC).replace(tzinfo=None)

    def process_result_value(self, value: datetime | None, dialect: Dialect):
        return None if value is None else value.replace(tzinfo=UTC)


def utc_now() -> datetime:
    """The current time, in UTC."""
    return datetime.now(UTC)


def stamps() -> list[Column]:
    """When and by whom every row was added and last changed."""
    return [
        Column("created_at", UtcDateTime, nullable=False, default=utc_now),
        Column(
            "updated_at", UtcDateTime, nullable=False, default=utc_now, onupdate=utc_now
        ),
        Column("created_by", String, nullable=False),
        Column("updated_by", String, nullable=False),
    ]


organizations = Table(
    "organizations",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("website", String),
    Column("industry", String),
    Column("notes", Text),
    *stamps(),
)

contacts = Table(
    "contacts",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("email", String),
    Column("phone", String),
    Column("job_title", String),
    Column("organization_id", ForeignKey("organizations.id"), index=True),
    Column("status", String, nullable=False),
    *stamps(),
)

deals = Table(
    "deals",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("organization_id", ForeignKey("organizations.id"), index=True),
    Column("contact_id", ForeignKey("contacts.id"), index=True),
    Column("stage", String, nullable=False),
    Column("value", Integer, nullable=False),
    Column("probability", Integer, nullable=False),
    Column("close_date", Date, nullable=False),
    Column("position", Integer, nullable=False),
    *stamps(),
)

activities = Table(
    "activities",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("type", String, nullable=False),
    Column("contact_id", ForeignKey("contacts.id"), index=True),
    Column("deal_id", ForeignKey("deals.id"), index=True),
    Column("description", Text, nullable=False),
    Column("happened_at", UtcDateTime, nullable=False),
    Column("follow_up_date", Date),
    Column("done", Boolean, nullable=False, default=False),
    *stamps(),
)


def db_path() -> Path:
    """The database file: ACCOUNTABLE_DB if set, else data/accountable.db."""
    return Path(os.environ.get("ACCOUNTABLE_DB") or ROOT / "data" / "accountable.db")


def make_engine(database_url: str | None) -> Engine:
    """An engine for the Postgres database at database_url, or the local SQLite file when it's empty."""
    if not database_url:
        return engine_for(db_path())
    url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return create_engine(url, pool_pre_ping=True)


def engine_for(path: Path) -> Engine:
    """An engine for the SQLite file at path, creating its folder if needed."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(f"sqlite:///{path}")
    event.listen(engine, "connect", on_sqlite_connect)
    return engine


def on_sqlite_connect(dbapi, _record) -> None:
    """Enforce foreign keys, and fold case beyond ASCII as Postgres does."""
    dbapi.execute("PRAGMA foreign_keys = ON")
    dbapi.create_function("lower", 1, unicode_lower, deterministic=True)


def unicode_lower(text: str | None) -> str | None:
    """SQL's lower() with Python's Unicode case folding."""
    return None if text is None else text.lower()


def get_conn(request: Request):
    """Yield a connection inside a transaction that commits on success."""
    with request.app.state.engine.begin() as conn:
        yield conn


def today_in(zone: str | None, now: datetime) -> date:
    """The date at the instant now in the named IANA zone, or UTC; an unknown zone is a 400."""
    try:
        tz = ZoneInfo(zone) if zone else UTC
    except (ZoneInfoNotFoundError, ValueError):
        raise HTTPException(400, f"Unknown time zone: {zone}")
    return now.astimezone(tz).date()


def get_today(x_time_zone: Annotated[str | None, Header()] = None) -> date:
    """Today in the browser's time zone, from the X-Time-Zone header; tests override this."""
    return today_in(x_time_zone, utc_now())


def get_or_404(conn: Connection, table: Table, record_id: int) -> dict:
    """The record with this id as a dict, or a 404."""
    row = conn.execute(select(table).where(table.c.id == record_id)).mappings().first()
    if row is None:
        raise HTTPException(404, "Not found")
    return dict(row)


DbConn = Annotated[Connection, Depends(get_conn)]
Today = Annotated[date, Depends(get_today)]


def new_stamps(by: str) -> dict:
    """A new row's stamps: added and last changed by the named person, at one instant."""
    now = utc_now()
    return {"created_at": now, "updated_at": now, "created_by": by, "updated_by": by}


def insert_row(conn: Connection, table: Table, values: dict, by: str) -> int:
    """Insert one row added by the named person and return its new id."""
    stamped = values | new_stamps(by)
    return conn.execute(
        insert(table).values(**stamped).returning(table.c.id)
    ).scalar_one()
