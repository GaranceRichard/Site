from django.urls import path
from .views import ContactMessageCreateView, ContactMessageListAdminView, ContactMessageDeleteAdminView

urlpatterns = [
    path("messages", ContactMessageCreateView.as_view(), name="contact-message-create"),
    path("messages/admin", ContactMessageListAdminView.as_view(), name="contact-message-list-admin"),
    path("messages/admin/delete", ContactMessageDeleteAdminView.as_view(), name="contact-message-delete-admin"),
]
