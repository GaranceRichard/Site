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


class Reference(models.Model):
    reference = models.CharField(max_length=160)
    reference_short = models.CharField(max_length=120, blank=True, default="")
    order_index = models.IntegerField(default=0, db_index=True)
    image = models.URLField(max_length=500, blank=True)
    icon = models.URLField(max_length=500, blank=True)
    situation = models.TextField()
    tasks = models.JSONField(default=list, blank=True)
    actions = models.JSONField(default=list, blank=True)
    results = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.reference
