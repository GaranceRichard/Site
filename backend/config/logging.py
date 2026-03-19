from __future__ import annotations

import json
import logging

try:
    from pythonjsonlogger.jsonlogger import JsonFormatter as BaseJsonFormatter
except ModuleNotFoundError:  # pragma: no cover - exercised when dependency is absent
    BaseJsonFormatter = logging.Formatter

from .request_id import get_request_id


class RequestIdFilter:
    def filter(self, record) -> bool:
        record.request_id = get_request_id() or "-"
        return True


class ProductionJsonFormatter(BaseJsonFormatter):
    """
    Keep a stable JSON schema for log aggregators.
    """

    def format(self, record) -> str:
        payload = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, "request_id", "-"),
        }
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        if record.stack_info:
            payload["stack_info"] = self.formatStack(record.stack_info)
        return json.dumps(payload, ensure_ascii=True)
