# Changelog

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

This initial release combines the planned v0.1–v0.3 increments. There are no prior
published schemas to migrate; future releases must preserve forward migration paths.
