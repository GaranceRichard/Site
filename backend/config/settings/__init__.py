from __future__ import annotations

import os

_DJANGO_ENV = os.getenv("DJANGO_ENV", "development").strip().lower()

if _DJANGO_ENV == "production":
    from .production import *  # noqa: F401,F403
else:
    from .development import *  # noqa: F401,F403
