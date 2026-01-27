from rest_framework import serializers

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

    class Meta:
        model = Reference
        fields = [
            "id",
            "reference",
            "image",
            "icon",
            "situation",
            "tasks",
            "actions",
            "results",
            "created_at",
            "updated_at",
        ]
