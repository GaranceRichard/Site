from django.urls import path
from .views import ContactMessageCreateView, ContactMessageListAdminView

urlpatterns = [
    path("messages", ContactMessageCreateView.as_view(), name="contact-message-create"),
    path("messages/admin", ContactMessageListAdminView.as_view(), name="contact-message-list-admin"),
]
