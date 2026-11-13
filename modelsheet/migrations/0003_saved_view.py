import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("modelsheet", "0002_operation_preview_expires_at")]

    operations = [
        migrations.CreateModel(
            name="SavedView",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("name", models.CharField(max_length=80)),
                ("model_label", models.CharField(max_length=200)),
                ("site_name", models.CharField(max_length=100)),
                ("shared", models.BooleanField(default=False)),
                ("state", models.JSONField(default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="savedview",
            constraint=models.UniqueConstraint(
                fields=("user", "site_name", "model_label", "name"),
                name="modelsheet_saved_view",
            ),
        ),
    ]
