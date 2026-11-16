from conftest import add


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
        happened_at=now[:16],
    )
    assert (
        client.get(f"/api/deals/{deal['id']}").json()["timeline"][0]["id"] == note["id"]
    )
