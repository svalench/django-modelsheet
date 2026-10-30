# django-modelsheet

Spreadsheet editing for explicitly registered Django Admin models: cell/range editing,
local undo/redo, Decimal formulas, server-side filters, and previewed bulk changes.

**Current release: 0.4.0** (0.3.0 was the first stable release). [Changelog](CHANGELOG.md) · [PyPI](https://pypi.org/project/django-modelsheet/)
The repository includes a working demo, compiled assets, tests, and a compatibility CI matrix.

**[Documentation website →](https://svalench.github.io/django-modelsheet/)** —
installation, examples, formulas, bulk operations and extension APIs in English, Simplified Chinese and Belarusian.

## Quickstart

Install the stable release:

```sh
pip install django-modelsheet==0.4.0
```

```python
# settings.py
INSTALLED_APPS += ["modelsheet"]

# SQLite only: required for safe writes; PostgreSQL/MySQL use row locks.
DATABASES["default"].setdefault("OPTIONS", {})["transaction_mode"] = "IMMEDIATE"
```

```python
# admin.py
from django.contrib import admin
from modelsheet.admin import ModelSheetAdmin
from .models import Product

@admin.register(Product)
class ProductAdmin(ModelSheetAdmin):
    list_display = ("name", "price", "stock")
    search_fields = ("name",)
    sheet_fields = ("name", "price", "stock")
    sheet_editable = ("price", "stock")
    sheet_computed_fields = {"inventory_value": "=[price]*[stock]"}
```

```sh
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py modelsheet_roles  # optional: creates groups, assigns no users
```

Registering `ModelSheetAdmin` enables the sheet; no model list in settings is needed.

Assign a group through Django Admin and mark the account as staff. Superusers can
use configured sheets immediately. Open **Spreadsheet** from the model list, or
visit `/admin/shop/product/sheet/`. No frontend build, CDN or extra URL include is
required in the consuming project. Admin's existing sessions and CSRF protection apply.

## Upgrading to 0.4.0

No migrations. Install, run `collectstatic`, restart. Review these behaviour changes:

- Fields returned by `get_readonly_fields(request, obj)` for a specific row are now
  rejected on save/bulk (`403 readonly_field`), matching the ordinary change form.
- `GET rows/` is throttled (`max_snapshots_per_minute`, `429 rate_limit`) and only the
  newest `max_snapshots_per_user` snapshots per user are kept; older snapshot ids
  return `409 invalid_snapshot` (reload the sheet).
- `offset` above `max_offset` returns `400 offset_limit`.
- Unexpected `TypeError`/`ValueError`/`KeyError` in API code are no longer reported as
  `400 Malformed request`; they surface as server errors (500) and in your error tracking.
- API error messages follow the active language (Russian translations included).
- Opt in to `"history_scope": "own"` to hide other users' operations (see Permissions).

## Upgrading to 0.3.0

Back up the database and pause writes/background workers. Install the new package,
run `python manage.py migrate` and `python manage.py collectstatic --noinput`, then
restart the application/workers and reload browser tabs. Migration `0002` preserves
history and operation items, but expires legacy unconfirmed previews: build a new
preview before confirming. Already confirmed runs retain their resume behavior.
New preview deadlines start when preparation completes and cannot be extended by
cancel/resume or settings changes. Pin `django-modelsheet==0.3.0`.

## Using the sheet

- Double-click to edit; use the formula bar for a value or expression.
- Changes stay local until **Save**. Ctrl/Cmd+Z, Ctrl/Cmd+Y and Ctrl/Cmd+S operate on this buffer.
- Select a range, copy/paste TSV from Excel, or press Ctrl/Cmd+D to fill down.
- Readonly cells are skipped during paste with a notification. A save is atomic across all changed rows.
- Use **Sort** for ordered sort fields, or Alt+click a column header (Alt+Shift+click adds a field).
  Ordinary header clicks select columns. Search and filters run on the server.
- **Bulk change** selects either highlighted page rows or every matching row, including other pages.
  Build a preview, inspect its exact count/values, then confirm it. Editing inputs requires a new preview.
- **Ordinary Admin** is available only when its list can represent the same filter, ordering and page.

Numbers use a decimal point and dates use ISO 8601. Empty pasted cells become
NULL for nullable fields, otherwise empty text for text fields or a validation error.
Prefix text beginning with `=` with an apostrophe, for example `'=SUM(A1:A2)`.

## Configuration

```python
MODELSHEET = {
    "page_size": 200,
    "max_page_size": 500,
    "max_save_rows": 500,
    "count_mode": "exact",  # exact | none (no approximate COUNT promise)
    "bulk_background_threshold": 5000,
    "max_bulk_rows": 100000,
    "chunk_size": 200,
    "snapshot_ttl_seconds": 1800,
    "preview_ttl_seconds": 1800,
    "history_retention_days": 365,
    "max_operations_per_minute": 30,
    "max_snapshots_per_minute": 120,  # GET rows/ creates a snapshot; 429 above this
    "max_snapshots_per_user": 50,  # older snapshots of the user are pruned
    "max_offset": 100000,  # deeper pages must be reached with filters
    "history_scope": "all",  # all | own (see Permissions)
    "max_request_bytes": 1000000,
    "formula": {"max_length": 500, "max_depth": 10, "max_steps": 10000, "timeout_ms": 250},
    "background_adapter": None,
}
```

### Operations: scheduled cleanup (required)

Every sheet load stores a `ViewSnapshot` (a copy of the visible page values) and
every save/bulk run stores `Operation`/`OperationItem` rows with before/after values.
Schedule `modelsheet_cleanup` — it removes expired snapshots and terminal or unused
preview operations older than `history_retention_days`:

```cron
# crontab: every 15 minutes
*/15 * * * * cd /srv/app && python manage.py modelsheet_cleanup
```

```python
# Celery beat alternative
CELERY_BEAT_SCHEDULE = {
    "modelsheet-cleanup": {
        "task": "yourproject.tasks.modelsheet_cleanup",  # call_command("modelsheet_cleanup")
        "schedule": 15 * 60,
    },
}
```

Per-user pruning bounds snapshot growth between runs, but history is kept until
cleanup. Values of fields a user can no longer see are never returned from snapshots
or history, yet they remain in the database until purged — choose
`snapshot_ttl_seconds`/`history_retention_days` accordingly and protect DB backups.
Do not reuse old idempotency keys after their operation has been purged.

## Permissions

Access requires `is_active`, `is_staff`, `modelsheet.open`, the model's standard
`view` permission, and `ModelAdmin.has_view_permission()`. Editing additionally
requires the standard `change` permission and `has_change_permission()`.

Package permission codenames include app/model identifiers:

```text
modelsheet.view_field_shop_product_price
modelsheet.edit_field_shop_product_price
modelsheet.bulk_shop_product
modelsheet.history_shop_product
```

Readonly fields are checked twice: `get_readonly_fields(request)` shapes the schema,
and `get_readonly_fields(request, obj)` is re-evaluated for every written row, so
per-record locks (`if obj and obj.locked: ...`) also apply to the sheet.

History visibility: with the default `"history_scope": "all"` anyone holding
`history_<app>_<model>` sees all users' operations for that model (field values are
still masked by field permissions). With `"history_scope": "own"` users see only their
own operations unless they are superusers or hold `modelsheet.view_all_history`
(created by `migrate`). The same scope applies to the audit pages in Django Admin.

`get_queryset(request)` bounds every read/write. Object-level Admin hooks and the
configured policy apply in addition. Hidden fields cannot be used in filters,
sorting, formulas or history. Field permissions never grant model-level editing.

Group templates are opt-in and additive: Viewer, Editor, Operator, Auditor and Admin.
They grant access to the configured sheet fields; review these grants before
assigning users, especially sensitive columns. They do not grant superuser status.

## Development and demo

```sh
python -m pip install -e '.[test]'
cd frontend
npm ci
npm run build
npm test
cd ..
python manage.py migrate
python manage.py seed_demo --create-user
python manage.py runserver
```

The explicit `--create-user` option creates a local-only `admin` / `admin` account.
The demo settings are not production settings. Open
`http://127.0.0.1:8000/admin/shop/product/sheet/`.

```sh
python -m pytest --cov=modelsheet
python -m ruff check .
python -m mypy
python -m build --no-isolation
cd frontend
npx playwright install chromium
npm run test:e2e
```

Target matrix: Django 5.2 / Python 3.11–3.14; Django 6.0 and 6.1 / Python
3.12–3.14; PostgreSQL, MySQL/InnoDB, SQLite. CI exercises valid combinations and
the same transactional contract across databases. Consult CI results before
treating a combination as verified; local results are recorded in `docs/validation.md`.

## Boundaries

Safe mode calls `full_clean()` and the instance's `save()` by default, including
normal model signals. Custom `ModelAdmin.save_model()`, custom Admin forms,
`save_related()` and external effects need an explicit adapter. Snapshot fingerprints
cover concrete model fields, not all intermediate history or related-table contents.

Sheets use the `default` database. User models require no extra fields or inheritance.
Existing scalar fields are editable; FK fields can be displayed/filtered but FK/M2M
editors, server undo, file import/export, fast-save, cursor pagination and persistent
formulas are deferred. Large operations require your own background adapter.

See [formulas](docs/formulas.md), [extension API](docs/extensions.md),
[background processing](docs/background.md), [HTTP API](docs/api.md), and
[release procedure](docs/releasing.md). Bundled dependency notices are in
`modelsheet/static/modelsheet/THIRD_PARTY_LICENSES.txt`.
