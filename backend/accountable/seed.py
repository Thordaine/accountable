"""Sample data, with dates relative to the day it's seeded. Run: python -m accountable.seed"""

import random
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import Connection, delete, func, insert, select

from accountable.dashboard import month_start
from accountable.db import (
    activities,
    contacts,
    deals,
    insert_row,
    make_engine,
    new_stamps,
    organizations,
)
from accountable.migrate import upgrade
from accountable.schemas import OPEN_STAGES, STAGES, USUAL_PROBABILITY

SAMPLE_DATA = "Sample data"

ORGANIZATIONS = [
    ("Halden Freight", "haldenfreight.com", "Logistics"),
    ("Fernhill Clinics", "fernhillclinics.com", "Healthcare"),
    ("Calder Foods", "calderfoods.com", "Food manufacturing"),
    ("Osprey Materials", "ospreymaterials.com", "Construction"),
    ("Bellweather Credit Union", "bellweathercu.org", "Financial services"),
    ("Tidewater Hotels", "tidewaterhotels.com", "Hospitality"),
    ("Northgate Dental Group", "northgatedental.com", "Healthcare"),
    ("Kestrel Software", "kestrelsoftware.io", "Software"),
    ("Marlow & Finch Architects", "marlowfinch.com", "Architecture"),
    ("Brightwater Utilities", "brightwaterutilities.com", "Utilities"),
    ("Juniper Retail", "juniperretail.com", "Retail"),
    ("Ashby Engineering", "ashbyeng.com", "Engineering"),
    ("Café Linde", "cafelinde.com", "Hospitality"),
    ("Redwood Learning Trust", "redwoodlearning.org", "Education"),
    ("Pembury Logistics", "pemburylogistics.com", "Logistics"),
]

# (name, job title, organization index or None)
CONTACTS = [
    ("Priya Natarajan", "Head of Operations", 2),
    ("Marcus Oyelaran", "IT Director", 5),
    ("Lena Brandt", "Procurement Manager", 0),
    ("Tomás Ruiz", "Branch Network Lead", 4),
    ("Hannah Cole", "Practice Manager", 1),
    ("Daniel Okafor", "Finance Director", 3),
    ("Sofia Marchetti", "General Manager", 5),
    ("James Whitfield", "COO", 0),
    ("Aisha Rahman", "Clinical Systems Lead", 6),
    ("Oliver Grant", "CTO", 7),
    ("Grace Liu", "Partner", 8),
    ("Ethan Brooks", "Asset Manager", 9),
    ("Chloe Martin", "Store Operations Lead", 10),
    ("Samuel Adeyemi", "Engineering Manager", 11),
    ("Isabel Linde", "Owner", 12),
    ("Ruth Ellison", "Business Manager", 13),
    ("Noah Fischer", "Fleet Manager", 14),
    ("Maya Patel", "Plant Manager", 2),
    ("Lucas Moreau", "Facilities Manager", 3),
    ("Emma Nakamura", "Member Services Director", 4),
    ("Ben Hargreaves", "Head of IT", 1),
    ("Zara Ahmed", "Office Manager", 6),
    ("Felix Wagner", "Product Lead", 7),
    ("Ava Thompson", "Studio Manager", 8),
    ("Leo Santos", "Network Engineer", 9),
    ("Mia Kowalski", "Buyer", 10),
    ("Arjun Mehta", "Project Engineer", 11),
    ("Clara Jensen", "Bursar", 13),
    ("Owen Price", "Warehouse Manager", 14),
    ("Nina Petrova", "Revenue Manager", 5),
    ("Thomas Reid", "Transport Planner", 0),
    ("Elena Rossi", "Quality Manager", 2),
    ("Kofi Mensah", "Regional Director", 3),
    ("Rachel Kim", "Finance Manager", 7),
    ("David Novak", "Consultant", None),
    ("Laura Bennett", "Founder", None),
    ("Yusuf Demir", "Operations Analyst", 11),
    ("Sarah O'Neill", "Head of Estates", 13),
    ("Matteo Ricci", "Head Chef", 12),
    ("Freya Lund", "IT Coordinator", 1),
]

