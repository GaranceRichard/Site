import json
import logging
import sys

from django.test import SimpleTestCase

from config.logging import ProductionJsonFormatter, RequestIdFilter
from config.request_id import clear_request_id, set_request_id


class RequestIdFilterTests(SimpleTestCase):
    def tearDown(self):
        clear_request_id()

    def test_injects_current_request_id_into_record(self):
        set_request_id("req-123")
        record = logging.LogRecord(
            name="django.request",
            level=logging.ERROR,
            pathname=__file__,
            lineno=10,
            msg="failure",
            args=(),
            exc_info=None,
        )

        result = RequestIdFilter().filter(record)

        self.assertTrue(result)
        self.assertEqual(record.request_id, "req-123")

    def test_uses_dash_when_request_id_is_missing(self):
        record = logging.LogRecord(
            name="django.request",
            level=logging.ERROR,
            pathname=__file__,
            lineno=10,
            msg="failure",
            args=(),
            exc_info=None,
        )

        RequestIdFilter().filter(record)

        self.assertEqual(record.request_id, "-")


class ProductionJsonFormatterTests(SimpleTestCase):
    def tearDown(self):
        clear_request_id()

    def test_emits_expected_json_fields(self):
        formatter = ProductionJsonFormatter(
            "%(timestamp)s %(level)s %(logger)s %(message)s %(request_id)s"
        )
        record = logging.LogRecord(
            name="contact.views",
            level=logging.INFO,
            pathname=__file__,
            lineno=42,
            msg="hello world",
            args=(),
            exc_info=None,
        )
        record.request_id = "req-456"

        payload = json.loads(formatter.format(record))

        self.assertIn("timestamp", payload)
        self.assertEqual(payload["level"], "INFO")
        self.assertEqual(payload["logger"], "contact.views")
        self.assertEqual(payload["message"], "hello world")
        self.assertEqual(payload["request_id"], "req-456")

    def test_uses_default_request_id_when_missing(self):
        formatter = ProductionJsonFormatter(
            "%(timestamp)s %(level)s %(logger)s %(message)s %(request_id)s"
        )
        record = logging.LogRecord(
            name="contact.views",
            level=logging.WARNING,
            pathname=__file__,
            lineno=52,
            msg="missing request id",
            args=(),
            exc_info=None,
        )

        payload = json.loads(formatter.format(record))

        self.assertEqual(payload["request_id"], "-")

    def test_includes_exception_and_stack_info_when_present(self):
        formatter = ProductionJsonFormatter(
            "%(timestamp)s %(level)s %(logger)s %(message)s %(request_id)s"
        )
        try:
            raise ValueError("boom")
        except ValueError:
            exc_info = sys.exc_info()

        record = logging.LogRecord(
            name="contact.views",
            level=logging.ERROR,
            pathname=__file__,
            lineno=73,
            msg="failure",
            args=(),
            exc_info=exc_info,
            func="test_includes_exception_and_stack_info_when_present",
            sinfo="Stack (most recent call last):\n  fake frame",
        )

        payload = json.loads(formatter.format(record))

        self.assertIn("exc_info", payload)
        self.assertIn("ValueError: boom", payload["exc_info"])
        self.assertIn("stack_info", payload)
        self.assertIn("fake frame", payload["stack_info"])
