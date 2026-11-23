from datetime import UTC, date, datetime, time, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from accountable.auth import LOCAL_TOKEN
from accountable.db import (
    activities,
    contacts,
    deals,
    engine_for,
    metadata,
    organizations,
)
from accountable.main import create_app
from accountable.schemas import OPEN_STAGES
from accountable.seed import main, seed
from computer_zone import computer_zone

TODAY = date(2026, 11, 15)
SIGNED_IN = {"Authorization": f"Bearer {LOCAL_TOKEN}"}
FIRST_DAY = date(2025, 12, 1)


@pytest.fixture
def conn(tmp_path):
    engine = engine_for(tmp_path / "seed.db")
    metadata.create_all(engine)
    with engine.begin() as conn:
        seed(conn, TODAY)
        yield conn


def count(conn, table, *where):
    return conn.execute(select(func.count()).select_from(table).where(*where)).scalar()


def all_deals(conn):
    return conn.execute(select(deals)).mappings().all()


def test_counts(conn):
    assert count(conn, organizations) == 15
    assert count(conn, contacts) == 40
    assert count(conn, deals) == 50
    assert count(conn, activities, activities.c.type != "auto") == 80
    assert count(conn, activities, activities.c.type == "auto") > 0


def test_variety(conn):
    assert set(conn.execute(select(contacts.c.status)).scalars()) == {
        "Lead",
        "Qualified",
        "Customer",
    }
    assert len(set(conn.execute(select(organizations.c.industry)).scalars())) >= 5


def test_stages(conn):
    stages = [d["stage"] for d in all_deals(conn)]
    assert [stages.count(s) for s in OPEN_STAGES] == [4, 4, 4, 4]
    assert stages.count("Won") == 25
    assert stages.count("Lost") == 9


def test_closed_dates(conn):
    closed = [d for d in all_deals(conn) if d["stage"] in ("Won", "Lost")]
    assert all(FIRST_DAY <= d["close_date"] <= TODAY for d in closed)
    won_months = [
        d["close_date"].strftime("%Y-%m") for d in closed if d["stage"] == "Won"
    ]
    assert all(0 <= won_months.count(m) <= 4 for m in set(won_months))


def test_open_dates(conn):
    open_deals = [d for d in all_deals(conn) if d["stage"] in OPEN_STAGES]
    late = [d for d in open_deals if d["close_date"] < TODAY]
    assert len(late) in (3, 4)
    upcoming = [d for d in open_deals if d["close_date"] >= TODAY]
    assert all(d["close_date"] <= TODAY + timedelta(days=183) for d in upcoming)


def test_follow_ups(conn):
    pending = activities.c.done.is_(False)
    overdue = count(conn, activities, pending, activities.c.follow_up_date < TODAY)
    soon = count(
        conn,
        activities,
        pending,
        activities.c.follow_up_date.between(TODAY, TODAY + timedelta(days=7)),
    )
    assert overdue >= 3
    assert soon >= 3


def test_seed_replaces(conn):
    seed(conn, TODAY)
    assert count(conn, organizations) == 15
    assert count(conn, deals) == 50
    assert count(conn, activities, activities.c.type != "auto") == 80


def test_everything_is_by_sample_data(conn):
    for table in (organizations, contacts, deals, activities):
        rows = conn.execute(select(table.c.created_by, table.c.updated_by)).all()
        assert set(rows) == {("Sample data", "Sample data")}, table.name


def test_times_are_working_hours_in_the_computers_zone(tmp_path):
    engine = engine_for(tmp_path / "zone.db")
    metadata.create_all(engine)
    with computer_zone("Pacific/Kiritimati"), engine.begin() as conn:
        seed(conn, TODAY, time(23, 0))
        logged = activities.c.type != "auto"
        times = conn.execute(select(activities.c.happened_at).where(logged)).scalars()
        hours = {t.astimezone().hour for t in times}
    assert hours <= set(range(8, 18))


def test_new_rows_are_created_and_updated_at_once(conn):
    for table in (organizations, deals, activities):
        rows = conn.execute(select(table.c.created_at, table.c.updated_at)).all()
        assert all(created == updated for created, updated in rows), table.name


def test_new_database_is_seeded_once(tmp_path, monkeypatch):
    monkeypatch.setenv("ACCOUNTABLE_DB", str(tmp_path / "new" / "fresh.db"))
    monkeypatch.delenv("ACCOUNTABLE_RESET", raising=False)
    with TestClient(create_app(), headers=SIGNED_IN) as client:
        assert len(client.get("/api/deals").json()) == 50
        client.post("/api/organizations", json={"name": "Added after seeding"})
    with TestClient(create_app(), headers=SIGNED_IN) as client:
        assert len(client.get("/api/organizations").json()) == 16


def test_seed_command_opens_the_local_file(tmp_path, monkeypatch):
    path = tmp_path / "local.db"
    monkeypatch.setenv("ACCOUNTABLE_DB", str(path))
    monkeypatch.setenv(
        "DATABASE_URL", "postgresql://user:secret@db.example.com/postgres"
    )
    main()
    with engine_for(path).connect() as conn:
        assert count(conn, organizations) == 15


def test_nothing_happens_after_seeding(conn):
    for offset in range(60):
        day = date(2026, 11, 1) + timedelta(days=offset)
        moment = datetime.combine(day, time(8, 0)).astimezone(UTC)
        seed(conn, day, time(8, 0))
        latest = conn.execute(select(func.max(activities.c.happened_at))).scalar()
        assert latest <= moment, day


def test_seeded_times_are_whole_minutes(conn):
    """Seeded entries sort below a live entry logged in the same minute."""
    seed(conn, date(2026, 11, 18), time(8, 0, 44, 347367))
    times = conn.execute(select(activities.c.happened_at)).scalars()
    assert all(t.second == 0 and t.microsecond == 0 for t in times)
