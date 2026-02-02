from rest_framework import serializers
from django.conf import settings
from django.core.files.storage import default_storage
from django.db import models

from .media_cleanup import media_relative_path
from .models import ContactMessage, Reference


class MediaPathField(serializers.ImageField):
    def to_internal_value(self, data):
        if isinstance(data, str):
            value = data.strip()
            if not value:
                return ""
            rel_path = media_relative_path(value)
            if not rel_path:
                raise serializers.ValidationError(
                    "L'image doit être une URL locale (media) ou un fichier uploadé."
                )
            return rel_path
        return super().to_internal_value(data)

    def to_representation(self, value):
        if not value:
            return ""
        if hasattr(value, "url"):
            return value.url
        media_url = settings.MEDIA_URL or "/media/"
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(f"{media_url}{value}")
        return f"{media_url}{value}"

class ContactMessageSerializer(serializers.ModelSerializer):
    def validate_consent(self, value: bool) -> bool:
        if value is not True:
            raise serializers.ValidationError("Le consentement est obligatoire.")
        return value

    class Meta:
        model = ContactMessage
        fields = "__all__"


class ReferenceSerializer(serializers.ModelSerializer):
    image = MediaPathField()
    image_thumb = MediaPathField(required=False, allow_null=True)
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
            "image_thumb",
            "icon",
            "situation",
            "tasks",
            "actions",
            "results",
            "created_at",
            "updated_at",
        ]

    def _as_str(self, value) -> str:
        if value is None:
            return ""
        return str(getattr(value, "name", value) or "")

    def create(self, validated_data):
        if validated_data.get("order_index") in (None, 0):
            last = Reference.objects.aggregate(models.Max("order_index")).get("order_index__max")
            validated_data["order_index"] = (last or 0) + 1
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "image" in validated_data:
            new_image = self._as_str(validated_data.get("image")).strip()
            old_image = self._as_str(instance.image).strip()
            if new_image != old_image:
                rel_path = media_relative_path(old_image)
                if rel_path:
                    default_storage.delete(rel_path)

                old_thumb = self._as_str(instance.image_thumb).strip()
                rel_thumb = media_relative_path(old_thumb)
                if rel_thumb:
                    default_storage.delete(rel_thumb)

        if "image_thumb" in validated_data:
            new_thumb = self._as_str(validated_data.get("image_thumb")).strip()
            old_thumb = self._as_str(instance.image_thumb).strip()
            if new_thumb != old_thumb:
                rel_thumb = media_relative_path(old_thumb)
                if rel_thumb:
                    default_storage.delete(rel_thumb)

        if "icon" in validated_data:
            new_icon = self._as_str(validated_data.get("icon")).strip()
            old_icon = self._as_str(instance.icon).strip()
            if new_icon != old_icon:
                rel_path = media_relative_path(old_icon)
                if rel_path:
                    default_storage.delete(rel_path)

        return super().update(instance, validated_data)


class ContactMessageDeleteSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)


class DeleteCountSerializer(serializers.Serializer):
    deleted = serializers.IntegerField()


class ReferenceImageUploadSerializer(serializers.Serializer):
    file = serializers.ImageField()


class ImageUploadResponseSerializer(serializers.Serializer):
    url = serializers.URLField()
    thumbnail_url = serializers.URLField()
