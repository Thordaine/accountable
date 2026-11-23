from datetime import UTC, date, datetime, timedelta, timezone

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import Column, Integer, MetaData, Table, func, insert, select
from sqlalchemy.exc import StatementError

from accountable.db import (
    Today,
    UtcDateTime,
    get_or_404,
    insert_row,
    make_engine,
    metadata,
    organizations,
    today_in,
)

LATE_EVENING = datetime(2026, 11, 15, 23, 30, tzinfo=UTC)


@pytest.fixture
def engine(tmp_path, monkeypatch):
    monkeypatch.setenv("ACCOUNTABLE_DB", str(tmp_path / "db.sqlite"))
    return make_engine(None)


@pytest.fixture
def times(engine):
    """A table with one UtcDateTime column."""
    table = Table(
        "times",
        MetaData(),
        Column("id", Integer, primary_key=True),
        Column("at", UtcDateTime),
    )
    table.metadata.create_all(engine)
    return table


def test_postgres_url_uses_psycopg():
    engine = make_engine("postgresql://user:secret@db.example.com:5432/postgres")
    assert engine.url.drivername == "postgresql+psycopg"
    assert engine.pool._pre_ping


def test_no_url_is_the_local_file(engine, tmp_path):
    assert engine.url.database == str(tmp_path / "db.sqlite")


def test_sqlite_lower_folds_unicode(engine):
    with engine.connect() as conn:
        assert conn.execute(select(func.lower("ÉMILE"))).scalar() == "émile"


def test_time_round_trips_as_utc(engine, times):
    kiritimati = datetime(2026, 11, 16, 9, 15, tzinfo=timezone(timedelta(hours=14)))
    with engine.begin() as conn:
        conn.execute(insert(times).values(at=kiritimati))
        saved = conn.execute(select(times.c.at)).scalar_one()
    assert saved == kiritimati
    assert saved.tzinfo is UTC


def test_naive_time_is_refused(engine, times):
    with engine.begin() as conn, pytest.raises(StatementError):
        conn.execute(insert(times).values(at=datetime(2026, 11, 16, 9, 15)))


@pytest.mark.parametrize(
    ("zone", "day"),
    [
        ("Pacific/Kiritimati", date(2026, 11, 16)),
        ("America/Los_Angeles", date(2026, 11, 15)),
        (None, date(2026, 11, 15)),
    ],
)
def test_today_in_zone(zone, day):
    assert today_in(zone, LATE_EVENING) == day


def test_unknown_zone_is_a_400():
    with pytest.raises(HTTPException) as error:
        today_in("Nowhere/Atlantis", LATE_EVENING)
    assert error.value.status_code == 400


@pytest.fixture
def today_client():
    app = FastAPI()

    @app.get("/today")
    def read_today(today: Today):
        return {"today": today.isoformat()}

    return TestClient(app)


def test_today_reads_the_header(today_client):
    response = today_client.get("/today", headers={"X-Time-Zone": "Pacific/Kiritimati"})
    assert response.json() == {
        "today": today_in("Pacific/Kiritimati", datetime.now(UTC)).isoformat()
    }


def test_today_without_header_is_utc(today_client):
    assert today_client.get("/today").json() == {
        "today": datetime.now(UTC).date().isoformat()
    }


def test_today_with_unknown_zone_is_a_400(today_client):
    assert (
        today_client.get(
            "/today", headers={"X-Time-Zone": "Nowhere/Atlantis"}
        ).status_code
        == 400
    )


def test_new_row_is_created_and_updated_at_once(engine):
    metadata.create_all(engine)
    with engine.begin() as conn:
        row_id = insert_row(
            conn, organizations, {"name": "Halden Freight"}, by="Sam Lee"
        )
        row = get_or_404(conn, organizations, row_id)
    assert row["created_at"] == row["updated_at"]
    assert (row["created_by"], row["updated_by"]) == ("Sam Lee", "Sam Lee")
