from rest_framework import serializers
from django.db import models

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
