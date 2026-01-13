from django.db import models

class ContactMessage(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField()
    subject = models.CharField(max_length=180, blank=True)
    message = models.TextField()
    consent = models.BooleanField(default=False)
    source = models.CharField(max_length=200, blank=True)  # ex: page/utm
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} <{self.email}> - {self.subject[:40]}"
