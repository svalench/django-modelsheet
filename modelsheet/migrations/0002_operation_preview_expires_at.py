from django.db import migrations, models


def expire_legacy_plans(apps, schema_editor):
    # updated_at may already have been refreshed by cancel/resume. Its original
    # deadline cannot be recovered safely. Retain all data, but require new
    # confirmation plans for legacy previews and interrupted unconfirmed work.
    # Active workers still preparing a plan receive a new deadline on completion;
    # confirmed workers do not consult the preview deadline when resuming.
    operation = apps.get_model("modelsheet", "Operation")
    operation.objects.using(schema_editor.connection.alias).filter(kind="bulk").exclude(
        status__in=("preparing", "queued", "running")
    ).update(preview_expires_at=models.F("created_at"))


class Migration(migrations.Migration):
    dependencies = [("modelsheet", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="operation",
            name="preview_expires_at",
            field=models.DateTimeField(editable=False, null=True),
        ),
        migrations.RunPython(expire_legacy_plans, migrations.RunPython.noop),
    ]
