# Contributing

Use Python 3.11+ (3.12+ with Django 6.x) and Node 22. Install `.[test]`, then run
`npm ci` inside frontend. Build assets with `npm run build` and include both source
and generated assets in changes. Never require npm in consuming Django projects.

Run pytest, ruff, Vitest and Playwright as described in README. Formula semantics
changes must add fixtures to tests/formula_cases.json and pass both runtimes.
Use actual transactional tests with separate connections for concurrency changes.
Database-specific behavior must be exercised by the PostgreSQL/MySQL CI jobs.

Run makemigrations for schema changes. Do not rewrite released migrations. Preserve
permission checks on every API/worker entry point and safe saves by default.
Do not silently broaden a preview's members or automatically replay failed items.

Update docs and CHANGELOG for public interfaces. Add dependency license notices when
bundling new assets. Avoid committing local credentials, demo databases and generated
test reports. The demo's explicit test credentials must not be used in production.
