"""Brings a database's schema up to date with the Alembic migrations."""

from alembic import command
from alembic.config import Config
from sqlalchemy import Connection, Engine, inspect

from accountable.db import ROOT

FIRST_REVISION = "0001"


def upgrade(engine: Engine) -> bool:
    """Migrate the database to the latest revision; true when it had no tables, so it was just created."""
    with engine.connect() as conn:
        set_sqlite_foreign_keys(conn, "OFF")
        tables = inspect(conn).get_table_names()
        config = alembic_config(conn)
        if tables and "alembic_version" not in tables:
            command.stamp(config, FIRST_REVISION)
        command.upgrade(config, "head")
        conn.commit()
        set_sqlite_foreign_keys(conn, "ON")
    return not tables


def set_sqlite_foreign_keys(conn: Connection, state: str) -> None:
    """Turn SQLite's foreign key checks ON or OFF.

    A batch migration rebuilds a table and drops the old one, which fails with
    the checks on while other tables point at it. SQLite ignores this pragma
    inside a transaction, so it's committed on its own.
    """
    if conn.dialect.name == "sqlite":
        conn.exec_driver_sql(f"PRAGMA foreign_keys = {state}")
        conn.commit()


def alembic_config(conn: Connection) -> Config:
    """The settings in pyproject.toml, with the connection for env.py to use."""
    config = Config(toml_file=ROOT / "pyproject.toml")
    config.attributes["connection"] = conn
    return config
