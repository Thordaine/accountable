"""Who added and last changed each row; times in UTC.

Rows already there were the sample data or added by the only person using the
local file, so they get "Sample data". Their times were the computer's own,
so they are converted to UTC.

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-23
"""

from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

TIMES = {
    "organizations": ["created_at", "updated_at"],
    "contacts": ["created_at", "updated_at"],
    "deals": ["created_at", "updated_at"],
    "activities": ["happened_at", "created_at", "updated_at"],
}
WHO = ["created_by", "updated_by"]


def upgrade() -> None:
    for name, times in TIMES.items():
        with op.batch_alter_table(name) as batch:
            for column in WHO:
                batch.add_column(sa.Column(column, sa.String))
        table = sa.table(
            name,
            sa.column("id"),
            *(sa.column(t, sa.DateTime) for t in times),
            *(sa.column(w, sa.String) for w in WHO),
        )
        op.execute(
            table.update().values(created_by="Sample data", updated_by="Sample data")
        )
        to_utc(table, times)
        with op.batch_alter_table(name) as batch:
            for column in WHO:
                batch.alter_column(column, existing_type=sa.String, nullable=False)


def to_utc(table: sa.TableClause, times: list[str]) -> None:
    """Convert each row's times from the computer's own zone to UTC."""
    conn = op.get_bind()
    rows = conn.execute(sa.select(table.c.id, *(table.c[t] for t in times))).all()
    if not rows:
        return
    changes = [
        {"row_id": row.id} | {t: utc(getattr(row, t)) for t in times} for row in rows
    ]
    conn.execute(
        table.update()
        .where(table.c.id == sa.bindparam("row_id"))
        .values({t: sa.bindparam(t) for t in times}),
        changes,
    )


def utc(local: datetime) -> datetime:
    """A naive local time as a naive UTC one."""
    return local.astimezone(UTC).replace(tzinfo=None)
