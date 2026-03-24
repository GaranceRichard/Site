from django.db import migrations, models

import contact.site_settings_defaults


class Migration(migrations.Migration):
    dependencies = [
        ("contact", "0009_sitesettings_method"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="publications",
            field=models.JSONField(
                blank=True,
                default=contact.site_settings_defaults.default_publications_settings,
            ),
        ),
    ]
