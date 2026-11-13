# Bulk operations

Example: find ready products with stock below 10, increase price by 7%, and set status to `order`.

## 1. Choose the scope

In **Bulk change**, select highlighted page rows or all matching records, including other pages. Querysets, current permissions and the project policy always bound the scope.

```json title="Equivalent API condition"
{"and":[{"field":"stock","op":"lt","value":10},{"field":"status","op":"eq","value":"ready"}]}
```

## 2. Add assignments

| Field | New value |
| --- | --- |
| `price` | `=ROUND([price]*1.07,2)` |
| `status` | `order` |

Every assignment reads original data; assignment order has no effect.

## 3. Preview

The preview freezes all candidate PKs, source versions, calculated changes and errors. The UI shows the count and first 50 results. Newly matching products are not added later. Changing conditions or formulas requires a new preview.

If object permissions hide any candidate row, the entire preview is rejected before
reading source values or calculating aggregates. Narrow the queryset/filter to a
readable set; hidden rows are never silently removed from an aggregate's scope.
Adding or removing assignments or filter groups also invalidates the preview.

Retrying the same request with the same idempotency key returns the existing plan,
even if its view snapshot has expired or been deleted. Current access is still
checked; this does not extend the plan's confirmation expiry.

Formula parsing and `QSUM`/`QAVG`/`QCOUNT` results are cached within one immutable
plan. Lazy branches and formula step/time limits still apply, including the logical
number of source values on cache hits. Different previews never share cached data.

## 4. Confirm

Execution takes the prepared operation ID. Repeating it does not apply the markup twice. Access and row versions are checked again before writing. Changed records produce conflicts; correcting them requires a new plan.

## 5. Review the report

History contains status, counters, row outcomes and errors. Current permissions govern both history and visible fields.

| Mode | Guarantee |
| --- | --- |
| Synchronous | One transaction; all or nothing |
| Background | Commits in chunks; partial completion is possible |

## Import and export

**Export** downloads every permitted row of the current filter and sort, not only
the loaded page, up to `max_export_rows`. Columns the user cannot view are omitted.
Relation cells export their labels. Values that start with `=`, `+`, `-`, `@`, tab
or a carriage return are prefixed so a spreadsheet does not treat them as formulas.
XLSX needs `django-modelsheet[xlsx]`; otherwise the server returns `415`.

**Import** accepts CSV or XLSX (`max_import_rows`, `max_import_bytes`). Map columns,
including `pk`, then preview. Confirmation reuses the bulk pipeline: the same
permissions, idempotency key, validation and audit. A foreign-key cell may be a
primary key or a unique related label. Import updates existing rows; it does not
create rows. Confirm is refused while the preview has errors.

## Large operations

Default background threshold: 5000 rows; chunk size: 200. Without a `BackgroundAdapter`, exceeding the threshold fails before expensive planning. Set `ThreadBackgroundAdapter`, `DjangoTasksBackgroundAdapter` (Django 6) or `CeleryBackgroundAdapter` so larger plans run outside the request. See the [background contract](../background.md).

Cancel stops future chunks without undoing completed changes. Resume processes unfinished entries without repeating successful ones. See the [background contract](../background.md) and [HTTP API](../api.md).

The preview deadline is fixed when preparation completes. Cancel/resume and changes to `preview_ttl_seconds` never extend it. An expired unconfirmed plan returns `expired_preview` (409); create a new preview. Resuming an empty preview keeps its original empty membership. Already confirmed runs can resume after the deadline.

Back up the database and pause application writes/background workers. Install the new package, run `python manage.py migrate` and `python manage.py collectstatic --noinput`, then restart the application/workers and reload browser tabs. Migration `0002_operation_preview_expires_at` preserves audit history, snapshots and items. Legacy unconfirmed previews expire conservatively: create a new preview before confirming. Confirmed runs remain resumable.
