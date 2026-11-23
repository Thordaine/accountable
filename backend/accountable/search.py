"""The /api/search router: organizations, contacts and deals by name."""

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import Connection, Select, Table, func, select

from accountable.db import DbConn, contacts, deals, organizations

router = APIRouter(prefix="/api/search", tags=["search"])

LIMIT = 5


class Match(BaseModel):
    id: int
    name: str


class MatchWithOrganization(Match):
    organization_name: str | None


class SearchResults(BaseModel):
    organizations: list[Match] = []
    contacts: list[MatchWithOrganization] = []
    deals: list[MatchWithOrganization] = []


def with_organization(table: Table) -> Select:
    """A contact's or deal's id and name, with its organization's name."""
    return select(
        table.c.id, table.c.name, organizations.c.name.label("organization_name")
    ).select_from(
        table.outerjoin(organizations, table.c.organization_id == organizations.c.id)
    )


def first_matches(conn: Connection, query: Select, table: Table, q: str) -> list:
    """The first few rows whose name contains q, ignoring case, sorted by name."""
    name = table.c.name
    return list(
        conn.execute(
            query.where(name.icontains(q, autoescape=True))
            .order_by(func.lower(name), table.c.id)
            .limit(LIMIT)
        ).mappings()
    )


@router.get("", response_model=SearchResults)
def search_names(conn: DbConn, q: str = ""):
    q = q.strip()
    if not q:
        return SearchResults()
    return SearchResults(
        organizations=first_matches(
            conn, select(organizations.c.id, organizations.c.name), organizations, q
        ),
        contacts=first_matches(conn, with_organization(contacts), contacts, q),
        deals=first_matches(conn, with_organization(deals), deals, q),
    )
