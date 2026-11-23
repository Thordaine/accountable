from datetime import UTC, datetime
from pathlib import Path

import pytest
from alembic.autogenerate import compare_metadata
from alembic.runtime.migration import MigrationContext
from sqlalchemy import select, text

from accountable.db import activities, contacts, engine_for, metadata, organizations
from accountable.migrate import upgrade
from computer_zone import computer_zone

MVP_SCHEMA = (Path(__file__).parent / "mvp_schema.sql").read_text()


@pytest.fixture
def engine(tmp_path):
    return engine_for(tmp_path / "migrate.db")


def test_empty_database_is_created(engine):
    assert upgrade(engine) is True
    assert upgrade(engine) is False


def test_migrated_schema_matches_metadata(engine):
    upgrade(engine)
    with engine.connect() as conn:
        assert compare_metadata(MigrationContext.configure(conn), metadata) == []


def mvp_file(engine) -> None:
    """A local file from before this change: an organization, a contact there and a note on them."""
    with engine.begin() as conn:
        conn.connection.executescript(MVP_SCHEMA)
        conn.execute(
            text(
                "INSERT INTO organizations (name, created_at, updated_at)"
                " VALUES ('Halden Freight', '2026-11-10 09:00:00', '2026-11-10 09:30:00')"
            )
        )
        conn.execute(
            text(
                "INSERT INTO contacts"
                " (name, organization_id, status, created_at, updated_at)"
                " VALUES ('Lena Brandt', 1, 'Lead', '2026-11-10 09:00:00', '2026-11-10 09:00:00')"
            )
        )
        conn.execute(
            text(
                "INSERT INTO activities"
                " (type, contact_id, description, happened_at, done, created_at, updated_at)"
                " VALUES ('note', 1, 'Called', '2026-11-10 08:00:00', 0,"
                " '2026-11-10 08:05:00', '2026-11-10 08:05:00')"
            )
        )


def test_mvp_file_is_upgraded(engine):
    mvp_file(engine)
    with computer_zone("Pacific/Kiritimati"):
        assert upgrade(engine) is False
    with engine.connect() as conn:
        org = conn.execute(select(organizations)).mappings().one()
        entry = conn.execute(select(activities)).mappings().one()
        contact = conn.execute(select(contacts)).mappings().one()
    assert org["name"] == "Halden Freight"
    assert (org["created_by"], org["updated_by"]) == ("Sample data", "Sample data")
    assert org["created_at"] == datetime(2026, 11, 9, 19, 0, tzinfo=UTC)
    assert org["updated_at"] == datetime(2026, 11, 9, 19, 30, tzinfo=UTC)
    assert (contact["organization_id"], contact["updated_by"]) == (1, "Sample data")
    assert (entry["contact_id"], entry["created_by"]) == (1, "Sample data")
    assert entry["happened_at"] == datetime(2026, 11, 9, 18, 0, tzinfo=UTC)
    assert entry["created_at"] == datetime(2026, 11, 9, 18, 5, tzinfo=UTC)
