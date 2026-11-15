from conftest import add


def test_deal_rules(client):
    assert client.post("/api/deals", json={"name": "A", "value": -1}).status_code == 422
    assert client.post("/api/deals", json={"name": "A", "probability": 101}).status_code == 422
    deal = add(client, "deals", name="A", stage="Proposal", value=100)
    assert deal["close_date"] == "2026-12-15"
    assert deal["probability"] == 50


def test_new_deal_goes_to_top(client):
    first = add(client, "deals", name="First")
    second = add(client, "deals", name="Second")
    assert second["position"] < first["position"]
    assert [d["name"] for d in client.get("/api/deals").json()] == ["Second", "First"]


def test_deal_without_org_or_contact(client):
    add(client, "deals", name="Bare")
    [deal] = client.get("/api/deals").json()
    assert deal["organization_name"] is None
    assert deal["contact_name"] is None


def test_delete_deal(client):
    deal = add(client, "deals", name="Renewal")
    for n in range(3):
        add(client, "activities", type="note", deal_id=deal["id"], description=f"Note {n}",
            happened_at="2026-11-10T10:00")
    assert client.get(f"/api/deals/{deal['id']}/impact").json() == {"activities": 3}
    assert client.delete(f"/api/deals/{deal['id']}").status_code == 204
    assert client.get("/api/activities").json() == []


def test_activity_needs_exactly_one_record(client):
    ann = add(client, "contacts", name="Ann")
    deal = add(client, "deals", name="Renewal")
    base = {"type": "note", "description": "x", "happened_at": "2026-11-10T10:00"}
    both = {**base, "contact_id": ann["id"], "deal_id": deal["id"]}
    assert client.post("/api/activities", json=both).status_code == 422
    assert client.post("/api/activities", json=base).status_code == 422
