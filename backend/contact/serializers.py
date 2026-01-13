from rest_framework import serializers
from .models import ContactMessage

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "subject", "message", "consent", "source", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_consent(self, value):
        if value is not True:
            raise serializers.ValidationError("Consentement requis.")
        return value
