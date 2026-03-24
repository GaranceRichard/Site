from django.core.cache import cache
from django.db import models
from rest_framework import generics, permissions, serializers, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse

from drf_spectacular.utils import extend_schema, inline_serializer

from .ga4 import GA4FetchError, fetch_ga4_summary, is_ga4_configured
from .image_upload import MAX_UPLOAD_BYTES, get_upload_strategy
from .models import ContactMessage, Reference
from .models import SiteSettings
from .pagination import ContactMessagePagination
from .reference_cache import (
    REFERENCE_CACHE_TTL_SECONDS,
    bump_public_references_cache_version,
    get_public_references_cache_key,
)
from .site_settings_cache import (
    SITE_SETTINGS_CACHE_TTL_SECONDS,
    bump_public_site_settings_cache_version,
    get_public_site_settings_cache_key,
)
from .stats_cache import (
    STATS_SUMMARY_CACHE_TTL_SECONDS,
    STATS_SUMMARY_LAST_SUCCESS_TTL_SECONDS,
    get_stats_summary_cache_key,
    get_stats_summary_last_success_cache_key,
)
from .serializers import (
    ContactMessageDeleteSerializer,
    ContactMessageSerializer,
    DeleteCountSerializer,
    HeaderSettingsSerializer,
    ImageUploadResponseSerializer,
    HomeHeroSettingsSerializer,
    MethodSettingsSerializer,
    PromiseSettingsSerializer,
    PublicationsSettingsSerializer,
    ReferenceImageUploadSerializer,
    ReferenceSerializer,
    SiteSettingsSerializer,
)
from .throttles import ContactAnonRateThrottle
from .text_exchange import (
    EXPORT_FILENAME,
    TEMPLATE_FILENAME,
    TextExchangeError,
    build_exchange_template,
    export_exchange_text,
    import_exchange_text,
)


class ContactMessageCreateView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ContactAnonRateThrottle]


