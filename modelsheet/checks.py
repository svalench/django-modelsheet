from django.apps import apps
from django.contrib.admin import sites
from django.core.checks import Error, register
from django.core.exceptions import FieldDoesNotExist, ImproperlyConfigured

from .conf import component, config


@register()
def check_configuration(app_configs, **kwargs):
    from .admin import ModelSheetAdmin

    errors = []
    try:
        settings = config()
        for label in settings["models"] or ():
            try:
                apps.get_model(label)
            except (ValueError, LookupError):
                errors.append(Error(f"Unknown model: {label}", id="modelsheet.E001"))
        for key in (
            "page_size",
            "max_page_size",
            "max_save_rows",
            "chunk_size",
            "bulk_background_threshold",
            "history_retention_days",
            "max_bulk_rows",
            "max_operations_per_minute",
            "max_snapshots_per_minute",
            "max_snapshots_per_user",
            "snapshot_ttl_seconds",
            "preview_ttl_seconds",
        ):
            if not isinstance(settings[key], int) or settings[key] < 1:
                errors.append(Error(f"{key} must be a positive integer", id="modelsheet.E002"))
        if settings["history_scope"] not in ("all", "own"):
            errors.append(Error("history_scope must be all or own", id="modelsheet.E009"))
        if settings["count_mode"] not in ("exact", "none"):
            errors.append(Error("count_mode must be exact or none", id="modelsheet.E003"))
        if settings["page_size"] > settings["max_page_size"]:
            errors.append(Error("page_size exceeds max_page_size", id="modelsheet.E002"))
        for key in ("field_adapter", "save_adapter", "permission_policy", "background_adapter"):
            component(key)
        for site in list(sites.all_sites):
            for model, admin in site._registry.items():
                if not isinstance(admin, ModelSheetAdmin):
                    continue
                if not admin.sheet_fields or not set(admin.sheet_editable) <= set(
                    admin.sheet_fields
                ):
                    errors.append(
                        Error(
                            f"{model._meta.label}: declare sheet_fields and a subset sheet_editable",
                            id="modelsheet.E004",
                        )
                    )
                for name in admin.sheet_fields:
                    from .permissions import codename

                    if len(codename("edit_field", model, name)) > 100:
                        errors.append(
                            Error(
                                "Field permission codename exceeds Django's 100-character limit",
                                id="modelsheet.E008",
                            )
                        )
                    try:
                        field = model._meta.get_field(name)
                        if not field.concrete or field.many_to_many:
                            raise FieldDoesNotExist()
                        if name in admin.sheet_editable and not component("field_adapter").editable(
                            field
                        ):
                            errors.append(
                                Error(
                                    f"{model._meta.label}.{name} cannot be edited",
                                    id="modelsheet.E005",
                                )
                            )
                    except FieldDoesNotExist:
                        errors.append(
                            Error(
                                f"Unknown/concrete-only field: {model._meta.label}.{name}",
                                id="modelsheet.E006",
                            )
                        )
                if set(admin.sheet_computed_fields) & set(admin.sheet_fields):
                    errors.append(
                        Error("Computed column names must be distinct", id="modelsheet.E007")
                    )
    except (ImproperlyConfigured, ImportError, TypeError, ValueError) as exc:
        errors.append(Error(str(exc), id="modelsheet.E000"))
    return errors
