from datetime import UTC, datetime

from accountable.db import get_today
from conftest import add
from other_user import sign_in_as


def move(client, deal, stage, index=0):
    response = client.post(
        f"/api/deals/{deal['id']}/move", json={"stage": stage, "index": index}
    )
    assert response.status_code == 200, response.text
    return response.json()


def deal_body(deal, **changes):
    keys = (
        "name",
        "organization_id",
        "contact_id",
        "stage",
        "value",
        "probability",
        "close_date",
    )
    return {k: deal[k] for k in keys} | changes


def test_move_sets_usual_probability(client):
    deal = add(client, "deals", name="A", stage="Proposal", probability=60)
    assert move(client, deal, "Negotiation")["probability"] == 75


def test_move_writes_entry(client):
    deal = add(client, "deals", name="A", stage="Proposal")
    move(client, deal, "Negotiation")
    newest = client.get(f"/api/deals/{deal['id']}").json()["timeline"][0]
    assert newest["type"] == "auto"
    assert newest["description"] == "Moved from Proposal to Negotiation"


def test_won_sets_close_date_and_customer(client):
    ann = add(client, "contacts", name="Ann")
    deal = add(
        client,
        "deals",
        name="A",
        stage="Negotiation",
        contact_id=ann["id"],
        close_date="2027-01-31",
    )
    won = move(client, deal, "Won")
    assert won["close_date"] == "2026-11-15"
    assert won["probability"] == 100
    contact = client.get(f"/api/contacts/{ann['id']}").json()
    assert contact["status"] == "Customer"
    entries = [
        (a["type"], a["description"])
        for a in contact["timeline"]
        if a["contact_id"] == ann["id"]
    ]
    assert entries == [("auto", "Status changed from Lead to Customer")]


def test_won_customer_unchanged(client):
    ann = add(client, "contacts", name="Ann", status="Customer")
    deal = add(client, "deals", name="A", contact_id=ann["id"])
    move(client, deal, "Won")
    timeline = client.get(f"/api/contacts/{ann['id']}").json()["timeline"]
    assert [a for a in timeline if a["contact_id"] == ann["id"]] == []


def test_won_without_contact(client):
    deal = add(client, "deals", name="A")
    assert move(client, deal, "Won")["stage"] == "Won"


def test_reopen(client):
    deal = add(client, "deals", name="A")
    won = move(client, deal, "Won")
    client.put(f"/api/deals/{deal['id']}", json=deal_body(won, close_date="2026-11-01"))
    reopened = move(client, deal, "Qualified")
    assert reopened["probability"] == 25
    assert reopened["close_date"] == "2026-11-01"
    newest = client.get(f"/api/deals/{deal['id']}").json()["timeline"][0]
    assert newest["description"] == "Moved from Won to Qualified"


def test_same_stage_is_not_a_change(client):
    deal = add(
        client,
        "deals",
        name="A",
        stage="Proposal",
        probability=60,
        close_date="2027-02-01",
    )
    add(client, "deals", name="B", stage="Proposal")
    moved = move(client, deal, "Proposal", 1)
    assert moved["probability"] == 60
    assert moved["close_date"] == "2027-02-01"
    assert client.get(f"/api/deals/{deal['id']}").json()["timeline"] == []


def test_hand_probability_kept(client):
    deal = add(client, "deals", name="A", stage="Proposal")
    response = client.put(
        f"/api/deals/{deal['id']}", json=deal_body(deal, probability=60)
    )
    assert response.json()["probability"] == 60


def test_won_close_date_editable(client):
    deal = add(client, "deals", name="A")
    won = move(client, deal, "Won")
    response = client.put(
        f"/api/deals/{deal['id']}", json=deal_body(won, close_date="2026-11-10")
    )
    assert response.json()["close_date"] == "2026-11-10"


def test_put_changing_stage_applies_rules(client):
    other = add(client, "deals", name="Other", stage="Negotiation")
    deal = add(client, "deals", name="A", stage="Proposal", probability=60)
    response = client.put(
        f"/api/deals/{deal['id']}", json=deal_body(deal, stage="Negotiation")
    )
    assert response.json()["probability"] == 75
    negotiation = [
        d["name"]
        for d in client.get("/api/deals").json()
        if d["stage"] == "Negotiation"
    ]
    assert negotiation == ["A", other["name"]]
    newest = client.get(f"/api/deals/{deal['id']}").json()["timeline"][0]
    assert newest["description"] == "Moved from Proposal to Negotiation"


