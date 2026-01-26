import base64
import json

from django.db import models
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ContactMessage
from .serializers import ContactMessageSerializer
from .throttles import ContactAnonRateThrottle


class ContactMessageCreateView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ContactAnonRateThrottle]


# ✅ Backoffice : accessible uniquement aux admins/staff
# ✅ Limite simple pour éviter de renvoyer des milliers d’entrées (sans pagination DRF)
class ContactMessageListAdminView(generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = ContactMessage.objects.all().order_by("-created_at")
        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(
                models.Q(name__icontains=q)
                | models.Q(email__icontains=q)
                | models.Q(subject__icontains=q)
            )
        return qs

    def list(self, request, *args, **kwargs):
        base_qs = self.get_queryset()
        qs = base_qs

        raw_limit = request.query_params.get("limit", "50")
        raw_cursor = request.query_params.get("cursor")
        direction = (request.query_params.get("direction") or "next").lower()
        try:
            limit = int(raw_limit)
        except ValueError:
            limit = 50

        limit = max(1, min(limit, 200))

        if raw_cursor and direction not in ("next", "prev"):
            return Response(
                {"detail": "direction must be 'next' or 'prev'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cursor = _decode_cursor(raw_cursor) if raw_cursor else None
        if raw_cursor and cursor is None:
            return Response(
                {"detail": "cursor is invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        total = qs.count()

        if cursor and direction == "prev":
            qs = qs.filter(_newer_than(cursor))
            qs = qs.order_by("created_at", "id")[:limit]
            results = list(qs)[::-1]
        elif cursor:
            qs = qs.filter(_older_than(cursor))
            results = list(qs.order_by("-created_at", "-id")[:limit])
        else:
            results = list(qs.order_by("-created_at", "-id")[:limit])

        next_cursor = None
        prev_cursor = None
        if results:
            first = results[0]
            last = results[-1]

            has_newer = base_qs.filter(_newer_than({"created_at": first.created_at, "id": first.id})).exists()
            if has_newer:
                prev_cursor = _encode_cursor(first)

            has_older = base_qs.filter(_older_than({"created_at": last.created_at, "id": last.id})).exists()
            if has_older:
                next_cursor = _encode_cursor(last)

        serializer = self.get_serializer(results, many=True)
        return Response(
            {
                "count": total,
                "limit": limit,
                "results": serializer.data,
                "next_cursor": next_cursor,
                "prev_cursor": prev_cursor,
            },
            status=status.HTTP_200_OK,
        )


class ContactMessageDeleteAdminView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        raw_ids = request.data.get("ids", [])
        if not isinstance(raw_ids, list):
            return Response({"detail": "ids must be a list."}, status=status.HTTP_400_BAD_REQUEST)

        ids: list[int] = []
        for item in raw_ids:
            try:
                ids.append(int(item))
            except (TypeError, ValueError):
                return Response({"detail": "ids must be integers."}, status=status.HTTP_400_BAD_REQUEST)

        if not ids:
            return Response({"detail": "ids list is empty."}, status=status.HTTP_400_BAD_REQUEST)

        deleted, _ = ContactMessage.objects.filter(id__in=ids).delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)


def _encode_cursor(msg: ContactMessage) -> str:
    payload = {"created_at": msg.created_at.isoformat(), "id": msg.id}
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii")


def _decode_cursor(value: str) -> dict | None:
    try:
        raw = base64.urlsafe_b64decode(value.encode("ascii"))
        payload = json.loads(raw.decode("utf-8"))
    except (ValueError, json.JSONDecodeError):
        return None

    dt = parse_datetime(payload.get("created_at") or "")
    if dt and timezone.is_naive(dt):
        dt = timezone.make_aware(dt)
    cid = payload.get("id")
    if not dt or not cid:
        return None
    return {"created_at": dt, "id": cid}


def _older_than(cursor: dict) -> models.Q:
    dt = cursor.get("created_at")
    cid = cursor.get("id")
    return models.Q(created_at__lt=dt) | (models.Q(created_at=dt) & models.Q(id__lt=cid))


def _newer_than(cursor: dict) -> models.Q:
    dt = cursor.get("created_at")
    cid = cursor.get("id")
    return models.Q(created_at__gt=dt) | (models.Q(created_at=dt) & models.Q(id__gt=cid))
