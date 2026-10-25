# Changelog

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
