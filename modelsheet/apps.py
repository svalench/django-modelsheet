from django.apps import AppConfig
from django.db.models.signals import post_migrate


class ModelSheetConfig(AppConfig):
    name = "modelsheet"
    verbose_name = "Model sheets"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        from . import checks  # noqa: F401
        from .permissions import create_permissions

        post_migrate.connect(create_permissions, sender=self, dispatch_uid="modelsheet.permissions")
