from rest_framework import generics, permissions
from .models import ContactMessage
from .serializers import ContactMessageSerializer
from .throttles import ContactAnonRateThrottle

class ContactMessageCreateView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ContactAnonRateThrottle]
