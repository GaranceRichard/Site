from django.conf import settings
from django.db import connection
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle


class HealthAnonThrottle(AnonRateThrottle):
    # ✅ rate déterminé par un setting Django (pas par REST_FRAMEWORK)
    def get_rate(self):
        return getattr(settings, "HEALTH_THROTTLE_RATE", "60/min")


class HealthView(APIView):
    authentication_classes = ()
    permission_classes = ()
    throttle_classes = [HealthAnonThrottle]

    def get(self, request):
        status = _check_dependencies()
        http_status = 200 if status["ok"] else 503
        return Response(status, status=http_status)


class HealthLiveView(APIView):
    authentication_classes = ()
    permission_classes = ()
    throttle_classes = [HealthAnonThrottle]

    def get(self, request):
        return Response({"ok": True, "live": True}, status=200)


class HealthReadyView(APIView):
    authentication_classes = ()
    permission_classes = ()
    throttle_classes = [HealthAnonThrottle]

    def get(self, request):
        status = _check_dependencies()
        status["ready"] = status["ok"]
        http_status = 200 if status["ok"] else 503
        return Response(status, status=http_status)


def _check_dependencies() -> dict:
    status = {"ok": True}

    # DB check
    db_ok = True
    db_error = ""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception as exc:  # pragma: no cover - defensive
        db_ok = False
        db_error = str(exc)
        status["ok"] = False
    status["db"] = {"ok": db_ok, **({"error": db_error} if db_error else {})}

    # Redis check (only if configured)
    redis_url = getattr(settings, "REDIS_URL", "") or ""
    if redis_url:
        redis_ok = True
        redis_error = ""
        try:
            import redis  # lazy import to avoid hard dependency in minimal envs

            client = redis.Redis.from_url(redis_url, socket_connect_timeout=1, socket_timeout=1)
            client.ping()
        except Exception as exc:  # pragma: no cover - defensive
            redis_ok = False
            redis_error = str(exc)
            status["ok"] = False
        status["redis"] = {
            "ok": redis_ok,
            **({"error": redis_error} if redis_error else {}),
        }
    else:
        status["redis"] = {"ok": True, "skipped": True}

    return status
