from django.urls import path
from .views import (
    ContentExchangeExportAdminView,
    ContentExchangeImportAdminView,
    ContentExchangeTemplateAdminView,
    ContactMessageCreateView,
    ContactMessageListAdminView,
    ContactMessageDeleteAdminView,
    ReferenceListCreateAdminView,
    ReferenceDetailAdminView,
    ReferenceListPublicView,
    ReferenceImageUploadAdminView,
)

urlpatterns = [
    path("messages", ContactMessageCreateView.as_view(), name="contact-message-create"),
    path(
        "messages/admin",
        ContactMessageListAdminView.as_view(),
        name="contact-message-list-admin",
    ),
    path(
        "messages/admin/delete",
        ContactMessageDeleteAdminView.as_view(),
        name="contact-message-delete-admin",
    ),
    path("references", ReferenceListPublicView.as_view(), name="reference-list"),
    path(
        "exchange/admin/template",
        ContentExchangeTemplateAdminView.as_view(),
        name="content-exchange-template-admin",
    ),
    path(
        "exchange/admin/export",
        ContentExchangeExportAdminView.as_view(),
        name="content-exchange-export-admin",
    ),
    path(
        "exchange/admin/import",
        ContentExchangeImportAdminView.as_view(),
        name="content-exchange-import-admin",
    ),
    path(
        "references/admin/upload",
        ReferenceImageUploadAdminView.as_view(),
        name="reference-upload-admin",
    ),
    path(
        "references/admin",
        ReferenceListCreateAdminView.as_view(),
        name="reference-list-admin",
    ),
    path(
        "references/admin/<int:pk>",
        ReferenceDetailAdminView.as_view(),
        name="reference-detail-admin",
    ),
]
