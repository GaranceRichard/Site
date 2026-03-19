from __future__ import annotations

import sys
import types
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from django.test.utils import override_settings

from contact import ga4


def _make_row(dimensions: list[str], metrics: list[str]):
    return SimpleNamespace(
        dimension_values=[SimpleNamespace(value=value) for value in dimensions],
        metric_values=[SimpleNamespace(value=value) for value in metrics],
    )


class FakeTypesModule:
    class DateRange:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class Dimension:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class Metric:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class FilterExpression:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class Filter:
        class StringFilter:
            def __init__(self, **kwargs):
                self.kwargs = kwargs

        class InListFilter:
            def __init__(self, **kwargs):
                self.kwargs = kwargs

        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class OrderBy:
        class DimensionOrderBy:
            def __init__(self, **kwargs):
                self.kwargs = kwargs

        class MetricOrderBy:
            def __init__(self, **kwargs):
                self.kwargs = kwargs

        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class RunReportRequest:
        def __init__(self, **kwargs):
            self.kwargs = kwargs


class GA4ConfigTests(SimpleTestCase):
    @override_settings(GA4_PROPERTY_ID="", GA4_SERVICE_ACCOUNT_KEY_JSON="")
    def test_get_ga4_config_returns_none_when_missing(self):
        self.assertIsNone(ga4._get_ga4_config())
        self.assertFalse(ga4.is_ga4_configured())

    @override_settings(
        GA4_PROPERTY_ID=" 123456 ",
        GA4_SERVICE_ACCOUNT_KEY_JSON=' {"client_email":"bot@example.com"} ',
    )
    def test_get_ga4_config_returns_trimmed_values(self):
        config = ga4._get_ga4_config()

        self.assertIsNotNone(config)
        self.assertEqual(config.property_id, "123456")
        self.assertEqual(
            config.service_account_key_json, '{"client_email":"bot@example.com"}'
        )
        self.assertTrue(ga4.is_ga4_configured())


class GA4BuildClientTests(SimpleTestCase):
    @patch.dict(sys.modules, {}, clear=True)
    def test_build_client_raises_when_sdk_is_missing(self):
        with self.assertRaisesMessage(
            ga4.GA4FetchError,
            "Le SDK google-analytics-data n'est pas installe sur le backend.",
        ):
            ga4._build_ga4_client('{"client_email":"bot@example.com"}')

    def test_build_client_raises_when_json_is_invalid(self):
        google_module = types.ModuleType("google")
        analytics_module = types.ModuleType("google.analytics")
        data_module = types.ModuleType("google.analytics.data_v1beta")
        data_module.BetaAnalyticsDataClient = object
        data_module.types = object()
        oauth2_module = types.ModuleType("google.oauth2")
        service_account_module = types.ModuleType("google.oauth2.service_account")

        class FakeCredentials:
            @staticmethod
            def from_service_account_info(info, scopes):
                return {"info": info, "scopes": scopes}

        service_account_module.Credentials = FakeCredentials

        with patch.dict(
            sys.modules,
            {
                "google": google_module,
                "google.analytics": analytics_module,
                "google.analytics.data_v1beta": data_module,
                "google.oauth2": oauth2_module,
                "google.oauth2.service_account": service_account_module,
            },
        ):
            with self.assertRaisesMessage(
                ga4.GA4FetchError,
                "La variable GA4_SERVICE_ACCOUNT_KEY_JSON n'est pas un JSON valide.",
            ):
                ga4._build_ga4_client("{bad json")

    def test_build_client_returns_client_and_types(self):
        google_module = types.ModuleType("google")
        analytics_module = types.ModuleType("google.analytics")
        data_module = types.ModuleType("google.analytics.data_v1beta")
        oauth2_module = types.ModuleType("google.oauth2")
        service_account_module = types.ModuleType("google.oauth2.service_account")

        fake_types = object()

        class FakeClient:
            def __init__(self, credentials):
                self.credentials = credentials

        class FakeCredentials:
            @staticmethod
            def from_service_account_info(info, scopes):
                return {"info": info, "scopes": scopes}

        data_module.BetaAnalyticsDataClient = FakeClient
        data_module.types = fake_types
        service_account_module.Credentials = FakeCredentials

        with patch.dict(
            sys.modules,
            {
                "google": google_module,
                "google.analytics": analytics_module,
                "google.analytics.data_v1beta": data_module,
                "google.oauth2": oauth2_module,
                "google.oauth2.service_account": service_account_module,
            },
        ):
            client, returned_types = ga4._build_ga4_client(
                '{"client_email":"bot@example.com"}'
            )

        self.assertEqual(client.credentials["info"]["client_email"], "bot@example.com")
        self.assertEqual(
            client.credentials["scopes"],
            ["https://www.googleapis.com/auth/analytics.readonly"],
        )
        self.assertIs(returned_types, fake_types)


