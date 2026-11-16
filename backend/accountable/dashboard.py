"""Dashboard figures and the /api/dashboard router."""

from datetime import date, timedelta

from fastapi import APIRouter
from sqlalchemy import Connection, select

from accountable.activities import activity_query
from accountable.db import DbConn, Today, activities, deals
from accountable.schemas import (
    OPEN_STAGES,
    STAGES,
    Dashboard,
    OpenFigures,
    StageFigures,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def month_start(today: date, months_back: int) -> date:
    """The first day of the month months_back before today's month."""
    index = today.year * 12 + today.month - 1 - months_back
    return date(index // 12, index % 12 + 1, 1)


def expected(deal) -> float:
    """A deal's value times its probability of close, unrounded."""
    return deal["value"] * deal["probability"] / 100


def monthly(all_deals, months: list[str]) -> dict:
    """Revenue won, deals won and deals lost per month, and the win rate."""
    revenue, won, lost = [0] * 12, [0] * 12, [0] * 12
    for deal in all_deals:
        month = deal["close_date"].strftime("%Y-%m")
        if month not in months:
            continue
        i = months.index(month)
        if deal["stage"] == "Won":
            revenue[i] += deal["value"]
            won[i] += 1
        elif deal["stage"] == "Lost":
            lost[i] += 1
    closed = sum(won) + sum(lost)
    win_rate = round(100 * sum(won) / closed) if closed else None
    return {"revenue_won": revenue, "won": won, "lost": lost, "win_rate": win_rate}


def open_figures(all_deals, today: date) -> OpenFigures:
    """Value, expected revenue, count and lateness of the open deals, by stage."""
    open_deals = [d for d in all_deals if d["stage"] in OPEN_STAGES]
    stages = [
        StageFigures(
            stage=stage,
            count=len(in_stage := [d for d in open_deals if d["stage"] == stage]),
            value=sum(d["value"] for d in in_stage),
            expected=sum(expected(d) for d in in_stage),
        )
        for stage in OPEN_STAGES
    ]
    return OpenFigures(
        value=sum(s.value for s in stages),
        expected=sum(s.expected for s in stages),
        count=len(open_deals),
        late=sum(d["close_date"] < today for d in open_deals),
        stages=stages,
    )


def funnel(all_deals) -> list[dict]:
    """For New to Won, the value of non-Lost deals at that stage or further along."""
    reached = [d for d in all_deals if d["stage"] != "Lost"]
    return [
        {
            "stage": stage,
            "value": sum(d["value"] for d in reached if STAGES.index(d["stage"]) >= i),
        }
        for i, stage in enumerate(STAGES[:5])
    ]


def record_link(activity) -> dict:
    """The contact or deal an activity is logged on."""
    if activity["contact_id"] is not None:
        return {
            "kind": "contact",
            "id": activity["contact_id"],
            "name": activity["contact_name"],
        }
    return {"kind": "deal", "id": activity["deal_id"], "name": activity["deal_name"]}


def follow_ups(conn: Connection, today: date) -> list[dict]:
    """Follow-ups not done that are overdue or due in the next 7 days, soonest first."""
    query = (
        activity_query()
        .where(
            activities.c.done.is_(False),
            activities.c.follow_up_date <= today + timedelta(days=7),
        )
        .order_by(None)
        .order_by(activities.c.follow_up_date, activities.c.id)
    )
    return [
        {
            "activity_id": a["id"],
            "description": a["description"],
            "follow_up_date": a["follow_up_date"],
            "overdue": a["follow_up_date"] < today,
            "record": record_link(a),
        }
        for a in conn.execute(query).mappings()
    ]


def recent(conn: Connection) -> list[dict]:
    """The 10 newest timeline entries across the app."""
    return [
        {**a, "record": record_link(a)}
        for a in conn.execute(activity_query().limit(10)).mappings()
    ]


def figures(conn: Connection, today: date) -> Dashboard:
    """Every dashboard figure."""
    all_deals = conn.execute(select(deals)).mappings().all()
    months = [month_start(today, back).strftime("%Y-%m") for back in range(11, -1, -1)]
    return Dashboard(
        months=months,
        **monthly(all_deals, months),
        open=open_figures(all_deals, today),
        funnel=funnel(all_deals),
        follow_ups=follow_ups(conn, today),
        recent=recent(conn),
    )


@router.get("", response_model=Dashboard)
def read_dashboard(conn: DbConn, today: Today):
    return figures(conn, today)
