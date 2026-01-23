from rest_framework import generics, permissions

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
