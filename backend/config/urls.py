from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from config.views import HealthView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/contact/", include("contact.urls")),

    # ✅ Health check (DRF) — utile prod + tests throttling
    path("api/health", HealthView.as_view(), name="api-health"),

    # ✅ Auth JWT (login admin via username/password Django)
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
