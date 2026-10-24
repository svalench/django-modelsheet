from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

from .errors import SheetError


def codename(action, model, field=None):
    suffix = f"_{field}" if field else ""
    return f"{action}_{model._meta.app_label}_{model._meta.model_name}{suffix}"


def allowed(user, action, model, field=None):
    return user.has_perm(f"modelsheet.{codename(action, model, field)}")


class PermissionPolicy:
    def can_view_field(self, request, admin, field):
        return allowed(request.user, "view_field", admin.model, field)

    def can_edit_field(self, request, admin, field):
        return allowed(request.user, "edit_field", admin.model, field)

    def can_view_object(self, request, admin, obj):
        return admin.has_view_permission(request, obj)

    def can_edit_object(self, request, admin, obj):
        return admin.has_change_permission(request, obj)


def require_access(request, admin, *, change=False, action=None):
    user, model = request.user, admin.model
    if not (
        user.is_active
        and user.is_staff
        and user.has_perm("modelsheet.open")
        and user.has_perm(f"{model._meta.app_label}.view_{model._meta.model_name}")
        and admin.has_view_permission(request)
    ):
        raise SheetError("forbidden", "Sheet access denied.", status=403)
    if change and not (
        user.has_perm(f"{model._meta.app_label}.change_{model._meta.model_name}")
        and admin.has_change_permission(request)
    ):
        raise SheetError("forbidden", "Change permission required.", status=403)
    if action and not allowed(user, action, model):
        raise SheetError("forbidden", f"{action} permission required.", status=403)


def create_permissions(sender, using="default", **kwargs):
    from django.contrib.admin import sites
    from .admin import ModelSheetAdmin
    from .models import Operation

    content_type = ContentType.objects.db_manager(using).get_for_model(Operation)
    definitions = {"open": "Can open model sheets"}
    for site in list(sites.all_sites):
        for model, admin in site._registry.items():
            if not isinstance(admin, ModelSheetAdmin):
                continue
            for action in ("bulk", "history", "undo"):
                definitions[codename(action, model)] = f"Can {action} {model._meta.label}"
            for field in admin.sheet_fields:
                for action in ("view_field", "edit_field"):
                    definitions[codename(action, model, field)] = (
                        f"Can {action} {model._meta.label}.{field}"
                    )
    for name, label in definitions.items():
        Permission.objects.using(using).get_or_create(
            content_type=content_type,
            codename=name,
            defaults={"name": label[:255]},
        )
