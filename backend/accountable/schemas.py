"""Stages, and the Pydantic models for requests and responses."""

import re
from datetime import date, datetime
from typing import Annotated, Literal, get_args

from pydantic import (
    AfterValidator,
    BaseModel,
    BeforeValidator,
    Field,
    StringConstraints,
    model_validator,
)

Stage = Literal["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]
Status = Literal["Lead", "Qualified", "Customer"]

STAGES: list[Stage] = list(get_args(Stage))
OPEN_STAGES = STAGES[:4]
USUAL_PROBABILITY = {
    "New": 10,
    "Qualified": 25,
    "Proposal": 50,
    "Negotiation": 75,
    "Won": 100,
    "Lost": 0,
}


def blank_to_none(value):
    """Treat an empty or whitespace-only string as missing."""
    if isinstance(value, str) and not value.strip():
        return None
    return value


Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Optional = Annotated[str | None, BeforeValidator(blank_to_none)]


def looks_like_email(value: str | None) -> str | None:
    """Accept something@domain.tld, nothing stricter."""
    if value is not None and not re.fullmatch(
        r"[^@\s]+@[^@\s]+\.[^@\s]+", value.strip()
    ):
        raise ValueError("Doesn't look like an email address")
    return value and value.strip()


Email = Annotated[
    str | None, BeforeValidator(blank_to_none), AfterValidator(looks_like_email)
]


class Record(BaseModel):
    """Fields every stored record has."""

    id: int
    created_at: datetime
    updated_at: datetime


class OrganizationIn(BaseModel):
    name: Name
    website: Optional = None
    industry: Optional = None
    notes: Optional = None


class OrganizationOut(Record, OrganizationIn):
    contact_count: int = 0
    open_deal_value: int = 0


class ContactIn(BaseModel):
    name: Name
    email: Email = None
    phone: Optional = None
    job_title: Optional = None
    organization_id: int | None = None
    status: Status = "Lead"


class ContactOut(Record, ContactIn):
    organization_name: str | None = None


class DealFields(BaseModel):
    name: Name
    organization_id: int | None = None
    contact_id: int | None = None
    stage: Stage = "New"
    value: int = Field(0, ge=0)


class DealIn(DealFields):
    probability: int | None = Field(None, ge=0, le=100)
    close_date: date | None = None


class DealOut(Record, DealFields):
    probability: int
    close_date: date
    position: int
    organization_name: str | None = None
    contact_name: str | None = None


class ActivityIn(BaseModel):
    type: Literal["note", "call", "email"]
    contact_id: int | None = None
    deal_id: int | None = None
    description: Name
    happened_at: datetime
    follow_up_date: date | None = None
    done: bool = False

    @model_validator(mode="after")
    def one_record(self):
        """An activity is logged on exactly one contact or one deal."""
        if (self.contact_id is None) == (self.deal_id is None):
            raise ValueError("Log it on one contact or one deal")
        return self


class ActivityOut(Record):
    type: Literal["note", "call", "email", "auto"]
    contact_id: int | None
    deal_id: int | None
    description: str
    happened_at: datetime
    follow_up_date: date | None
    done: bool
    contact_name: str | None = None
    deal_name: str | None = None


class DoneIn(BaseModel):
    done: bool


class MoveIn(BaseModel):
    stage: Stage
    index: int = Field(ge=0)


class OrganizationDetail(OrganizationOut):
    contacts: list[ContactOut]
    deals: list[DealOut]


class ContactDetail(ContactOut):
    deals: list[DealOut]
    timeline: list[ActivityOut]


class DealDetail(DealOut):
    timeline: list[ActivityOut]


class RecordLink(BaseModel):
    kind: Literal["contact", "deal"]
    id: int
    name: str


class StageFigures(BaseModel):
    stage: Stage
    count: int
    value: int
    expected: float


class OpenFigures(BaseModel):
    value: int
    expected: float
    count: int
    late: int
    stages: list[StageFigures]


class FunnelStep(BaseModel):
    stage: Stage
    value: int


class FollowUp(BaseModel):
    activity_id: int
    description: str
    follow_up_date: date
    overdue: bool
    record: RecordLink


class RecentEntry(ActivityOut):
    record: RecordLink


class Dashboard(BaseModel):
    months: list[str]
    revenue_won: list[int]
    won: list[int]
    lost: list[int]
    win_rate: int | None
    open: OpenFigures
    funnel: list[FunnelStep]
    follow_ups: list[FollowUp]
    recent: list[RecentEntry]
