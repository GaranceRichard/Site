from __future__ import annotations

import os

# Defaults to development when DJANGO_ENV is missing.
os.environ.setdefault("DJANGO_ENV", "development")

from .base import *  # noqa: F401,F403
