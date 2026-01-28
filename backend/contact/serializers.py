from rest_framework import serializers
from django.conf import settings
from django.core.files.storage import default_storage
from django.db import models
from urllib.parse import urlparse

from .models import ContactMessage, Reference


class ContactMessageSerializer(serializers.ModelSerializer):
    def validate_consent(self, value: bool) -> bool:
        if value is not True:
            raise serializers.ValidationError("Le consentement est obligatoire.")
        return value

    class Meta:
        model = ContactMessage
        fields = "__all__"


class ReferenceSerializer(serializers.ModelSerializer):
    tasks = serializers.ListField(child=serializers.CharField(), required=False)
    actions = serializers.ListField(child=serializers.CharField(), required=False)
    results = serializers.ListField(child=serializers.CharField(), required=False)
    order_index = serializers.IntegerField(required=False)

    class Meta:
        model = Reference
        fields = [
            "id",
            "reference",
            "reference_short",
            "order_index",
            "image",
            "icon",
            "situation",
            "tasks",
            "actions",
            "results",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        if validated_data.get("order_index") in (None, 0):
            last = Reference.objects.aggregate(models.Max("order_index")).get("order_index__max")
            validated_data["order_index"] = (last or 0) + 1
        return super().create(validated_data)

    def update(self, instance, validated_data):
        def media_relative_path(url: str) -> str | None:
            if not url:
                return None
            parsed = urlparse(url)
            path = parsed.path or ""
            if not path:
                return None
            media_url = settings.MEDIA_URL or "/media/"
            media_path = urlparse(media_url).path or media_url
            if not media_path.endswith("/"):
                media_path = f"{media_path}/"
            if not path.startswith(media_path):
                return None
            rel_path = path[len(media_path) :]
            return rel_path or None

        if "image" in validated_data:
            new_image = (validated_data.get("image") or "").strip()
            old_image = (instance.image or "").strip()
            if new_image != old_image:
                rel_path = media_relative_path(old_image)
                if rel_path:
                    default_storage.delete(rel_path)

        if "icon" in validated_data:
            new_icon = (validated_data.get("icon") or "").strip()
            old_icon = (instance.icon or "").strip()
            if new_icon != old_icon:
                rel_path = media_relative_path(old_icon)
                if rel_path:
                    default_storage.delete(rel_path)

        return super().update(instance, validated_data)
