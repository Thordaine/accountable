from conftest import add
from other_user import sign_in_as


def test_contact_email_must_look_like_email(client):
    assert (
        client.post("/api/contacts", json={"name": "Ann", "email": "ann@"}).status_code
        == 422
    )
    response = client.post(
        "/api/contacts", json={"name": "Ann", "email": "ann@calder.com"}
    )
    assert response.status_code == 201
    assert response.json()["status"] == "Lead"


def test_contact_detail(client):
    org = add(client, "organizations", name="Calder Foods")
    ann = add(client, "contacts", name="Ann", organization_id=org["id"])
    add(client, "deals", name="Renewal", contact_id=ann["id"])
    add(client, "deals", name="Someone else's")
    detail = client.get(f"/api/contacts/{ann['id']}").json()
    assert detail["organization_name"] == "Calder Foods"
    assert [d["name"] for d in detail["deals"]] == ["Renewal"]


def test_delete_contact(client):
    ann = add(client, "contacts", name="Ann")
    deal = add(client, "deals", name="Renewal", contact_id=ann["id"])
    for text in ("Called", "Emailed"):
        add(
            client,
            "activities",
            type="note",
            contact_id=ann["id"],
            description=text,
            happened_at="2026-11-10T10:00Z",
        )
    on_deal = add(
        client,
        "activities",
        type="call",
        deal_id=deal["id"],
        description="Deal call",
        happened_at="2026-11-10T11:00Z",
    )
    assert client.get(f"/api/contacts/{ann['id']}/impact").json() == {
        "deals": 1,
        "activities": 2,
    }
    assert client.delete(f"/api/contacts/{ann['id']}").status_code == 204
    deal_now = client.get(f"/api/deals/{deal['id']}").json()
    assert deal_now["contact_id"] is None
    assert [a["id"] for a in deal_now["timeline"]] == [on_deal["id"]]
    assert all(
        a["contact_id"] != ann["id"] for a in client.get("/api/activities").json()
    )


def test_contact_records_who_added_and_changed(client):
    ann = add(client, "contacts", name="Ann")
    assert (ann["created_by"], ann["updated_by"]) == ("Test User", "Test User")
    sign_in_as(client, "Sam Lee")
    changed = client.put(f"/api/contacts/{ann['id']}", json={"name": "Ann Lee"})
    assert (changed.json()["created_by"], changed.json()["updated_by"]) == (
        "Test User",
        "Sam Lee",
    )


def test_contact_times_end_in_z(client):
    ann = add(client, "contacts", name="Ann")
    assert ann["created_at"].endswith("Z")
    assert ann["updated_at"].endswith("Z")
