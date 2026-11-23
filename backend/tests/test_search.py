import pytest

from conftest import add


def find(client, q: str) -> dict:
    """The search response for q."""
    response = client.get("/api/search", params={"q": q})
    assert response.status_code == 200, response.text
    return response.json()


def names(found: dict) -> dict:
    """Each group's names."""
    return {kind: [row["name"] for row in rows] for kind, rows in found.items()}


def test_part_of_a_name_in_any_case(client):
    org = add(client, "organizations", name="Calder Foods")
    ann = add(client, "contacts", name="Ann Calderwood", organization_id=org["id"])
    deal = add(client, "deals", name="Recalder renewal")
    add(client, "organizations", name="Other")
    assert find(client, "cALDEr") == {
        "organizations": [{"id": org["id"], "name": "Calder Foods"}],
        "contacts": [
            {
                "id": ann["id"],
                "name": "Ann Calderwood",
                "organization_name": "Calder Foods",
            }
        ],
        "deals": [
            {"id": deal["id"], "name": "Recalder renewal", "organization_name": None}
        ],
    }


def test_case_folds_beyond_ascii(client):
    add(client, "contacts", name="Émile Zola")
    assert names(find(client, "ÉMILE"))["contacts"] == ["Émile Zola"]


def test_percent_and_underscore_match_only_themselves(client):
    for name in ("100% Fit", "1000 Fit", "a_b", "axb"):
        add(client, "organizations", name=name)
    assert names(find(client, "%"))["organizations"] == ["100% Fit"]
    assert names(find(client, "_"))["organizations"] == ["a_b"]


def test_up_to_five_of_each_sorted_by_name(client):
    org = add(client, "organizations", name="Zeta")
    for name in ("deal f", "Deal b", "deal e", "Deal a", "deal d", "Deal c"):
        add(client, "deals", name=name, organization_id=org["id"])
    deals = find(client, "deal")["deals"]
    assert [d["name"] for d in deals] == [
        "Deal a",
        "Deal b",
        "Deal c",
        "deal d",
        "deal e",
    ]
    assert {d["organization_name"] for d in deals} == {"Zeta"}


def test_spaces_at_either_end_are_ignored(client):
    add(client, "organizations", name="Calder Foods")
    assert names(find(client, "  calder  "))["organizations"] == ["Calder Foods"]


@pytest.mark.parametrize("q", ["", "   "])
def test_empty_query_gives_empty_groups(client, q):
    add(client, "organizations", name="Calder Foods")
    assert find(client, q) == {"organizations": [], "contacts": [], "deals": []}


def test_only_names_match(client):
    add(client, "organizations", name="Calder Foods", notes="mango supplier")
    add(client, "contacts", name="Ann", email="mango@calder.com")
    assert find(client, "mango") == {"organizations": [], "contacts": [], "deals": []}
