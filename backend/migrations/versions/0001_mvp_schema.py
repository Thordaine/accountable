"""The MVP's schema, as its metadata.create_all made it.

Revision ID: 0001
Revises:
Create Date: 2026-11-23
"""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("website", sa.String),
        sa.Column("industry", sa.String),
        sa.Column("notes", sa.Text),
        *timestamps(),
    )
    op.create_table(
        "contacts",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("email", sa.String),
        sa.Column("phone", sa.String),
        sa.Column("job_title", sa.String),
        sa.Column("organization_id", sa.Integer, sa.ForeignKey("organizations.id")),
        sa.Column("status", sa.String, nullable=False),
        *timestamps(),
    )
    op.create_index("ix_contacts_organization_id", "contacts", ["organization_id"])
    op.create_table(
        "deals",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("organization_id", sa.Integer, sa.ForeignKey("organizations.id")),
        sa.Column("contact_id", sa.Integer, sa.ForeignKey("contacts.id")),
        sa.Column("stage", sa.String, nullable=False),
        sa.Column("value", sa.Integer, nullable=False),
        sa.Column("probability", sa.Integer, nullable=False),
        sa.Column("close_date", sa.Date, nullable=False),
        sa.Column("position", sa.Integer, nullable=False),
        *timestamps(),
    )
    op.create_index("ix_deals_organization_id", "deals", ["organization_id"])
    op.create_index("ix_deals_contact_id", "deals", ["contact_id"])
    op.create_table(
        "activities",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("type", sa.String, nullable=False),
        sa.Column("contact_id", sa.Integer, sa.ForeignKey("contacts.id")),
        sa.Column("deal_id", sa.Integer, sa.ForeignKey("deals.id")),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("happened_at", sa.DateTime, nullable=False),
        sa.Column("follow_up_date", sa.Date),
        sa.Column("done", sa.Boolean, nullable=False),
        *timestamps(),
    )
    op.create_index("ix_activities_contact_id", "activities", ["contact_id"])
    op.create_index("ix_activities_deal_id", "activities", ["deal_id"])
