from django.core.exceptions import FieldDoesNotExist
from django.utils.translation import gettext_lazy as _

from .conf import component
from .errors import SheetError


def fields_for(request, admin):
    policy, adapter = component("permission_policy"), component("field_adapter")
    fields = {}
    readonly = admin.get_readonly_fields(request)
    can_change = admin.has_change_permission(request) and request.user.has_perm(
        f"{admin.model._meta.app_label}.change_{admin.model._meta.model_name}"
    )
    for name in admin.sheet_fields:
        if not policy.can_view_field(request, admin, name):
            continue
        try:
            field = admin.model._meta.get_field(name)
        except FieldDoesNotExist:
            continue
        fields[name] = {
            **adapter.metadata(field),
            "editable": bool(
                can_change
                and name in admin.sheet_editable
                and name not in readonly
                and adapter.editable(field)
                and policy.can_edit_field(request, admin, name)
            ),
        }
    return fields


def require_fields(names, fields, *, edit=False):
    for name in names:
        if name not in fields or (edit and not fields[name]["editable"]):
            raise SheetError(
                "forbidden_field",
                _("Field is unavailable for this operation."),
                status=403,
                field=name,
            )


def require_object_editable(request, admin, obj, names):
    """Re-check ``get_readonly_fields`` with the concrete object.

    Admin classes commonly lock fields per record (``if obj and obj.locked``); the
    sheet schema is built without an object, so every write re-validates here.
    """
    readonly = set(admin.get_readonly_fields(request, obj))
    for name in names:
        if name in readonly:
            raise SheetError(
                "readonly_field",
                _("Field is read-only for this row."),
                status=403,
                pk=str(obj.pk),
                field=name,
            )