# (deal name, organization index); the first 16 are open, then 25 won, then 9 lost
DEALS = [
    ("Calder Foods packaging line", 2),
    ("Tidewater Hotels guest wifi", 5),
    ("Halden fleet tracking", 0),
    ("Fernhill patient portal", 1),
    ("Osprey site sensors", 3),
    ("Kestrel support plan", 7),
    ("Bellweather branch upgrade", 4),
    ("Northgate booking system", 6),
    ("Marlow & Finch render farm", 8),
    ("Brightwater meter analytics", 9),
    ("Juniper till refresh", 10),
    ("Ashby CAD licences", 11),
    ("Redwood classroom devices", 13),
    ("Pembury warehouse scanners", 14),
    ("Café Linde ordering app", 12),
    ("Independent advisory retainer", None),
    ("Bellweather branch kiosks", 4),
    ("Halden route planning", 0),
    ("Calder Foods cold store monitoring", 2),
    ("Tidewater Hotels conference AV", 5),
    ("Fernhill staff laptops", 1),
    ("Osprey quarry telemetry", 3),
    ("Kestrel developer workstations", 7),
    ("Northgate imaging storage", 6),
    ("Marlow & Finch backup", 8),
    ("Brightwater field tablets", 9),
    ("Juniper loyalty platform", 10),
    ("Ashby test rig", 11),
    ("Redwood staff training", 13),
    ("Pembury yard cameras", 14),
    ("Café Linde kitchen screens", 12),
    ("Halden depot wifi", 0),
    ("Calder Foods label printers", 2),
    ("Tidewater Hotels key cards", 5),
    ("Fernhill telehealth pilot", 1),
    ("Bellweather call centre", 4),
    ("Kestrel security audit", 7),
    ("Osprey safety wearables", 3),
    ("Northgate phone system", 6),
    ("Juniper stock counting", 10),
    ("Redwood library system", 13),
    ("Pembury fuel cards", 14),
    ("Brightwater outage alerts", 9),
    ("Ashby document control", 11),
    ("Marlow & Finch plotters", 8),
    ("Calder Foods recipe software", 2),
    ("Tidewater Hotels spa booking", 5),
    ("Halden driver app", 0),
    ("Fernhill records scanning", 1),
    ("Kestrel office move", 7),
]

WON_PER_MONTH = [2, 1, 3, 2, 1, 2, 3, 2, 4, 2, 2, 1]
LOST_PER_MONTH = [1, 0, 1, 0, 1, 1, 0, 1, 2, 0, 1, 1]

NOTES = [
    "Prefers email over phone",
    "Budget approved for next quarter",
    "New procurement lead joins in January",
    "Interested in the annual plan",
    "Mentioned a competitor quote",
    "Decision expected after the board meeting",
    "Wants a pilot at two sites first",
    "Asked for references in their sector",
]
CALLS = [
    "Asked for a three-year price",
    "Walked through the rollout plan",
    "Discussed renewal terms",
    "Reviewed the proposal line by line",
    "Talked through support hours",
    "Agreed next steps for the pilot",
    "Checked who signs off the budget",
    "Answered questions on data security",
]
EMAILS = [
    "Sent the onboarding pack",
    "Sent a case study",
    "Confirmed the meeting time",
    "Sent pricing for extra seats",
    "Followed up on the contract draft",
    "Shared the implementation timeline",
]
FOLLOW_UPS = [
    "Call back about renewal terms",
    "Send revised proposal",
    "Confirm pilot start date",
    "Check budget sign-off",
    "Intro call with procurement",
    "Chase the signed order form",
    "Book the site visit",
    "Send the security questionnaire",
]


def at(day: date, rng: random.Random) -> datetime:
    """A working-hours time on the given day."""
    return local_time(day, time(rng.randint(8, 17), rng.choice((0, 15, 30, 45))))


def local_time(day: date, moment: time) -> datetime:
    """The given day and time in the computer's own zone, in UTC."""
    return datetime.combine(day, moment).astimezone(UTC)


