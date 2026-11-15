"""Business rules: stage changes, deal moves and the contact timeline."""

from datetime import date, datetime

from sqlalchemy import Connection, bindparam, insert, or_, select, update

from accountable.activities import activity_query
from accountable.db import activities, contacts, deals, get_or_404
from accountable.schemas import USUAL_PROBABILITY


def log_auto(conn: Connection, description: str, today: date, **record) -> None:
    """Write an automatic timeline entry on a deal or contact."""
    happened_at = datetime.combine(today, datetime.now().time().replace(second=0, microsecond=0))
    conn.execute(insert(activities).values(type="auto", description=description, happened_at=happened_at, **record))


def win_for_contact(conn: Connection, contact_id: int, today: date) -> None:
    """Make the main contact of a won deal a customer, with an entry on their timeline."""
    contact = get_or_404(conn, contacts, contact_id)
    if contact["status"] == "Customer":
        return
    conn.execute(update(contacts).where(contacts.c.id == contact_id).values(status="Customer"))
    log_auto(conn, f"Status changed from {contact['status']} to Customer", today, contact_id=contact_id)


def change_stage(conn: Connection, deal_id: int, stage: str, today: date) -> None:
    """Apply the stage rules to a deal; nothing happens if the stage is unchanged."""
    deal = get_or_404(conn, deals, deal_id)
    if stage == deal["stage"]:
        return
    values = {"stage": stage, "probability": USUAL_PROBABILITY[stage]}
    if stage in ("Won", "Lost"):
        values["close_date"] = today
    conn.execute(update(deals).where(deals.c.id == deal_id).values(**values))
    log_auto(conn, f"Moved from {deal['stage']} to {stage}", today, deal_id=deal_id)
    if stage == "Won" and deal["contact_id"] is not None:
        win_for_contact(conn, deal["contact_id"], today)


def move_deal(conn: Connection, deal_id: int, stage: str, index: int, today: date) -> None:
    """Change a deal's stage, then put it at index in that column and renumber the column."""
    change_stage(conn, deal_id, stage, today)
    others = select(deals.c.id).where(deals.c.stage == stage, deals.c.id != deal_id)
    ids = list(conn.execute(others.order_by(deals.c.position, deals.c.id)).scalars())
    ids.insert(index, deal_id)
    renumber = update(deals).where(deals.c.id == bindparam("deal_id")).values(position=bindparam("pos"))
    conn.execute(renumber, [{"deal_id": i, "pos": pos} for pos, i in enumerate(ids)])


def contact_timeline(conn: Connection, contact_id: int) -> list:
    """Activities on the contact and on deals where they're the main contact, newest first."""
    their_deals = select(deals.c.id).where(deals.c.contact_id == contact_id)
    query = activity_query().where(
        or_(activities.c.contact_id == contact_id, activities.c.deal_id.in_(their_deals))
    )
    return conn.execute(query).mappings().all()
