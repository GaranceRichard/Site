from __future__ import annotations

from threading import local

_request_local = local()


def set_request_id(request_id: str) -> None:
    _request_local.request_id = request_id


def get_request_id() -> str | None:
    return getattr(_request_local, "request_id", None)


def clear_request_id() -> None:
    if hasattr(_request_local, "request_id"):
        delattr(_request_local, "request_id")
