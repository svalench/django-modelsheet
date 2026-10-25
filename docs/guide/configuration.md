# Configuration

`settings.MODELSHEET` merges with defaults, including nested keys in `formula`.

Settings are optional: registered `ModelSheetAdmin` classes enable sheets by default. Set `sheet_enabled = False` on an Admin to disable its sheet. If `models` is supplied, only listed models are enabled; they still require `ModelSheetAdmin` registration.

```python title="settings.py"
MODELSHEET = {
    "page_size": 200,
    "max_page_size": 500,
    "max_save_rows": 500,
    "count_mode": "exact",
    "bulk_background_threshold": 5000,
    "max_bulk_rows": 100000,
    "chunk_size": 200,
    "snapshot_ttl_seconds": 1800,
    "preview_ttl_seconds": 1800,
    "history_retention_days": 365,
    "max_operations_per_minute": 30,
    "max_request_bytes": 1000000,
    "formula": {
        "max_length": 500, "max_depth": 10,
        "max_steps": 10000, "timeout_ms": 250,
    },
}
```

## Pages and saves

| Setting | Default | Purpose |
| --- | --- | --- |
| `models` | `None` | Optional `app.Model` restriction; `[]` disables all sheets |
| `page_size` / `max_page_size` | `200` / `500` | Default/maximum page rows |
| `max_save_rows` | `500` | Maximum rows per ordinary save |
| `count_mode` | `"exact"` | `exact` or `none`; none omits COUNT |
| `max_request_bytes` | `1000000` | Request size cap |
| `snapshot_ttl_seconds` | `1800` | Snapshot lifetime |

Pagination is offset/limit. Cursor pagination and approximate counts are not included.

## Operations and history

| Setting | Default | Purpose |
| --- | --- | --- |
| `bulk_background_threshold` | `5000` | Background processing threshold |
| `max_bulk_rows` | `100000` | Maximum operation candidates |
| `chunk_size` | `200` | Background chunk rows |
| `preview_ttl_seconds` | `1800` | Preview lifetime |
| `history_retention_days` | `365` | History retention |
| `max_operations_per_minute` | `30` | Operation rate cap |
| `max_filter_depth` / `max_filter_nodes` | `10` / `100` | Filter complexity caps |

Schedule `python manage.py modelsheet_cleanup` with your scheduler. It removes expired snapshots and old terminal/unused-preview operations according to retention. Purged idempotency keys no longer protect against reapplication.

## Extensions

```python
MODELSHEET.update({
    "field_adapter": "modelsheet.adapters.FieldAdapter",
    "save_adapter": "myproject.modelsheet.ProjectSaveAdapter",
    "permission_policy": "myproject.modelsheet.ProjectPolicy",
    "background_adapter": None,
})
```

Components are instantiated without arguments. See [adapters](../extensions.md) and [background jobs](../background.md).
