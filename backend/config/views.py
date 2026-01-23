from django.conf import settings
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
        return Response({"ok": True})
