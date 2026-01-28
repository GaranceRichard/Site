from django.db import migrations, models


def backfill_order_index(apps, schema_editor):
    Reference = apps.get_model("contact", "Reference")
    refs = Reference.objects.all().order_by("-updated_at", "-created_at", "id")
    for idx, ref in enumerate(refs, start=1):
        Reference.objects.filter(id=ref.id).update(order_index=idx)


class Migration(migrations.Migration):
    dependencies = [
        ("contact", "0003_reference_short"),
    ]

    operations = [
        migrations.AddField(
            model_name="reference",
            name="order_index",
            field=models.IntegerField(db_index=True, default=0),
        ),
        migrations.RunPython(backfill_order_index, migrations.RunPython.noop),
    ]
