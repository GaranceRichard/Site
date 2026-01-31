from django.conf import settings
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import models
from io import BytesIO
from rest_framework import generics, permissions, serializers, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from uuid import uuid4

from drf_spectacular.utils import extend_schema, inline_serializer

from PIL import Image

from .models import ContactMessage, Reference
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


# ✅ Backoffice : accessible uniquement aux admins/staff
# ✅ Limite simple pour éviter de renvoyer des milliers d’entrées (sans pagination DRF)
class ContactMessageListAdminView(generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAdminUser]

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

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()

        raw_limit = request.query_params.get("limit", "50")
        raw_page = request.query_params.get("page", "1")
        try:
            limit = int(raw_limit)
        except ValueError:
            limit = 50
        try:
            page = int(raw_page)
        except ValueError:
            page = 1

        limit = max(1, min(limit, 200))
        page = max(1, page)

        total = qs.count()
        start = (page - 1) * limit
        end = start + limit

        serializer = self.get_serializer(qs[start:end], many=True)
        return Response(
            {
                "count": total,
                "page": page,
                "limit": limit,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


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


class ReferenceListCreateAdminView(generics.ListCreateAPIView):
    serializer_class = ReferenceSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Reference.objects.all().order_by("order_index", "id")


class ReferenceDetailAdminView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReferenceSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Reference.objects.all()


class ReferenceListPublicView(generics.ListAPIView):
    serializer_class = ReferenceSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Reference.objects.all().order_by("order_index", "id")


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
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)

        if not (file.content_type or "").startswith("image/"):
            return Response({"detail": "Format de fichier invalide."}, status=status.HTTP_400_BAD_REQUEST)

        max_bytes = 5 * 1024 * 1024
        if file.size > max_bytes:
            return Response({"detail": "Fichier trop volumineux (max 5MB)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            image = Image.open(file)
            if image.format not in ("JPEG", "PNG", "WEBP"):
                return Response({"detail": "Format non supporté (JPEG, PNG, WebP)."}, status=status.HTTP_400_BAD_REQUEST)
            has_alpha = "A" in image.getbands() or image.mode in ("RGBA", "LA", "PA")
            image = image.convert("RGBA" if has_alpha else "RGB")
            image.thumbnail((1920, 1080), Image.LANCZOS)

            buffer = BytesIO()
            if has_alpha:
                image.save(buffer, format="WEBP", quality=85, method=6)
            else:
                image.save(buffer, format="WEBP", quality=85, method=6)
            buffer.seek(0)

            thumb = image.copy()
            thumb.thumbnail((640, 360), Image.LANCZOS)
            thumb_buf = BytesIO()
            if has_alpha:
                thumb.save(thumb_buf, format="WEBP", quality=85, method=6)
            else:
                thumb.save(thumb_buf, format="WEBP", quality=85, method=6)
            thumb_buf.seek(0)
        except Exception:
            return Response({"detail": "Impossible de traiter l'image."}, status=status.HTTP_400_BAD_REQUEST)

        filename = f"references/{uuid4().hex}.webp"
        saved_path = default_storage.save(filename, ContentFile(buffer.read()))
        url = request.build_absolute_uri(f"{settings.MEDIA_URL}{saved_path}")

        thumb_name = f"references/thumbs/{uuid4().hex}.webp"
        thumb_path = default_storage.save(thumb_name, ContentFile(thumb_buf.read()))
        thumb_url = request.build_absolute_uri(f"{settings.MEDIA_URL}{thumb_path}")

        return Response({"url": url, "thumbnail_url": thumb_url}, status=status.HTTP_201_CREATED)
