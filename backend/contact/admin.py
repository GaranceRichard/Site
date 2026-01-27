from django.contrib import admin
from .models import ContactMessage, Reference

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("created_at", "name", "email", "subject", "consent", "source")
    search_fields = ("name", "email", "subject", "message")
    list_filter = ("consent", "created_at")


@admin.register(Reference)
class ReferenceAdmin(admin.ModelAdmin):
    list_display = ("reference", "created_at", "updated_at")
    search_fields = ("reference", "situation")
