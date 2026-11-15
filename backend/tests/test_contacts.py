from conftest import add


def test_contact_email_must_look_like_email(client):
    assert client.post("/api/contacts", json={"name": "Ann", "email": "ann@"}).status_code == 422
    response = client.post("/api/contacts", json={"name": "Ann", "email": "ann@calder.com"})
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
        add(client, "activities", type="note", contact_id=ann["id"], description=text,
            happened_at="2026-11-10T10:00")
    on_deal = add(client, "activities", type="call", deal_id=deal["id"], description="Deal call",
                  happened_at="2026-11-10T11:00")
    assert client.get(f"/api/contacts/{ann['id']}/impact").json() == {"deals": 1, "activities": 2}
    assert client.delete(f"/api/contacts/{ann['id']}").status_code == 204
    deal_now = client.get(f"/api/deals/{deal['id']}").json()
    assert deal_now["contact_id"] is None
    assert [a["id"] for a in deal_now["timeline"]] == [on_deal["id"]]
    assert all(a["contact_id"] != ann["id"] for a in client.get("/api/activities").json())
