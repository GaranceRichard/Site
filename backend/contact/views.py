from django.core.cache import cache
from django.db import models
from rest_framework import generics, permissions, serializers, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema, inline_serializer

from .image_upload import MAX_UPLOAD_BYTES, get_upload_strategy
from .models import ContactMessage, Reference
from .pagination import ContactMessagePagination
from .reference_cache import (
    REFERENCE_CACHE_TTL_SECONDS,
    bump_public_references_cache_version,
    get_public_references_cache_key,
)
from .serializers import (
    ContactMessageDeleteSerializer,
    ContactMessageSerializer,
    DeleteCountSerializer,
    ImageUploadResponseSerializer,
    ReferenceImageUploadSerializer,
    ReferenceSerializer,
)
from .throttles import ContactAnonRateThrottle


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
