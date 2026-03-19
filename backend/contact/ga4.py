from __future__ import annotations

import json
from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime

from django.conf import settings


class GA4FetchError(Exception):
    pass


@dataclass(frozen=True)
class GA4Config:
    property_id: str
    service_account_key_json: str


def is_ga4_configured() -> bool:
    return _get_ga4_config() is not None


def fetch_ga4_summary() -> dict:
    config = _get_ga4_config()
    if config is None:
        raise GA4FetchError("Google Analytics non configure.")

    client, types_module = _build_ga4_client(config.service_account_key_json)
    property_name = f"properties/{config.property_id}"

    visitors_response = _run_report(
        client=client,
        types_module=types_module,
        property_name=property_name,
        dimensions=["date"],
        metrics=["activeUsers"],
        order_by_dimension="date",
    )
    cta_response = _run_report(
        client=client,
        types_module=types_module,
        property_name=property_name,
        dimensions=["customEvent:cta_label", "customEvent:cta_location"],
        metrics=["eventCount"],
        event_names=["cta_click"],
        order_by_metric="eventCount",
        limit=10,
    )
    references_response = _run_report(
        client=client,
        types_module=types_module,
        property_name=property_name,
        dimensions=["customEvent:reference_name"],
        metrics=["eventCount"],
        event_names=["reference_open"],
        order_by_metric="eventCount",
        limit=10,
    )
    form_response = _run_report(
        client=client,
        types_module=types_module,
        property_name=property_name,
        dimensions=["eventName"],
        metrics=["eventCount"],
        event_names=["contact_form_attempt", "contact_form_success"],
    )

    trend = _serialize_trend_rows(visitors_response.rows)
    ctas = _serialize_cta_rows(cta_response.rows)
    references = _serialize_reference_rows(references_response.rows)
    form_metrics = _serialize_form_rows(form_response.rows)

    return {
        "cachedAt": _utc_now(),
        "data": {
            "visitors30d": {
                "total": sum(item["value"] for item in trend),
                "trend": trend,
            },
            "topCtas": ctas[:3],
            "topReferences": references[:3],
            "contactFormCompletion": form_metrics,
        },
    }


def _get_ga4_config() -> GA4Config | None:
    property_id = str(getattr(settings, "GA4_PROPERTY_ID", "") or "").strip()
    service_account_key_json = str(
        getattr(settings, "GA4_SERVICE_ACCOUNT_KEY_JSON", "") or ""
    ).strip()
    if not property_id or not service_account_key_json:
        return None
    return GA4Config(
        property_id=property_id,
        service_account_key_json=service_account_key_json,
    )


def _build_ga4_client(service_account_key_json: str):
    try:
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.analytics.data_v1beta import types as ga_types
        from google.oauth2 import service_account
    except ImportError as exc:  # pragma: no cover - depends on environment
        raise GA4FetchError(
            "Le SDK google-analytics-data n'est pas installe sur le backend."
        ) from exc

    try:
        credentials_info = json.loads(service_account_key_json)
    except json.JSONDecodeError as exc:
        raise GA4FetchError(
            "La variable GA4_SERVICE_ACCOUNT_KEY_JSON n'est pas un JSON valide."
        ) from exc

    credentials = service_account.Credentials.from_service_account_info(
        credentials_info,
        scopes=["https://www.googleapis.com/auth/analytics.readonly"],
    )
    return BetaAnalyticsDataClient(credentials=credentials), ga_types


def _run_report(
    *,
    client,
    types_module,
    property_name: str,
    dimensions: list[str],
    metrics: list[str],
    event_names: list[str] | None = None,
    order_by_dimension: str | None = None,
    order_by_metric: str | None = None,
    limit: int | None = None,
):
    request_kwargs = {
        "property": property_name,
        "date_ranges": [
            types_module.DateRange(start_date="29daysAgo", end_date="today")
        ],
        "dimensions": [types_module.Dimension(name=name) for name in dimensions],
        "metrics": [types_module.Metric(name=name) for name in metrics],
    }

    if event_names:
        request_kwargs["dimension_filter"] = _build_event_name_filter(
            types_module, event_names
        )

    if order_by_dimension:
        request_kwargs["order_bys"] = [
            types_module.OrderBy(
                dimension=types_module.OrderBy.DimensionOrderBy(
                    dimension_name=order_by_dimension
                )
            )
        ]
    elif order_by_metric:
        request_kwargs["order_bys"] = [
            types_module.OrderBy(
                metric=types_module.OrderBy.MetricOrderBy(metric_name=order_by_metric),
                desc=True,
            )
        ]

    if limit is not None:
        request_kwargs["limit"] = limit

    try:
        request = types_module.RunReportRequest(**request_kwargs)
        return client.run_report(request)
    except Exception as exc:  # pragma: no cover - defensive
        raise GA4FetchError("L'API Google Analytics a retourne une erreur.") from exc


def _build_event_name_filter(types_module, event_names: list[str]):
    if len(event_names) == 1:
        return types_module.FilterExpression(
            filter=types_module.Filter(
                field_name="eventName",
                string_filter=types_module.Filter.StringFilter(value=event_names[0]),
            )
        )

    return types_module.FilterExpression(
        filter=types_module.Filter(
            field_name="eventName",
            in_list_filter=types_module.Filter.InListFilter(values=event_names),
        )
    )


def _serialize_trend_rows(rows) -> list[dict]:
    trend: list[dict] = []
    for row in rows:
        raw_date = row.dimension_values[0].value
        trend.append(
            {
                "date": datetime.strptime(raw_date, "%Y%m%d").date().isoformat(),
                "value": int(row.metric_values[0].value or 0),
            }
        )
    return trend


def _serialize_cta_rows(rows) -> list[dict]:
    grouped: dict[tuple[str, str], int] = defaultdict(int)
    for row in rows:
        label = (row.dimension_values[0].value or "").strip() or "Sans libelle"
        location = (row.dimension_values[1].value or "").strip() or "inconnu"
        grouped[(label, location)] += int(row.metric_values[0].value or 0)

    items = [
        {"label": label, "location": location, "clicks": clicks}
        for (label, location), clicks in grouped.items()
    ]
    return sorted(items, key=lambda item: item["clicks"], reverse=True)


def _serialize_reference_rows(rows) -> list[dict]:
    grouped: dict[str, int] = defaultdict(int)
    for row in rows:
        name = (row.dimension_values[0].value or "").strip() or "Reference inconnue"
        grouped[name] += int(row.metric_values[0].value or 0)

    items = [{"name": name, "opens": opens} for name, opens in grouped.items()]
    return sorted(items, key=lambda item: item["opens"], reverse=True)


def _serialize_form_rows(rows) -> dict:
    attempts = 0
    successes = 0
    for row in rows:
        event_name = row.dimension_values[0].value
        value = int(row.metric_values[0].value or 0)
        if event_name == "contact_form_attempt":
            attempts += value
        elif event_name == "contact_form_success":
            successes += value

    completion_rate = round((successes / attempts) * 100, 1) if attempts else 0.0
    return {
        "attempts": attempts,
        "successes": successes,
        "completionRate": completion_rate,
    }


def _utc_now() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat()