class ContactMessageListAdminView(generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = ContactMessagePagination

    def get_queryset(self):
        qs = ContactMessage.objects.all()
        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(
                models.Q(name__icontains=q)
                | models.Q(email__icontains=q)
                | models.Q(subject__icontains=q)
            )
        sort = (self.request.query_params.get("sort") or "created_at").strip()
        direction = (self.request.query_params.get("dir") or "desc").strip().lower()
        allowed = {
            "created_at": "created_at",
            "name": "name",
            "email": "email",
            "subject": "subject",
        }
        field = allowed.get(sort, "created_at")
        prefix = "-" if direction == "desc" else ""
        order = f"{prefix}{field}"
        if field == "created_at":
            return qs.order_by(order)
        return qs.order_by(order, "-created_at")


class ContactMessageDeleteAdminView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(
        request=ContactMessageDeleteSerializer,
        responses={
            200: DeleteCountSerializer,
            400: inline_serializer(
                name="DeleteError",
                fields={"detail": serializers.CharField()},
            ),
        },
    )
    def post(self, request):
        raw_ids = request.data.get("ids", [])
        if not isinstance(raw_ids, list):
            return Response(
                {"detail": "ids must be a list."}, status=status.HTTP_400_BAD_REQUEST
            )

        ids: list[int] = []
        for item in raw_ids:
            try:
                ids.append(int(item))
            except (TypeError, ValueError):
                return Response(
                    {"detail": "ids must be integers."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if not ids:
            return Response(
                {"detail": "ids list is empty."}, status=status.HTTP_400_BAD_REQUEST
            )

        deleted, _ = ContactMessage.objects.filter(id__in=ids).delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)


class ReferenceListCreateAdminView(generics.ListCreateAPIView):
    serializer_class = ReferenceSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Reference.objects.all().order_by("order_index", "id")

    def perform_create(self, serializer):
        serializer.save()
        bump_public_references_cache_version()


class ReferenceDetailAdminView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReferenceSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Reference.objects.all()

    def perform_update(self, serializer):
        serializer.save()
        bump_public_references_cache_version()

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        bump_public_references_cache_version()


class ReferenceListPublicView(generics.ListAPIView):
    serializer_class = ReferenceSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Reference.objects.all().order_by("order_index", "id")

    def list(self, request, *args, **kwargs):
        host = request.get_host() or "default"
        cache_key = get_public_references_cache_key(host)
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload, status=status.HTTP_200_OK)

        queryset = self.get_queryset()
        payload = self.get_serializer(queryset, many=True).data
        cache.set(cache_key, payload, REFERENCE_CACHE_TTL_SECONDS)
        return Response(payload, status=status.HTTP_200_OK)


class ReferenceImageUploadAdminView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        request=ReferenceImageUploadSerializer,
        responses={
            201: ImageUploadResponseSerializer,
            400: inline_serializer(
                name="UploadError",
                fields={"detail": serializers.CharField()},
            ),
        },
    )
    def post(self, request):
        upload_strategy = get_upload_strategy()
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"detail": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST
            )

        if not (file.content_type or "").startswith("image/"):
            return Response(
                {"detail": "Format de fichier invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file.size > MAX_UPLOAD_BYTES:
            return Response(
                {"detail": "Fichier trop volumineux (max 5MB)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            image_bytes, thumb_bytes = upload_strategy.process_reference_image(file)
        except ValueError:
            return Response(
                {"detail": "Format non supporté (JPEG, PNG, WebP)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return Response(
                {"detail": "Impossible de traiter l'image."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = upload_strategy.save_reference_images(
            image_bytes=image_bytes,
            thumb_bytes=thumb_bytes,
            request=request,
        )
        return Response(payload, status=status.HTTP_201_CREATED)


class ContentExchangeTemplateAdminView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        response = HttpResponse(
            build_exchange_template(),
            content_type="application/toml; charset=utf-8",
        )
        response["Content-Disposition"] = f'attachment; filename="{TEMPLATE_FILENAME}"'
        return response


class ContentExchangeExportAdminView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        response = HttpResponse(
            export_exchange_text(),
            content_type="application/toml; charset=utf-8",
        )
        response["Content-Disposition"] = f'attachment; filename="{EXPORT_FILENAME}"'
        return response


class ContentExchangeImportAdminView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        request=inline_serializer(
            name="ContentExchangeImportRequest",
            fields={"file": serializers.FileField()},
        ),
        responses={
            200: inline_serializer(
                name="ContentExchangeImportResponse",
                fields={
                    "detail": serializers.CharField(),
                    "references_count": serializers.IntegerField(),
                    "settings": SiteSettingsSerializer(),
                },
            ),
            400: inline_serializer(
                name="ContentExchangeImportError",
                fields={"detail": serializers.CharField()},
            ),
        },
    )
    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"detail": "Aucun fichier texte fourni."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            raw_text = uploaded_file.read().decode("utf-8-sig")
        except UnicodeDecodeError:
            return Response(
                {"detail": "Le fichier doit etre encodé en UTF-8."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = import_exchange_text(raw_text)
        except TextExchangeError as exc:
            return Response(
                {"detail": exc.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except serializers.ValidationError as exc:
            return Response(
                {"detail": exc.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bump_public_site_settings_cache_version()
        bump_public_references_cache_version()
        return Response(
            {
                "detail": "Import termine.",
                **payload,
            },
            status=status.HTTP_200_OK,
        )


class SiteSettingsPublicView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses=SiteSettingsSerializer)
    def get(self, request):
        cache_key = get_public_site_settings_cache_key()
        cached_payload = cache.get(cache_key)
        if cached_payload is not None:
            return Response(cached_payload, status=status.HTTP_200_OK)

        payload = SiteSettingsSerializer(SiteSettings.get_solo()).data
        cache.set(cache_key, payload, SITE_SETTINGS_CACHE_TTL_SECONDS)
        return Response(payload, status=status.HTTP_200_OK)


class SiteSettingsAdminView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(
        request=inline_serializer(
            name="SiteSettingsUpdateRequest",
            fields={
                "header": HeaderSettingsSerializer(),
                "homeHero": HomeHeroSettingsSerializer(),
                "promise": PromiseSettingsSerializer(),
                "method": MethodSettingsSerializer(),
                "publications": PublicationsSettingsSerializer(),
            },
        ),
        responses={200: SiteSettingsSerializer},
    )
    def put(self, request):
        instance = SiteSettings.get_solo()
        serializer = SiteSettingsSerializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        bump_public_site_settings_cache_version()
        return Response(serializer.data, status=status.HTTP_200_OK)


class StatsSummaryAdminView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(
        responses={
            200: inline_serializer(
                name="StatsSummaryResponse",
                fields={
                    "configured": serializers.BooleanField(),
                    "stale": serializers.BooleanField(required=False),
                    "warning": serializers.CharField(required=False),
                    "cachedAt": serializers.CharField(required=False),
                    "data": serializers.JSONField(required=False),
                },
            )
        }
    )
    def get(self, request):
        fresh_cache_key = get_stats_summary_cache_key()
        stale_cache_key = get_stats_summary_last_success_cache_key()

        cached_payload = cache.get(fresh_cache_key)
        if cached_payload is not None:
            return Response(cached_payload, status=status.HTTP_200_OK)

        if not is_ga4_configured():
            return Response({"configured": False}, status=status.HTTP_200_OK)

        try:
            payload = {
                "configured": True,
                "stale": False,
                **fetch_ga4_summary(),
            }
        except GA4FetchError as exc:
            stale_payload = cache.get(stale_cache_key)
            if stale_payload is not None:
                return Response(
                    {
                        **stale_payload,
                        "stale": True,
                        "warning": str(exc),
                    },
                    status=status.HTTP_200_OK,
                )

            return Response(
                {
                    "configured": True,
                    "stale": True,
                    "warning": str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        cache.set(fresh_cache_key, payload, STATS_SUMMARY_CACHE_TTL_SECONDS)
        cache.set(
            stale_cache_key,
            payload,
            STATS_SUMMARY_LAST_SUCCESS_TTL_SECONDS,
        )
        return Response(payload, status=status.HTTP_200_OK)
