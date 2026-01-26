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

        raw = self.request.query_params.get("limit", "200")
        try:
            limit = int(raw)
        except ValueError:
            limit = 200

        limit = max(1, min(limit, 500))  # borne 1..500
        return qs[:limit]


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
