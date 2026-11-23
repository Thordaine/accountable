import time
from datetime import UTC, date, datetime

from sqlalchemy import insert

from accountable.db import activities, contacts, deals, organizations
from conftest import add


def dashboard(client):
    return client.get("/api/dashboard").json()


def test_months_and_revenue(client):
    add(client, "deals", name="A", stage="Won", value=1000, close_date="2026-11-02")
    add(client, "deals", name="B", stage="Won", value=2000, close_date="2025-12-31")
    add(client, "deals", name="C", stage="Won", value=4000, close_date="2025-11-30")
    figures = dashboard(client)
    assert figures["months"][0] == "2025-12"
    assert figures["months"][11] == "2026-11"
    assert figures["revenue_won"][11] == 1000
    assert figures["revenue_won"][0] == 2000
    assert sum(figures["revenue_won"]) == 3000
    assert sum(figures["won"]) == 2


def test_win_rate(client):
    assert dashboard(client)["win_rate"] is None
    for name in "ABC":
        add(client, "deals", name=name, stage="Won", close_date="2026-10-01")
    add(client, "deals", name="D", stage="Lost", close_date="2026-10-01")
    assert dashboard(client)["win_rate"] == 75


def test_open_figures(client):
    add(client, "deals", name="A", stage="New", value=10000)
    add(client, "deals", name="B", stage="Negotiation", value=20000)
    add(client, "deals", name="C", stage="Won", value=50000)
    open_ = dashboard(client)["open"]
    assert (open_["value"], open_["expected"], open_["count"]) == (30000, 16000, 2)
    by_stage = {s["stage"]: s for s in open_["stages"]}
    assert list(by_stage) == ["New", "Qualified", "Proposal", "Negotiation"]
    assert by_stage["Negotiation"] == {
        "stage": "Negotiation",
        "count": 1,
        "value": 20000,
        "expected": 15000,
    }
    assert by_stage["Qualified"]["count"] == 0


def test_late(client):
    add(client, "deals", name="Yesterday", close_date="2026-11-14")
    add(client, "deals", name="Today", close_date="2026-11-15")
    add(client, "deals", name="Won late", stage="Won", close_date="2026-01-01")
    assert dashboard(client)["open"]["late"] == 1


def test_funnel(client):
    for stage, value in (("New", 100), ("Proposal", 200), ("Won", 300), ("Lost", 400)):
        add(
            client,
            "deals",
            name=stage,
            stage=stage,
            value=value,
            close_date="2026-11-01",
        )
    funnel = {f["stage"]: f["value"] for f in dashboard(client)["funnel"]}
    assert funnel == {
        "New": 600,
        "Qualified": 500,
        "Proposal": 500,
        "Negotiation": 300,
        "Won": 300,
    }


def test_follow_ups_window(client):
    ann = add(client, "contacts", name="Ann")
    deal = add(client, "deals", name="Renewal")

    def task(name, due, **extra):
        record = (
            {"deal_id": deal["id"]}
            if extra.pop("on_deal", False)
            else {"contact_id": ann["id"]}
        )
        return add(
            client,
            "activities",
            type="call",
            description=name,
            happened_at="2026-11-01T09:00Z",
            follow_up_date=due,
            **record,
            **extra,
        )

    task("in 7 days", "2026-11-22")
    task("today", "2026-11-15", on_deal=True)
    task("yesterday", "2026-11-14")
    task("in 8 days", "2026-11-23")
    done = task("done", "2026-11-16")
    client.patch(f"/api/activities/{done['id']}", json={"done": True})
    follow_ups = dashboard(client)["follow_ups"]
    assert [(f["description"], f["overdue"]) for f in follow_ups] == [
        ("yesterday", True),
        ("today", False),
        ("in 7 days", False),
    ]
    assert follow_ups[0]["record"] == {
        "kind": "contact",
        "id": ann["id"],
        "name": "Ann",
    }
    assert follow_ups[1]["record"] == {
        "kind": "deal",
        "id": deal["id"],
        "name": "Renewal",
    }


def test_recent_limit(client):
    ann = add(client, "contacts", name="Ann")
    for day in range(1, 12):
        add(
            client,
            "activities",
            type="note",
            contact_id=ann["id"],
            description=f"Day {day}",
            happened_at=f"2026-11-{day:02d}T09:00Z",
        )
    deal = add(client, "deals", name="Renewal")
    client.post(
        f"/api/deals/{deal['id']}/move", json={"stage": "Qualified", "index": 0}
    )
    recent = dashboard(client)["recent"]
    assert len(recent) == 10
    assert recent[0]["description"] == "Moved from New to Qualified"
    assert recent[0]["record"] == {"kind": "deal", "id": deal["id"], "name": "Renewal"}
    assert recent[1]["description"] == "Day 11"


def test_thousand_records(client):
    now = datetime(2026, 11, 1, 9, 0, tzinfo=UTC)
    by = {"created_by": "Test User", "updated_by": "Test User"}
    with client.app.state.engine.begin() as conn:
        conn.execute(
            insert(organizations), [{"name": f"Org {i}"} | by for i in range(1000)]
        )
        conn.execute(
            insert(contacts),
            [
                {"name": f"Person {i}", "status": "Lead", "organization_id": i + 1} | by
                for i in range(1000)
            ],
        )
        conn.execute(
            insert(deals),
            [
                {
                    "name": f"Deal {i}",
                    "stage": ["New", "Won", "Lost"][i % 3],
                    "value": 1000,
                    "probability": 10,
                    "close_date": date(2026, 10, 1),
                    "position": i,
                    "organization_id": i + 1,
                    "contact_id": i + 1,
                }
                | by
                for i in range(1000)
            ],
        )
        conn.execute(
            insert(activities),
            [
                {
                    "type": "note",
                    "description": "x",
                    "happened_at": now,
                    "contact_id": i + 1,
                    "follow_up_date": date(2026, 11, 16),
                }
                | by
                for i in range(1000)
            ],
        )
    for path in ("organizations", "contacts", "deals", "dashboard"):
        start = time.perf_counter()
        assert client.get(f"/api/{path}").status_code == 200
        assert time.perf_counter() - start < 0.5, path
