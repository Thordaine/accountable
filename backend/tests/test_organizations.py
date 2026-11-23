from conftest import add
from other_user import sign_in_as


def test_org_requires_name(client):
    assert client.post("/api/organizations", json={"name": "  "}).status_code == 422


def test_org_list_counts(client):
    org = add(client, "organizations", name="Calder Foods")
    add(client, "contacts", name="Ann", organization_id=org["id"])
    add(client, "contacts", name="Bo", organization_id=org["id"])
    add(client, "deals", name="Open", organization_id=org["id"], value=1000)
    add(client, "deals", name="Won", organization_id=org["id"], value=5000, stage="Won")
    [listed] = client.get("/api/organizations").json()
    assert listed["contact_count"] == 2
    assert listed["open_deal_value"] == 1000
    detail = client.get(f"/api/organizations/{org['id']}").json()
    assert len(detail["contacts"]) == 2
    assert len(detail["deals"]) == 2
    assert detail["open_deal_value"] == 1000


def test_unknown_id_is_404(client):
    for kind in ("organizations", "contacts", "deals"):
        assert client.get(f"/api/{kind}/9999").status_code == 404
        assert client.put(f"/api/{kind}/9999", json={"name": "x"}).status_code == 404
        assert client.delete(f"/api/{kind}/9999").status_code == 404


def test_delete_org_keeps_links(client):
    org = add(client, "organizations", name="Calder Foods")
    ann = add(client, "contacts", name="Ann", organization_id=org["id"])
    bo = add(client, "contacts", name="Bo", organization_id=org["id"])
    deal = add(client, "deals", name="Renewal", organization_id=org["id"])
    assert client.get(f"/api/organizations/{org['id']}/impact").json() == {
        "contacts": 2,
        "deals": 1,
    }
    assert client.delete(f"/api/organizations/{org['id']}").status_code == 204
    for kind, record in (("contacts", ann), ("contacts", bo), ("deals", deal)):
        assert (
            client.get(f"/api/{kind}/{record['id']}").json()["organization_id"] is None
        )
    assert client.get(f"/api/organizations/{org['id']}").status_code == 404


def test_org_records_who_added_and_changed(client):
    org = add(client, "organizations", name="Calder Foods")
    assert (org["created_by"], org["updated_by"]) == ("Test User", "Test User")
    sign_in_as(client, "Sam Lee")
    changed = client.put(f"/api/organizations/{org['id']}", json={"name": "Calder"})
    assert (changed.json()["created_by"], changed.json()["updated_by"]) == (
        "Test User",
        "Sam Lee",
    )


def test_org_times_end_in_z(client):
    org = add(client, "organizations", name="Calder Foods")
    assert org["created_at"].endswith("Z")
    assert org["updated_at"].endswith("Z")
