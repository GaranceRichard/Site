from django.db import models

from .site_settings_defaults import (
    DEFAULT_HEADER_SETTINGS,
    DEFAULT_HOME_HERO_SETTINGS,
    default_header_settings,
    default_home_hero_settings,
)

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
    image = models.ImageField(upload_to="references/", max_length=500)
    image_thumb = models.ImageField(upload_to="references/thumbs/", max_length=500, blank=True, null=True)
    icon = models.URLField(max_length=500, blank=True)
    situation = models.TextField(blank=True, default="")
    tasks = models.JSONField(default=list, blank=True)
    actions = models.JSONField(default=list, blank=True)
    results = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.reference


class SiteSettings(models.Model):
    header = models.JSONField(default=default_header_settings, blank=True)
    home_hero = models.JSONField(default=default_home_hero_settings, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                "header": default_header_settings(),
                "home_hero": default_home_hero_settings(),
            },
        )
        return obj

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return "Site settings"
