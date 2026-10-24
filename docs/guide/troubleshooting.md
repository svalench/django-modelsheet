# Troubleshooting

## Spreadsheet button is missing

Check that `modelsheet` is installed and migrated, `app.Model` is allowlisted, the registered Admin extends `ModelSheetAdmin`, and `sheet_fields` and user permissions are configured. Run `python manage.py check`.

## A field is read-only

It must be in `sheet_editable`. `readonly_fields`, model/field permissions, Admin object hooks and the project policy also apply. FK/M2M and computed columns are not editable in this alpha.

## Save conflict

A source/dependency changed or the snapshot expired. Preserve any needed edits separately, reload current data and reapply them. Do not replace `version` in a request. If only the response was lost, retry the exact body with its original idempotency key.

## SQLite transaction mode

```python
DATABASES["default"].setdefault("OPTIONS", {})["transaction_mode"] = "IMMEDIATE"
```

`select_for_update()` alone is insufficient on SQLite. A busy database returns a retryable error; retry the original request/key.

## Formula errors

`#REF!`: check visible column order and loaded snapshot boundaries. Row addresses are page-local. `#LIMIT!`: simplify the expression/range. Raising `MODELSHEET["formula"]` limits must account for project load.

## Large operation rejected

Above `bulk_background_threshold`, configure a [BackgroundAdapter](../background.md). Raising the threshold does not create a worker or queue. Check `max_bulk_rows` and bulk permissions as well.

## Cannot switch to ordinary Admin

The current filter/order cannot be represented exactly. Simplify it. Custom list filters, related search and expression ordering may require separate integration.

## Production JavaScript does not load

Run `collectstatic`, check serving of `STATIC_ROOT`, and look for missing `modelsheet` assets in browser network requests. Compiled assets are included in the wheel; npm is not required by consuming projects.

## Report a bug

Open a [GitHub issue](https://github.com/svalench/django-modelsheet/issues) with package/Python/Django versions, database, minimal Admin configuration and reproduction steps. Remove secrets and personal data.