def closed_dates(today: date, per_month: list[int], rng: random.Random) -> list[date]:
    """Close dates over the last 12 months, per_month[0] being 11 months ago."""
    dates = []
    for i, n in enumerate(per_month):
        start = month_start(today, 11 - i)
        last_day = today.day if i == 11 else 28
        dates += [start.replace(day=rng.randint(1, last_day)) for _ in range(n)]
    return dates


def insert_organizations(conn: Connection) -> list[int]:
    rows = [
        {"name": n, "website": w, "industry": i, "notes": None}
        for n, w, i in ORGANIZATIONS
    ]
    rows[2]["notes"] = (
        "Family-owned, three plants.\nAnnual budget cycle starts in October."
    )
    return [insert_row(conn, organizations, row, by=SAMPLE_DATA) for row in rows]


def insert_contacts(
    conn: Connection, org_ids: list[int], rng: random.Random
) -> list[int]:
    ids = []
    for name, title, org in CONTACTS:
        domain = ORGANIZATIONS[org][1] if org is not None else "gmail.com"
        email = (
            name.lower().replace("'", "").replace("á", "a").replace(" ", ".")
            + "@"
            + domain
        )
        row = {
            "name": name,
            "job_title": title,
            "email": email,
            "status": rng.choice(("Lead", "Qualified")),
            "organization_id": None if org is None else org_ids[org],
            "phone": f"+1 {rng.randint(201, 989)} 555 {rng.randint(1000, 9999)}",
        }
        ids.append(insert_row(conn, contacts, row, by=SAMPLE_DATA))
    return ids


def main_contact(
    org: int | None, contact_ids: list[int], stage: str, rng: random.Random
) -> int | None:
    """A contact at the organization: the first one for won deals, so not everyone is a customer."""
    choices = [
        contact_ids[i]
        for i, c in enumerate(CONTACTS)
        if c[2] == org and org is not None
    ]
    if not choices:
        return contact_ids[34]
    return choices[0] if stage == "Won" else rng.choice(choices)


def deal_rows(today: date, rng: random.Random) -> list[dict]:
    """Stage, close date and value for every deal, in DEALS order."""
    late = {1, 6, 11}
    rows: list[dict] = []
    for i in range(16):
        days = -rng.randint(3, 20) if i in late else rng.randint(5, 180)
        rows.append(
            {"stage": OPEN_STAGES[i % 4], "close_date": today + timedelta(days=days)}
        )
    rows += [
        {"stage": "Won", "close_date": d}
        for d in closed_dates(today, WON_PER_MONTH, rng)
    ]
    rows += [
        {"stage": "Lost", "close_date": d}
        for d in closed_dates(today, LOST_PER_MONTH, rng)
    ]
    for row in rows:
        row["value"] = rng.randint(24, 220) * 250
        row["probability"] = USUAL_PROBABILITY[row["stage"]]
    return rows


def insert_deals(conn, org_ids, contact_ids, today, rng) -> list[dict]:
    """Insert the deals and return them with their ids."""
    inserted = []
    for (name, org), row in zip(DEALS, deal_rows(today, rng)):
        contact = main_contact(org, contact_ids, row["stage"], rng)
        row |= {
            "name": name,
            "organization_id": None if org is None else org_ids[org],
            "contact_id": contact,
        }
        row["position"] = sum(d["stage"] == row["stage"] for d in inserted)
        row["id"] = insert_row(conn, deals, row, by=SAMPLE_DATA)
        inserted.append(row)
    return inserted


def auto(deal_id=None, contact_id=None, description="", happened_at=None) -> dict:
    return {
        "type": "auto",
        "deal_id": deal_id,
        "contact_id": contact_id,
        "description": description,
        "happened_at": happened_at,
    }


