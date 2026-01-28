from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("contact", "0002_reference"),
    ]

    operations = [
        migrations.AddField(
            model_name="reference",
            name="reference_short",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
    ]