class GA4ReportTests(SimpleTestCase):
    def test_build_event_name_filter_for_single_event(self):
        filter_expression = ga4._build_event_name_filter(FakeTypesModule, ["cta_click"])

        self.assertEqual(
            filter_expression.kwargs["filter"].kwargs["field_name"], "eventName"
        )
        self.assertEqual(
            filter_expression.kwargs["filter"].kwargs["string_filter"].kwargs["value"],
            "cta_click",
        )

    def test_build_event_name_filter_for_multiple_events(self):
        filter_expression = ga4._build_event_name_filter(
            FakeTypesModule,
            ["contact_form_attempt", "contact_form_success"],
        )

        self.assertEqual(
            filter_expression.kwargs["filter"]
            .kwargs["in_list_filter"]
            .kwargs["values"],
            ["contact_form_attempt", "contact_form_success"],
        )

    def test_run_report_builds_request_with_dimension_order(self):
        client = Mock()
        expected_response = object()
        client.run_report.return_value = expected_response

        result = ga4._run_report(
            client=client,
            types_module=FakeTypesModule,
            property_name="properties/123",
            dimensions=["date"],
            metrics=["activeUsers"],
            event_names=["cta_click"],
            order_by_dimension="date",
            limit=10,
        )

        self.assertIs(result, expected_response)
        request = client.run_report.call_args.args[0]
        self.assertEqual(request.kwargs["property"], "properties/123")
        self.assertEqual(request.kwargs["limit"], 10)
        self.assertIn("dimension_filter", request.kwargs)
        self.assertEqual(
            request.kwargs["order_bys"][0].kwargs["dimension"].kwargs["dimension_name"],
            "date",
        )

    def test_run_report_builds_request_with_metric_order(self):
        client = Mock()
        client.run_report.return_value = "ok"

        ga4._run_report(
            client=client,
            types_module=FakeTypesModule,
            property_name="properties/123",
            dimensions=["eventName"],
            metrics=["eventCount"],
            order_by_metric="eventCount",
        )

        request = client.run_report.call_args.args[0]
        self.assertEqual(
            request.kwargs["order_bys"][0].kwargs["metric"].kwargs["metric_name"],
            "eventCount",
        )
        self.assertTrue(request.kwargs["order_bys"][0].kwargs["desc"])

    def test_run_report_wraps_client_errors(self):
        client = Mock()
        client.run_report.side_effect = RuntimeError("boom")

        with self.assertRaisesMessage(
            ga4.GA4FetchError,
            "L'API Google Analytics a retourne une erreur.",
        ):
            ga4._run_report(
                client=client,
                types_module=FakeTypesModule,
                property_name="properties/123",
                dimensions=["date"],
                metrics=["activeUsers"],
            )


