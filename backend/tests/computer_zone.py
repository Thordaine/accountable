"""Run code as if the computer were in another time zone."""

import os
import time
from contextlib import contextmanager


@contextmanager
def computer_zone(name: str):
    """Set the computer's own time zone to name for the block."""
    before = os.environ.get("TZ")
    os.environ["TZ"] = name
    time.tzset()
    try:
        yield
    finally:
        if before is None:
            del os.environ["TZ"]
        else:
            os.environ["TZ"] = before
        time.tzset()
