"""The /api/deals router."""

from datetime import date, timedelta

from fastapi import APIRouter, Response
from sqlalchemy import Connection, Select, case, delete, func, select, update

from accountable.activities import activity_query
from accountable.db import (
    DbConn,
    Today,
    activities,
    contacts,
    deals,
    get_or_404,
    insert_row,
    organizations,
)
from accountable.rules import move_deal
from accountable.schemas import (
    STAGES,
    USUAL_PROBABILITY,
    DealDetail,
    DealIn,
    DealOut,
    MoveIn,
)

router = APIRouter(prefix="/api/deals", tags=["deals"])


def deal_query() -> Select:
    """Deals with their organization's and main contact's names, in board order."""
    stage_order = case(
        {stage: i for i, stage in enumerate(STAGES)}, value=deals.c.stage
    )
    return (
        select(
            deals,
            organizations.c.name.label("organization_name"),
            contacts.c.name.label("contact_name"),
        )
        .select_from(
            deals.outerjoin(
                organizations, deals.c.organization_id == organizations.c.id
            ).outerjoin(contacts, deals.c.contact_id == contacts.c.id)
        )
        .order_by(stage_order, deals.c.position, deals.c.id)
    )


def get_deal(conn: Connection, deal_id: int) -> dict:
    """One deal with its names, or a 404."""
    get_or_404(conn, deals, deal_id)
    return dict(
        conn.execute(deal_query().where(deals.c.id == deal_id)).mappings().one()
    )


def top_position(conn: Connection, stage: str) -> int:
    """A position above every card in the stage's column."""
    lowest = conn.execute(
        select(func.min(deals.c.position)).where(deals.c.stage == stage)
    ).scalar()
    return 0 if lowest is None else lowest - 1


def deal_values(body: DealIn, today: date) -> dict:
    """The columns to store, with the defaults for probability and close date."""
    values = body.model_dump()
    if values["probability"] is None:
        values["probability"] = USUAL_PROBABILITY[body.stage]
    if values["close_date"] is None:
        values["close_date"] = today + timedelta(days=30)
    return values


@router.get("", response_model=list[DealOut])
def list_deals(conn: DbConn):
    return conn.execute(deal_query()).mappings().all()


@router.get("/{deal_id}", response_model=DealDetail)
def read_deal(deal_id: int, conn: DbConn):
    deal = get_deal(conn, deal_id)
    timeline = (
        conn.execute(activity_query().where(activities.c.deal_id == deal_id))
        .mappings()
        .all()
    )
    return {**deal, "timeline": timeline}


@router.post("", status_code=201, response_model=DealOut)
def create_deal(body: DealIn, conn: DbConn, today: Today):
    values = deal_values(body, today) | {"position": top_position(conn, body.stage)}
    new_id = insert_row(conn, deals, values)
    return get_deal(conn, new_id)


@router.put("/{deal_id}", response_model=DealOut)
def replace_deal(
    deal_id: int,
    body: DealIn,
    conn: DbConn,
    today: Today,
):
    old_stage = get_or_404(conn, deals, deal_id)["stage"]
    values = deal_values(body, today) | {"stage": old_stage}
    conn.execute(update(deals).where(deals.c.id == deal_id).values(**values))
    if body.stage != old_stage:
        move_deal(conn, deal_id, body.stage, 0, today)
    return get_deal(conn, deal_id)


@router.post("/{deal_id}/move", response_model=DealOut)
def move(
    deal_id: int,
    body: MoveIn,
    conn: DbConn,
    today: Today,
):
    move_deal(conn, deal_id, body.stage, body.index, today)
    return get_deal(conn, deal_id)


@router.get("/{deal_id}/impact")
def deal_impact(deal_id: int, conn: DbConn):
    get_or_404(conn, deals, deal_id)
    count = select(func.count()).where(activities.c.deal_id == deal_id)
    return {"activities": conn.execute(count).scalar()}


@router.delete("/{deal_id}", status_code=204)
def delete_deal(deal_id: int, conn: DbConn):
    get_or_404(conn, deals, deal_id)
    conn.execute(delete(activities).where(activities.c.deal_id == deal_id))
    conn.execute(delete(deals).where(deals.c.id == deal_id))
    return Response(status_code=204)
