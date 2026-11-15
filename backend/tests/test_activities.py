from conftest import add


def log(client, **fields):
    return add(client, "activities", **({"type": "note", "description": "x"} | fields))


def test_contact_timeline_includes_main_contact_deals(client):
    ann = add(client, "contacts", name="Ann")
    deal = add(client, "deals", name="Calder Foods renewal", contact_id=ann["id"])
    older = log(client, contact_id=ann["id"], happened_at="2026-11-10T09:00")
    newer = log(client, deal_id=deal["id"], happened_at="2026-11-12T09:00", type="call")
    timeline = client.get(f"/api/contacts/{ann['id']}").json()["timeline"]
    assert [a["id"] for a in timeline] == [newer["id"], older["id"]]
    assert timeline[0]["deal_name"] == "Calder Foods renewal"


def test_edit_and_delete_activity(client):
    ann = add(client, "contacts", name="Ann")
    note = log(client, contact_id=ann["id"], happened_at="2026-11-10T09:00")
    body = {"type": "call", "contact_id": ann["id"], "description": "Called", "happened_at": "2026-11-10T10:00"}
    assert client.put(f"/api/activities/{note['id']}", json=body).json()["description"] == "Called"
    assert client.delete(f"/api/activities/{note['id']}").status_code == 204
    assert client.get("/api/activities").json() == []


def test_auto_entries_locked(client):
    deal = add(client, "deals", name="A")
    client.post(f"/api/deals/{deal['id']}/move", json={"stage": "Qualified", "index": 0})
    [entry] = client.get(f"/api/deals/{deal['id']}").json()["timeline"]
    body = {"type": "note", "deal_id": deal["id"], "description": "y", "happened_at": "2026-11-10T10:00"}
    assert client.put(f"/api/activities/{entry['id']}", json=body).status_code == 409
    assert client.delete(f"/api/activities/{entry['id']}").status_code == 409


def test_mark_done(client):
    ann = add(client, "contacts", name="Ann")
    task = log(client, contact_id=ann["id"], happened_at="2026-11-10T09:00", follow_up_date="2026-11-16")
    response = client.patch(f"/api/activities/{task['id']}", json={"done": True})
    assert response.json()["done"] is True
    plain = log(client, contact_id=ann["id"], happened_at="2026-11-10T09:00")
    assert client.patch(f"/api/activities/{plain['id']}", json={"done": True}).status_code == 422
