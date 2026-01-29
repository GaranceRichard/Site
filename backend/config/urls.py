from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from config.views import HealthLiveView, HealthReadyView, HealthView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/contact/", include("contact.urls")),

    # ✅ Health check (DRF) — utile prod + tests throttling
    path("api/health", HealthView.as_view(), name="api-health"),
    path("api/health/live", HealthLiveView.as_view(), name="api-health-live"),
    path("api/health/ready", HealthReadyView.as_view(), name="api-health-ready"),
]

if settings.ENABLE_JWT:
    from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

    urlpatterns += [
        # ✅ Auth JWT (login admin via username/password Django)
        path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
        path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