def test_move_positions(client):
    third = add(client, "deals", name="Third")
    second = add(client, "deals", name="Second")
    first = add(client, "deals", name="First")
    for index, deal in enumerate((first, second, third)):
        move(client, deal, "New", index)
    move(client, third, "New", 0)
    names = [d["name"] for d in client.get("/api/deals").json()]
    assert names == ["Third", "First", "Second"]
    assert [d["name"] for d in client.get("/api/deals").json()] == names


def test_entry_logged_after_a_move_comes_first(client):
    deal = add(client, "deals", name="A")
    move(client, deal, "Qualified")
    now = client.get(f"/api/deals/{deal['id']}").json()["timeline"][0]["happened_at"]
    note = add(
        client,
        "activities",
        type="call",
        deal_id=deal["id"],
        description="Called",
        happened_at=now,
    )
    assert (
        client.get(f"/api/deals/{deal['id']}").json()["timeline"][0]["id"] == note["id"]
    )


def test_move_entry_is_by_the_mover(client):
    deal = add(client, "deals", name="A")
    sign_in_as(client, "Sam Lee")
    moved = move(client, deal, "Qualified")
    assert (moved["created_by"], moved["updated_by"]) == ("Test User", "Sam Lee")
    [entry] = client.get(f"/api/deals/{deal['id']}").json()["timeline"]
    assert (entry["created_by"], entry["updated_by"]) == ("Sam Lee", "Sam Lee")


def test_a_move_marks_only_the_moved_deal_as_changed(client):
    a = add(client, "deals", name="A", stage="Qualified")
    b = add(client, "deals", name="B")
    sign_in_as(client, "Sam Lee")
    moved = move(client, b, "Qualified", index=0)
    after = client.get(f"/api/deals/{a['id']}").json()
    assert (moved["position"], after["position"]) == (0, 1)
    assert moved["updated_by"] == "Sam Lee"
    assert (after["updated_at"], after["updated_by"]) == (a["updated_at"], "Test User")


def test_a_reorder_in_a_column_marks_the_moved_deal_as_changed(client):
    a = add(client, "deals", name="A")
    b = add(client, "deals", name="B")
    sign_in_as(client, "Sam Lee")
    moved = move(client, b, "New", index=0)
    after = client.get(f"/api/deals/{a['id']}").json()
    assert (moved["position"], after["position"]) == (0, 1)
    assert moved["updated_by"] == "Sam Lee"
    assert moved["updated_at"] != b["updated_at"]
    assert (after["updated_at"], after["updated_by"]) == (a["updated_at"], "Test User")


def test_auto_entry_time_is_now_in_utc_to_the_minute(client):
    deal = add(client, "deals", name="A")
    before = datetime.now(UTC).replace(second=0, microsecond=0)
    move(client, deal, "Qualified")
    [entry] = client.get(f"/api/deals/{deal['id']}").json()["timeline"]
    happened_at = datetime.fromisoformat(entry["happened_at"])
    assert before <= happened_at <= datetime.now(UTC)
    assert entry["happened_at"].endswith(":00Z")


def test_win_status_change_is_by_the_mover(client):
    ann = add(client, "contacts", name="Ann")
    deal = add(client, "deals", name="A", contact_id=ann["id"])
    sign_in_as(client, "Sam Lee")
    move(client, deal, "Won")
    contact = client.get(f"/api/contacts/{ann['id']}").json()
    assert (contact["created_by"], contact["updated_by"]) == ("Test User", "Sam Lee")
    [entry] = [a for a in contact["timeline"] if a["contact_id"] == ann["id"]]
    assert entry["created_by"] == "Sam Lee"


def test_win_closes_on_today_in_the_browser_zone(client, monkeypatch):
    del client.app.dependency_overrides[get_today]
    late_on_15_nov = datetime(2026, 11, 15, 23, 30, tzinfo=UTC)
    monkeypatch.setattr("accountable.db.utc_now", lambda: late_on_15_nov)
    deal = add(client, "deals", name="A")
    response = client.post(
        f"/api/deals/{deal['id']}/move",
        json={"stage": "Won", "index": 0},
        headers={"X-Time-Zone": "Pacific/Kiritimati"},
    )
    assert response.json()["close_date"] == "2026-11-16"
