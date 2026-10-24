from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from modelsheet.conf import config
from modelsheet.permissions import create_permissions


class Command(BaseCommand):
    help = "Create opt-in groups for configured models (does not assign users)."

    def add_arguments(self, parser):
        parser.add_argument("--prefix", default="ModelSheet")

    @transaction.atomic
    def handle(self, *args, **options):
        from django.apps import apps

        create_permissions(apps.get_app_config("modelsheet"))
        permissions = Permission.objects.filter(content_type__app_label="modelsheet")
        definitions = {
            "Viewer": ("view_field_",),
            "Editor": ("view_field_", "edit_field_"),
            "Operator": ("view_field_", "edit_field_", "bulk_", "history_"),
            "Auditor": ("view_field_", "history_"),
            "Admin": ("view_field_", "edit_field_", "bulk_", "history_"),
        }
        if not config()["models"]:
            raise CommandError("Configure MODELSHEET.models first")
        for role, prefixes in definitions.items():
            group, _ = Group.objects.get_or_create(name=f"{options['prefix']} {role}")
            selected = [
                p for p in permissions if p.codename == "open" or p.codename.startswith(prefixes)
            ]
            for label in config()["models"]:
                model = apps.get_model(label)
                actions = ["view"] + (["change"] if role in ("Editor", "Operator", "Admin") else [])
                selected.extend(
                    Permission.objects.filter(
                        content_type__app_label=model._meta.app_label,
                        content_type__model=model._meta.model_name,
                        codename__in=[f"{a}_{model._meta.model_name}" for a in actions],
                    )
                )
            # Additive: do not remove project-specific grants on subsequent runs.
            group.permissions.add(*selected)
            self.stdout.write(self.style.SUCCESS(group.name))
