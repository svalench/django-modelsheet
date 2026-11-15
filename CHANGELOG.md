# Changelog

## 0.5.0 — 2026-11-13

- Foreign keys show the related object's string and use a permission-aware autocomplete editor. Many-to-many columns show labels and stay read-only.
- Boolean, date, time and choice editors; decimal input accepts a comma; F2 and typing start an edit. Dates follow the active locale.
- Server-side CSV export of the current filtered and sorted view, and XLSX when `django-modelsheet[xlsx]` is installed. Export streams visible columns and permitted rows, capped by `max_export_rows`.
- CSV/XLSX import reuses the bulk preview and confirm pipeline (`max_import_rows`, `max_import_bytes`).
- Named views in the browser, plus optional shared `SavedView` rows (migration `0003_saved_view`).
- Add and delete rows in the same atomic save, with model add/delete permissions and an audit record.
- Server undo of the last save (`modelsheet.undo_<model>`), conflict-safe against newer fingerprints. Undo of an undo is not supported. Recreating a deleted row restores concrete fields, not many-to-many links.
- Filter controls use localized operators, typed values and readable chips. Find and replace and fill right (Ctrl/Cmd+R) edit the loaded page through the local buffer.
- Optional background adapters: `ThreadBackgroundAdapter`, Django 6 `DjangoTasksBackgroundAdapter`, and `CeleryBackgroundAdapter` (`django-modelsheet[celery]`). The default stays unset.
- Blur validation plus `POST validate/` (`full_clean`, no write).
- Opt-in keyset pagination (`MODELSHEET["pagination"] = "keyset"` or a view state). Offset remains the default, including the `max_offset` cap.
- Object-permission paging no longer leaves holes: hidden rows are skipped in the page and in the count. Bulk preview still rejects a set that contains a hidden row.
- Sheet strings go through gettext, with Russian, Belarusian and Chinese catalogs.

## 0.4.0 — 2026-10-30

Security
- Re-check `ModelAdmin.get_readonly_fields(request, obj)` for every row written by save, bulk preview and bulk run; per-object readonly fields now return `403 readonly_field`.
- Throttle `GET rows/` snapshots (`max_snapshots_per_minute`, default 120) and keep only the newest `max_snapshots_per_user` (default 50) per user; expired snapshots of the user are removed on each load.
- Ignore stored snapshot values for fields the user can no longer view.
- New `history_scope` setting: `"own"` limits history, operation reports and the audit admin to the user's own operations unless superuser or `modelsheet.view_all_history`. **Default stays `"all"`** (previous behaviour); it may change to `"own"` in a future major release.
- Bound `offset` with `max_offset` (default 100000) for rows, history and operation reports.

Fixes / behaviour
- The API no longer turns `ValueError`/`TypeError`/`KeyError` raised by bugs into `400 Malformed request`; malformed input is validated explicitly (e.g. non-object bulk `state` now returns `400 invalid_state` instead of a 500).
- API error messages are translatable (`gettext_lazy`); Russian translations added.

Tooling
- mypy runs in CI (package ships `py.typed`); ruff now enables B, I, UP, S and DJ.
- pyproject: Python version, audience, environment and typing classifiers; authors and keywords; `mypy`/`pytest-cov` in the `test` extra.
- README: required scheduled `modelsheet_cleanup`, data retention, history scope.

## 0.3.0 — 2026-10-25

- Preserve edits, undo/redo and save payloads for string primary keys such as `__proto__` and `constructor`.
- Store an immutable preview deadline; cancel/resume cannot renew an expired plan or rebuild an empty plan.
- Add migration `0002` to expire legacy unconfirmed plans conservatively while preserving history and operation items. Run migrations and collectstatic during upgrade.
- Synchronize Python/npm versions and stable metadata; gate publishing on the full database/Python matrix, browser tests, strict documentation and wheel upgrade smoke checks.

- Reject bulk previews containing rows hidden by object permissions before calculating aggregates.
- Cache bulk formula parsing and query aggregates within each immutable plan, preserving formula budgets and lazy branches.
- Return existing bulk previews on idempotent retries even after their view snapshot expires or is removed.
- Lock editing and navigation while saving/loading so pending changes cannot be silently discarded.
- Invalidate bulk previews for structural edits and ignore stale preview/poll responses.
- Add permission, retry, formula-cache and browser regression tests plus an isolated bulk benchmark.
- Enable sheets through `ModelSheetAdmin` registration without a required settings list.
- Discover role models from enabled Admin registrations, including custom Admin sites.
- Keep `MODELSHEET["models"]` as an optional restriction for existing projects.

## 0.3.0a2 — 2026-10-24

- Keep unchanged numeric cells out of the local change buffer.
- Constrain cell editors to their cells and reset inherited form styles.
- Synchronize the formula bar with Tabulator keyboard navigation and selection.
- Preserve live-demo cell identities after editing so arrow and Tab navigation remain reliable.
- Add browser regression coverage for editor layout, no-op edits and keyboard workflows.
- Include the live documentation playground in English, Simplified Chinese and Belarusian.

## 0.3.0a1 — 2026-10-24

- Initial Django package, explicit Admin registration, precompiled static assets.
- Spreadsheet range editing, local undo/redo, safe atomic saves and row fingerprints.
- Permission-aware search, grouped filters, sorting, snapshots and Admin switching.
- Bounded Python/TypeScript formula engines with shared golden fixtures.
- Immutable bulk previews, confirmation, audit, idempotency and background adapter contract.
- Demo project, migrations, role/cleanup commands, CI and packaging checks.

Version 0.3.0a1 combined the planned v0.1–v0.3 increments and introduced the first
published schema. Later releases preserve its forward migration path.
