from django.db import migrations, models

import contact.site_settings_defaults


class Migration(migrations.Migration):
    dependencies = [
        ("contact", "0010_sitesettings_publications"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="about",
            field=models.JSONField(
                blank=True,
                default=contact.site_settings_defaults.default_about_settings,
            ),
        ),
    ]
