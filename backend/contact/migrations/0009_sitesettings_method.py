from django.db import migrations, models

import contact.site_settings_defaults


class Migration(migrations.Migration):
    dependencies = [
        ("contact", "0008_sitesettings_promise"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="method",
            field=models.JSONField(
                blank=True,
                default=contact.site_settings_defaults.default_method_settings,
            ),
        ),
    ]
