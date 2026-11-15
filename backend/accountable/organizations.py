"""The /api/organizations router."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy import Connection, Select, delete, func, insert, select, update

from accountable.contacts import contact_query
from accountable.db import contacts, deals, get_conn, get_or_404, organizations
from accountable.deals import deal_query
from accountable.schemas import OPEN_STAGES, OrganizationDetail, OrganizationIn, OrganizationOut

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


def org_query() -> Select:
    """Organizations with their contact count and the value of their open deals."""
    contact_count = (
        select(func.count()).where(contacts.c.organization_id == organizations.c.id).scalar_subquery()
    )
    open_value = (
        select(func.coalesce(func.sum(deals.c.value), 0))
        .where(deals.c.organization_id == organizations.c.id, deals.c.stage.in_(OPEN_STAGES))
        .scalar_subquery()
    )
    return select(
        organizations, contact_count.label("contact_count"), open_value.label("open_deal_value")
    ).order_by(organizations.c.name, organizations.c.id)


def get_org(conn: Connection, org_id: int) -> dict:
    """One organization with its figures, or a 404."""
    get_or_404(conn, organizations, org_id)
    return dict(conn.execute(org_query().where(organizations.c.id == org_id)).mappings().one())


@router.get("", response_model=list[OrganizationOut])
def list_organizations(conn: Connection = Depends(get_conn)):
    return conn.execute(org_query()).mappings().all()


@router.get("/{org_id}", response_model=OrganizationDetail)
def read_organization(org_id: int, conn: Connection = Depends(get_conn)):
    org = get_org(conn, org_id)
    its_contacts = conn.execute(contact_query().where(contacts.c.organization_id == org_id)).mappings().all()
    its_deals = conn.execute(deal_query().where(deals.c.organization_id == org_id)).mappings().all()
    return {**org, "contacts": its_contacts, "deals": its_deals}


@router.post("", status_code=201, response_model=OrganizationOut)
def create_organization(body: OrganizationIn, conn: Connection = Depends(get_conn)):
    new_id = conn.execute(insert(organizations).values(**body.model_dump())).inserted_primary_key[0]
    return get_org(conn, new_id)


@router.put("/{org_id}", response_model=OrganizationOut)
def replace_organization(org_id: int, body: OrganizationIn, conn: Connection = Depends(get_conn)):
    get_or_404(conn, organizations, org_id)
    conn.execute(update(organizations).where(organizations.c.id == org_id).values(**body.model_dump()))
    return get_org(conn, org_id)


@router.get("/{org_id}/impact")
def organization_impact(org_id: int, conn: Connection = Depends(get_conn)):
    get_or_404(conn, organizations, org_id)
    count_contacts = select(func.count()).where(contacts.c.organization_id == org_id)
    count_deals = select(func.count()).where(deals.c.organization_id == org_id)
    return {"contacts": conn.execute(count_contacts).scalar(), "deals": conn.execute(count_deals).scalar()}


@router.delete("/{org_id}", status_code=204)
def delete_organization(org_id: int, conn: Connection = Depends(get_conn)):
    get_or_404(conn, organizations, org_id)
    conn.execute(update(contacts).where(contacts.c.organization_id == org_id).values(organization_id=None))
    conn.execute(update(deals).where(deals.c.organization_id == org_id).values(organization_id=None))
    conn.execute(delete(organizations).where(organizations.c.id == org_id))
    return Response(status_code=204)
