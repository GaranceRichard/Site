from __future__ import annotations

import os

# Defaults to production when imported explicitly.
os.environ.setdefault("DJANGO_ENV", "production")

from .base import *  # noqa: F401,F403
