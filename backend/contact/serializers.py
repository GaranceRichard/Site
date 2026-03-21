from rest_framework import serializers
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import models

from .media_cleanup import media_relative_path
from .models import ContactMessage, Reference, SiteSettings
from .site_settings_defaults import (
    DEFAULT_HEADER_SETTINGS,
    DEFAULT_HOME_HERO_SETTINGS,
    DEFAULT_PROMISE_SETTINGS,
)


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
        request = self.context.get("request")
        if hasattr(value, "url"):
            url = value.url
            if (
                request
                and isinstance(url, str)
                and not url.startswith(("http://", "https://"))
            ):
                return request.build_absolute_uri(url)
            return url
        media_url = settings.MEDIA_URL or "/media/"
        if request:
            return request.build_absolute_uri(f"{media_url}{value}")
        return f"{media_url}{value}"


class MediaUrlField(serializers.CharField):
    default_error_messages = {
        "invalid": "Saisissez une URL valide.",
    }

    def to_internal_value(self, data):
        value = str(data or "").strip()
        if not value:
            return ""

        rel_path = media_relative_path(value)
        if rel_path:
            return rel_path

        try:
            URLValidator(schemes=["http", "https"])(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(self.error_messages["invalid"]) from exc
        return value

    def to_representation(self, value):
        raw_value = str(value or "").strip()
        if not raw_value:
            return ""

        rel_path = media_relative_path(raw_value)
        if not rel_path:
            return raw_value

        request = self.context.get("request")
        media_url = settings.MEDIA_URL or "/media/"
        if request:
            return request.build_absolute_uri(f"{media_url}{rel_path}")
        return f"{media_url}{rel_path}"


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
    icon = MediaUrlField(required=False, allow_blank=True)
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

    def _delete_media_if_changed(self, old_value, new_value) -> bool:
        old_clean = self._as_str(old_value).strip()
        new_clean = self._as_str(new_value).strip()
        if old_clean == new_clean:
            return False

        rel_path = media_relative_path(old_clean)
        if rel_path:
            default_storage.delete(rel_path)
        return True

    def create(self, validated_data):
        if validated_data.get("order_index") in (None, 0):
            last = Reference.objects.aggregate(models.Max("order_index")).get(
                "order_index__max"
            )
            validated_data["order_index"] = (last or 0) + 1
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "image" in validated_data:
            image_changed = self._delete_media_if_changed(
                instance.image, validated_data.get("image")
            )
            if image_changed:
                self._delete_media_if_changed(instance.image_thumb, "")

        if "image_thumb" in validated_data:
            self._delete_media_if_changed(
                instance.image_thumb, validated_data.get("image_thumb")
            )

        if "icon" in validated_data:
            self._delete_media_if_changed(instance.icon, validated_data.get("icon"))

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


class HeaderSettingsSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=160, trim_whitespace=True)
    title = serializers.CharField(max_length=160, trim_whitespace=True)
    bookingUrl = serializers.URLField(max_length=500)

    def validate_name(self, value: str) -> str:
        return value.strip() or DEFAULT_HEADER_SETTINGS["name"]

    def validate_title(self, value: str) -> str:
        return value.strip() or DEFAULT_HEADER_SETTINGS["title"]

    def validate_bookingUrl(self, value: str) -> str:
        return value.strip() or DEFAULT_HEADER_SETTINGS["bookingUrl"]


class HeroSectionLinkSerializer(serializers.Serializer):
    id = serializers.ChoiceField(
        choices=["promise", "about", "services", "method", "references", "message"]
    )
    label = serializers.CharField(max_length=120, trim_whitespace=True)
    enabled = serializers.BooleanField()


class HeroCardSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=60, trim_whitespace=True)
    title = serializers.CharField(max_length=160, trim_whitespace=True)
    content = serializers.CharField(trim_whitespace=True)


class HomeHeroSettingsSerializer(serializers.Serializer):
    eyebrow = serializers.CharField(max_length=240, trim_whitespace=True)
    title = serializers.CharField(trim_whitespace=True)
    subtitle = serializers.CharField(trim_whitespace=True)
    links = HeroSectionLinkSerializer(many=True)
    keywords = serializers.ListField(child=serializers.CharField(trim_whitespace=True))
    cards = HeroCardSerializer(many=True)

    def validate_links(self, value):
        if not value:
            return DEFAULT_HOME_HERO_SETTINGS["links"]
        return value

    def validate_keywords(self, value):
        keywords = [
            item.strip() for item in value if isinstance(item, str) and item.strip()
        ][:5]
        if not keywords:
            raise serializers.ValidationError("At least one keyword is required.")
        return keywords

    def validate_cards(self, value):
        cards = [
            {
                "id": item["id"].strip(),
                "title": item["title"].strip(),
                "content": item["content"].strip(),
            }
            for item in value
            if item["id"].strip() and (item["title"].strip() or item["content"].strip())
        ][:4]
        if not cards:
            return DEFAULT_HOME_HERO_SETTINGS["cards"]
        return cards


class PromiseCardSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=60, trim_whitespace=True)
    title = serializers.CharField(max_length=160, trim_whitespace=True)
    content = serializers.CharField(trim_whitespace=True)


class PromiseSettingsSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=240, trim_whitespace=True)
    subtitle = serializers.CharField(trim_whitespace=True)
    cards = PromiseCardSerializer(many=True)

    def validate_title(self, value: str) -> str:
        return value.strip() or DEFAULT_PROMISE_SETTINGS["title"]

    def validate_subtitle(self, value: str) -> str:
        return value.strip() or DEFAULT_PROMISE_SETTINGS["subtitle"]

    def validate_cards(self, value):
        cards = [
            {
                "id": item["id"].strip(),
                "title": item["title"].strip(),
                "content": item["content"].strip(),
            }
            for item in value
            if item["id"].strip() and (item["title"].strip() or item["content"].strip())
        ][:6]
        if not cards:
            return DEFAULT_PROMISE_SETTINGS["cards"]
        return cards


class SiteSettingsSerializer(serializers.ModelSerializer):
    header = HeaderSettingsSerializer()
    homeHero = HomeHeroSettingsSerializer(source="home_hero")
    promise = PromiseSettingsSerializer()

    class Meta:
        model = SiteSettings
        fields = ["header", "homeHero", "promise", "updated_at"]

    def update(self, instance, validated_data):
        instance.header = validated_data["header"]
        instance.home_hero = validated_data["home_hero"]
        instance.promise = validated_data["promise"]
        instance.save()
        return instance