def history(
    conn: Connection, inserted: list[dict], today: date, rng: random.Random
) -> list[dict]:
    """Automatic entries for each deal's last move, and contacts made customers by wins."""
    entries = []
    for deal in sorted(inserted, key=lambda d: d["close_date"]):
        stage = deal["stage"]
        if stage == "New":
            continue
        if stage in ("Won", "Lost"):
            before, when = (
                rng.choice(("Proposal", "Negotiation")),
                at(deal["close_date"], rng),
            )
        else:
            before, when = (
                STAGES[STAGES.index(stage) - 1],
                at(today - timedelta(days=rng.randint(1, 40)), rng),
            )
        entries.append(auto(deal["id"], None, f"Moved from {before} to {stage}", when))
        if stage == "Won":
            entries += make_customer(conn, deal["contact_id"], when)
    return entries


def make_customer(conn: Connection, contact_id: int, when: datetime) -> list[dict]:
    """Make the contact a customer; the entry for it, if they weren't one."""
    status = conn.execute(
        select(contacts.c.status).where(contacts.c.id == contact_id)
    ).scalar()
    if status == "Customer":
        return []
    conn.execute(
        contacts.update()
        .where(contacts.c.id == contact_id)
        .values(status="Customer", updated_by=SAMPLE_DATA)
    )
    return [auto(None, contact_id, f"Status changed from {status} to Customer", when)]


def follow_up(i: int, today: date, rng: random.Random) -> tuple[date | None, bool]:
    """Follow-up date and done flag for the i-th hand-logged activity."""
    if i < 4:
        return today - timedelta(days=rng.randint(1, 6)), False
    if i < 9:
        return today + timedelta(days=i - 4 + rng.randint(0, 3)), False
    if i < 13:
        return today + timedelta(days=rng.randint(10, 30)), False
    if i < 20:
        return today - timedelta(days=rng.randint(2, 25)), True
    return None, False


def logged(inserted, contact_ids, today, rng) -> list[dict]:
    """80 notes, calls and emails on contacts and open deals."""
    open_ids = [d["id"] for d in inserted if d["stage"] in OPEN_STAGES]
    rows = []
    for i in range(80):
        due, done = follow_up(i, today, rng)
        kind = rng.choice(("note", "call", "call", "email"))
        if due:
            text = FOLLOW_UPS[i % len(FOLLOW_UPS)]
            when = at(min(due, today) - timedelta(days=rng.randint(2, 14)), rng)
        else:
            text = rng.choice({"note": NOTES, "call": CALLS, "email": EMAILS}[kind])
            when = at(today - timedelta(days=rng.randint(1, 120)), rng)
        on_deal = i % 2 == 0
        rows.append(
            {
                "type": kind,
                "description": text,
                "happened_at": when,
                "follow_up_date": due,
                "done": done,
                "deal_id": rng.choice(open_ids) if on_deal else None,
                "contact_id": None if on_deal else rng.choice(contact_ids),
            }
        )
    return rows


def seed(conn: Connection, today: date, now: time | None = None) -> None:
    """Replace all data with the sample data; nothing happens after `now` (default: the current time)."""
    for table in (activities, deals, contacts, organizations):
        conn.execute(delete(table))
    rng = random.Random(7)
    org_ids = insert_organizations(conn)
    contact_ids = insert_contacts(conn, org_ids, rng)
    inserted = insert_deals(conn, org_ids, contact_ids, today, rng)
    moment = now or datetime.now().time()
    latest = local_time(today, moment.replace(second=0, microsecond=0))
    for entries in (
        history(conn, inserted, today, rng),
        logged(inserted, contact_ids, today, rng),
    ):
        for entry in entries:
            entry["happened_at"] = min(entry["happened_at"], latest)
            entry |= new_stamps(SAMPLE_DATA)
        conn.execute(insert(activities), entries)


def main() -> None:
    """Seed the local SQLite file, never DATABASE_URL, and print the counts."""
    engine = make_engine(None)
    upgrade(engine)
    with engine.begin() as conn:
        seed(conn, date.today())
        for table in (organizations, contacts, deals, activities):
            print(
                f"{table.name}: {conn.execute(select(func.count()).select_from(table)).scalar()}"
            )


if __name__ == "__main__":
    main()
