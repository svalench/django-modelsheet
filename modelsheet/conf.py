from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.module_loading import import_string

DEFAULTS = {
    "models": [],
    "page_size": 200,
    "max_page_size": 500,
    "max_save_rows": 500,
    "count_mode": "exact",
    "bulk_background_threshold": 5000,
    "chunk_size": 200,
    "history_retention_days": 365,
    "snapshot_ttl_seconds": 1800,
    "preview_ttl_seconds": 1800,
    "max_request_bytes": 1_000_000,
    "max_bulk_rows": 100_000,
    "max_filter_depth": 10,
    "max_filter_nodes": 100,
    "max_operations_per_minute": 30,
    "formula": {"max_depth": 10, "max_length": 500, "timeout_ms": 250, "max_steps": 10000},
    "field_adapter": "modelsheet.adapters.FieldAdapter",
    "save_adapter": "modelsheet.adapters.SaveAdapter",
    "permission_policy": "modelsheet.permissions.PermissionPolicy",
    "background_adapter": None,
}


def config():
    supplied = getattr(settings, "MODELSHEET", {})
    if not isinstance(supplied, dict):
        raise ImproperlyConfigured("MODELSHEET must be a dict")
    result = {**DEFAULTS, **supplied}
    result["formula"] = {**DEFAULTS["formula"], **supplied.get("formula", {})}
    return result


def component(name):
    value = config()[name]
    if value is None:
        return None
    return (import_string(value) if isinstance(value, str) else value)()
