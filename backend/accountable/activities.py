"""Activities: the query behind every timeline, and the /api/activities router."""

from fastapi import APIRouter, HTTPException, Response
from sqlalchemy import Connection, Select, delete, select, update

from accountable.auth import CurrentUser
from accountable.db import DbConn, activities, contacts, deals, get_or_404, insert_row
from accountable.schemas import ActivityIn, ActivityOut, DoneIn

router = APIRouter(prefix="/api/activities", tags=["activities"])


def activity_query() -> Select:
    """Activities with the names of the contact and deal they're logged on."""
    return (
        select(
            activities,
            contacts.c.name.label("contact_name"),
            deals.c.name.label("deal_name"),
        )
        .select_from(
            activities.outerjoin(
                contacts, activities.c.contact_id == contacts.c.id
            ).outerjoin(deals, activities.c.deal_id == deals.c.id)
        )
        .order_by(activities.c.happened_at.desc(), activities.c.id.desc())
    )


def get_activity(conn: Connection, activity_id: int) -> dict:
    """One activity with its names, or a 404."""
    get_or_404(conn, activities, activity_id)
    query = activity_query().where(activities.c.id == activity_id)
    return dict(conn.execute(query).mappings().one())


def editable(conn: Connection, activity_id: int) -> dict:
    """An activity logged by hand, or a 404 or 409."""
    activity = get_or_404(conn, activities, activity_id)
    if activity["type"] == "auto":
        raise HTTPException(409, "Automatic entries can't be changed")
    return activity


def check_record(conn: Connection, body: ActivityIn) -> None:
    """The contact or deal the activity is logged on must exist."""
    if body.contact_id is not None:
        get_or_404(conn, contacts, body.contact_id)
    if body.deal_id is not None:
        get_or_404(conn, deals, body.deal_id)


@router.get("", response_model=list[ActivityOut])
def list_activities(conn: DbConn):
    return conn.execute(activity_query()).mappings().all()


@router.post("", status_code=201, response_model=ActivityOut)
def log_activity(body: ActivityIn, conn: DbConn, user: CurrentUser):
    check_record(conn, body)
    new_id = insert_row(conn, activities, body.model_dump(), by=user.name)
    return get_activity(conn, new_id)


@router.put("/{activity_id}", response_model=ActivityOut)
def edit_activity(activity_id: int, body: ActivityIn, conn: DbConn, user: CurrentUser):
    editable(conn, activity_id)
    check_record(conn, body)
    conn.execute(
        update(activities)
        .where(activities.c.id == activity_id)
        .values(**body.model_dump(), updated_by=user.name)
    )
    return get_activity(conn, activity_id)


@router.patch("/{activity_id}", response_model=ActivityOut)
def set_done(activity_id: int, body: DoneIn, conn: DbConn, user: CurrentUser):
    if get_or_404(conn, activities, activity_id)["follow_up_date"] is None:
        raise HTTPException(422, "Only a follow-up can be done")
    conn.execute(
        update(activities)
        .where(activities.c.id == activity_id)
        .values(done=body.done, updated_by=user.name)
    )
    return get_activity(conn, activity_id)


@router.delete("/{activity_id}", status_code=204)
def delete_activity(activity_id: int, conn: DbConn):
    editable(conn, activity_id)
    conn.execute(delete(activities).where(activities.c.id == activity_id))
    return Response(status_code=204)
