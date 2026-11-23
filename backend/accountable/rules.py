"""Business rules: stage changes, deal moves and the contact timeline."""

from collections.abc import Sequence
from datetime import date

from sqlalchemy import (
    Connection,
    RowMapping,
    bindparam,
    or_,
    select,
    update,
)

from accountable.activities import activity_query
from accountable.db import (
    activities,
    contacts,
    deals,
    get_or_404,
    insert_row,
    utc_now,
)
from accountable.schemas import USUAL_PROBABILITY


def log_auto(conn: Connection, description: str, by: str, **record) -> None:
    """Write an automatic timeline entry on a deal or contact, timed now to the minute."""
    happened_at = utc_now().replace(second=0, microsecond=0)
    values = {"type": "auto", "description": description, "happened_at": happened_at}
    insert_row(conn, activities, values | record, by=by)


def win_for_contact(conn: Connection, contact_id: int, by: str) -> None:
    """Make the main contact of a won deal a customer, with an entry on their timeline."""
    contact = get_or_404(conn, contacts, contact_id)
    if contact["status"] == "Customer":
        return
    conn.execute(
        update(contacts)
        .where(contacts.c.id == contact_id)
        .values(status="Customer", updated_by=by)
    )
    log_auto(
        conn,
        f"Status changed from {contact['status']} to Customer",
        by,
        contact_id=contact_id,
    )


def change_stage(
    conn: Connection, deal_id: int, stage: str, today: date, by: str
) -> None:
    """Apply the stage rules to a deal; nothing happens if the stage is unchanged."""
    deal = get_or_404(conn, deals, deal_id)
    if stage == deal["stage"]:
        return
    values = {"stage": stage, "probability": USUAL_PROBABILITY[stage], "updated_by": by}
    if stage in ("Won", "Lost"):
        values["close_date"] = today
    conn.execute(update(deals).where(deals.c.id == deal_id).values(**values))
    log_auto(conn, f"Moved from {deal['stage']} to {stage}", by, deal_id=deal_id)
    if stage == "Won" and deal["contact_id"] is not None:
        win_for_contact(conn, deal["contact_id"], by)


def move_deal(
    conn: Connection, deal_id: int, stage: str, index: int, today: date, by: str
) -> None:
    """Change a deal's stage, then put it at index in that column and renumber the column.

    Only the moved deal is marked as changed; the renumbering leaves the others' stamps alone.
    """
    change_stage(conn, deal_id, stage, today, by)
    others = select(deals.c.id).where(deals.c.stage == stage, deals.c.id != deal_id)
    ids = list(conn.execute(others.order_by(deals.c.position, deals.c.id)).scalars())
    ids.insert(index, deal_id)
    renumber = (
        update(deals)
        .where(deals.c.id == bindparam("deal_id"))
        .values(position=bindparam("pos"), updated_at=deals.c.updated_at)
    )
    conn.execute(renumber, [{"deal_id": i, "pos": pos} for pos, i in enumerate(ids)])
    conn.execute(update(deals).where(deals.c.id == deal_id).values(updated_by=by))


def contact_timeline(conn: Connection, contact_id: int) -> Sequence[RowMapping]:
    """Activities on the contact and on deals where they're the main contact, newest first."""
    their_deals = select(deals.c.id).where(deals.c.contact_id == contact_id)
    query = activity_query().where(
        or_(
            activities.c.contact_id == contact_id, activities.c.deal_id.in_(their_deals)
        )
    )
    return conn.execute(query).mappings().all()
