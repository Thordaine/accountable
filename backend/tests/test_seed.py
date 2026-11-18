from datetime import date, timedelta

import pytest
from sqlalchemy import func, select

from accountable.db import (
    activities,
    contacts,
    deals,
    engine_for,
    metadata,
    organizations,
)
from accountable.schemas import OPEN_STAGES
from accountable.seed import seed

TODAY = date(2026, 11, 15)
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


def test_new_database_is_seeded(tmp_path, monkeypatch):
    from fastapi.testclient import TestClient

    from accountable.main import create_app

    monkeypatch.setenv("ACCOUNTABLE_DB", str(tmp_path / "new" / "fresh.db"))
    with TestClient(create_app()) as client:
        assert len(client.get("/api/deals").json()) == 50


def test_nothing_happens_after_seeding(conn):
    from datetime import datetime, time

    for offset in range(60):
        day = date(2026, 11, 1) + timedelta(days=offset)
        moment = datetime.combine(day, time(8, 0))
        seed(conn, day, time(8, 0))
        latest = conn.execute(select(func.max(activities.c.happened_at))).scalar()
        assert latest <= moment, day


def test_seeded_times_are_whole_minutes(conn):
    """Seeded entries sort below a live entry logged in the same minute."""
    from datetime import time

    seed(conn, date(2026, 11, 18), time(8, 0, 44, 347367))
    times = conn.execute(select(activities.c.happened_at)).scalars()
    assert all(t.second == 0 and t.microsecond == 0 for t in times)
