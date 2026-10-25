from django.contrib.admin import sites

from .conf import config


def is_enabled(model_admin):
    from .admin import ModelSheetAdmin

    models = config()["models"]
    return (
        isinstance(model_admin, ModelSheetAdmin)
        and model_admin.sheet_enabled
        and (models is None or model_admin.model._meta.label in models)
    )


def enabled_admins():
    """Yield enabled sheet admins from every registered AdminSite."""
    for site in list(sites.all_sites):
        for model_admin in site._registry.values():
            if is_enabled(model_admin):
                yield model_admin