class GA4SerializationTests(SimpleTestCase):
    def test_serialize_trend_rows(self):
        rows = [
            _make_row(["20260318"], ["4"]),
            _make_row(["20260319"], ["0"]),
        ]

        self.assertEqual(
            ga4._serialize_trend_rows(rows),
            [
                {"date": "2026-03-18", "value": 4},
                {"date": "2026-03-19", "value": 0},
            ],
        )

    def test_serialize_cta_rows_groups_and_sorts(self):
        rows = [
            _make_row(["Contact", "hero"], ["2"]),
            _make_row(["Contact", "hero"], ["3"]),
            _make_row(["", ""], ["1"]),
        ]

        self.assertEqual(
            ga4._serialize_cta_rows(rows),
            [
                {"label": "Contact", "location": "hero", "clicks": 5},
                {"label": "Sans libelle", "location": "inconnu", "clicks": 1},
            ],
        )

    def test_serialize_reference_rows_groups_and_sorts(self):
        rows = [
            _make_row(["Beneva"], ["2"]),
            _make_row(["Beneva"], ["1"]),
            _make_row([""], ["4"]),
        ]

        self.assertEqual(
            ga4._serialize_reference_rows(rows),
            [
                {"name": "Reference inconnue", "opens": 4},
                {"name": "Beneva", "opens": 3},
            ],
        )

    def test_serialize_form_rows_with_completion_rate(self):
        rows = [
            _make_row(["contact_form_attempt"], ["5"]),
            _make_row(["contact_form_success"], ["4"]),
            _make_row(["other"], ["99"]),
        ]

        self.assertEqual(
            ga4._serialize_form_rows(rows),
            {"attempts": 5, "successes": 4, "completionRate": 80.0},
        )

    def test_serialize_form_rows_without_attempts(self):
        self.assertEqual(
            ga4._serialize_form_rows([]),
            {"attempts": 0, "successes": 0, "completionRate": 0.0},
        )

    @patch("contact.ga4.datetime")
    def test_utc_now_returns_isoformat_without_microseconds(self, datetime_mock):
        fake_now = Mock()
        fake_without_microseconds = Mock()
        fake_without_microseconds.isoformat.return_value = "2026-03-19T12:00:00+00:00"
        fake_now.replace.return_value = fake_without_microseconds
        datetime_mock.now.return_value = fake_now

        self.assertEqual(ga4._utc_now(), "2026-03-19T12:00:00+00:00")
        datetime_mock.now.assert_called_once_with(ga4.UTC)
        fake_now.replace.assert_called_once_with(microsecond=0)


class GA4FetchSummaryTests(SimpleTestCase):
    @override_settings(GA4_PROPERTY_ID="", GA4_SERVICE_ACCOUNT_KEY_JSON="")
    def test_fetch_summary_requires_configuration(self):
        with self.assertRaisesMessage(
            ga4.GA4FetchError,
            "Google Analytics non configure.",
        ):
            ga4.fetch_ga4_summary()

    @override_settings(
        GA4_PROPERTY_ID="123456",
        GA4_SERVICE_ACCOUNT_KEY_JSON='{"client_email":"bot@example.com"}',
    )
    @patch("contact.ga4._utc_now", return_value="2026-03-19T12:00:00+00:00")
    @patch("contact.ga4._run_report")
    @patch("contact.ga4._build_ga4_client")
    def test_fetch_summary_aggregates_all_reports(
        self,
        build_client_mock,
        run_report_mock,
        utc_now_mock,
    ):
        build_client_mock.return_value = ("client", "types")
        run_report_mock.side_effect = [
            SimpleNamespace(
                rows=[
                    _make_row(["20260318"], ["3"]),
                    _make_row(["20260319"], ["5"]),
                ]
            ),
            SimpleNamespace(
                rows=[
                    _make_row(["Contact", "hero"], ["4"]),
                    _make_row(["Echanger", "footer"], ["2"]),
                    _make_row(["Contact", "nav"], ["1"]),
                    _make_row(["Extra", "hero"], ["9"]),
                ]
            ),
            SimpleNamespace(
                rows=[
                    _make_row(["Beneva"], ["2"]),
                    _make_row(["Castas"], ["4"]),
                    _make_row(["FASST"], ["1"]),
                    _make_row(["Autre"], ["9"]),
                ]
            ),
            SimpleNamespace(
                rows=[
                    _make_row(["contact_form_attempt"], ["10"]),
                    _make_row(["contact_form_success"], ["7"]),
                ]
            ),
        ]

        payload = ga4.fetch_ga4_summary()

        self.assertEqual(payload["cachedAt"], "2026-03-19T12:00:00+00:00")
        self.assertEqual(payload["data"]["visitors30d"]["total"], 8)
        self.assertEqual(len(payload["data"]["topCtas"]), 3)
        self.assertEqual(payload["data"]["topCtas"][0]["label"], "Extra")
        self.assertEqual(len(payload["data"]["topReferences"]), 3)
        self.assertEqual(payload["data"]["topReferences"][0]["name"], "Autre")
        self.assertEqual(
            payload["data"]["contactFormCompletion"],
            {"attempts": 10, "successes": 7, "completionRate": 70.0},
        )
        self.assertEqual(run_report_mock.call_count, 4)
        utc_now_mock.assert_called_once()
