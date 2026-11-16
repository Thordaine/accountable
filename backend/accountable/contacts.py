"""The /api/contacts router."""

from fastapi import APIRouter, Response
from sqlalchemy import Connection, Select, delete, func, select, update

from accountable.db import (
    DbConn,
    activities,
    contacts,
    deals,
    get_or_404,
    insert_row,
    organizations,
)
from accountable.deals import deal_query
from accountable.rules import contact_timeline
from accountable.schemas import ContactDetail, ContactIn, ContactOut

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


def contact_query() -> Select:
    """Contacts with their organization's name."""
    return (
        select(contacts, organizations.c.name.label("organization_name"))
        .select_from(contacts.outerjoin(organizations))
        .order_by(contacts.c.name, contacts.c.id)
    )


def get_contact(conn: Connection, contact_id: int) -> dict:
    """One contact with its organization's name, or a 404."""
    get_or_404(conn, contacts, contact_id)
    return dict(
        conn.execute(contact_query().where(contacts.c.id == contact_id))
        .mappings()
        .one()
    )


@router.get("", response_model=list[ContactOut])
def list_contacts(conn: DbConn):
    return conn.execute(contact_query()).mappings().all()


@router.get("/{contact_id}", response_model=ContactDetail)
def read_contact(contact_id: int, conn: DbConn):
    contact = get_contact(conn, contact_id)
    their_deals = (
        conn.execute(deal_query().where(deals.c.contact_id == contact_id))
        .mappings()
        .all()
    )
    return {
        **contact,
        "deals": their_deals,
        "timeline": contact_timeline(conn, contact_id),
    }


@router.post("", status_code=201, response_model=ContactOut)
def create_contact(body: ContactIn, conn: DbConn):
    new_id = insert_row(conn, contacts, body.model_dump())
    return get_contact(conn, new_id)


@router.put("/{contact_id}", response_model=ContactOut)
def replace_contact(contact_id: int, body: ContactIn, conn: DbConn):
    get_or_404(conn, contacts, contact_id)
    conn.execute(
        update(contacts).where(contacts.c.id == contact_id).values(**body.model_dump())
    )
    return get_contact(conn, contact_id)


@router.get("/{contact_id}/impact")
def contact_impact(contact_id: int, conn: DbConn):
    get_or_404(conn, contacts, contact_id)
    count_deals = select(func.count()).where(deals.c.contact_id == contact_id)
    count_activities = select(func.count()).where(activities.c.contact_id == contact_id)
    return {
        "deals": conn.execute(count_deals).scalar(),
        "activities": conn.execute(count_activities).scalar(),
    }


@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: int, conn: DbConn):
    get_or_404(conn, contacts, contact_id)
    conn.execute(
        update(deals).where(deals.c.contact_id == contact_id).values(contact_id=None)
    )
    conn.execute(delete(activities).where(activities.c.contact_id == contact_id))
    conn.execute(delete(contacts).where(contacts.c.id == contact_id))
    return Response(status_code=204)
