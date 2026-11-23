"""Runs the migrations on the connection that accountable.migrate passes in."""

from alembic import context

from accountable.db import metadata

context.configure(
    connection=context.config.attributes["connection"],
    target_metadata=metadata,
    render_as_batch=True,
)
with context.begin_transaction():
    context.run_migrations()
