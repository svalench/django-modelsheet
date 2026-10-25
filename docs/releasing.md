# Release procedure

This procedure covers stable releases, starting with **0.3.0**. Create a tag, publish
a GitHub Release or enable the publishing input only after release approval.

## Local validation

1. Preserve current changes. Synchronize `pyproject.toml`, `modelsheet/__init__.py`,
   `frontend/package.json` and both root versions in `frontend/package-lock.json`.
   Run `python scripts/check_release.py --stable --tag v0.3.0`.
2. Run `python manage.py check`, `python manage.py makemigrations --check --dry-run`,
   `python -m ruff check .` and `python -m pytest -q`.
3. In `frontend`, run `npm ci`, `npm test`, `npm run build`, `npm run build:demo`,
   `npx playwright install chromium` and `npm run test:e2e`. Review and include the
   rebuilt production and playground assets in the release commit.
4. Install `requirements-docs.txt`, run `python scripts/check_docs_locales.py` and
   `mkdocs build --strict`, then run `npm run test:demo` in `frontend`.
5. Build into an empty output directory with `python -m build --outdir /tmp/modelsheet-030-dist`,
   then run `python -m twine check /tmp/modelsheet-030-dist/*`.
6. Run `python scripts/package_smoke.py --wheel /tmp/modelsheet-030-dist/django_modelsheet-0.3.0-py3-none-any.whl`
   and repeat with `--upgrade-from 0.3.0a2`. A local previous wheel path is also accepted.
   These checks install outside the repository, migrate and collect static files;
   the upgrade check preserves history/items/snapshots and expires legacy plans.
   The virtualenv reuses installed system dependencies; it does not test fresh dependency resolution.

Migration `0002_operation_preview_expires_at` must ship alongside unchanged `0001`.
Pause application writes and background workers during deployment, back up the database,
install the release, migrate, collectstatic, restart and reload browser tabs. Rebuild legacy
unconfirmed previews before confirming. Confirmed runs remain resumable. See the
[upgrade notes](guide/releases.md) and [local validation report](validation.md).

## CI and publishing gates

`ci.yml` is reusable and checks all 16 Python/Django/database combinations, frontend
unit tests, browser scenarios, wheel/sdist metadata, clean installation and upgrading
from 0.3.0a2. It also calls `docs-checks.yml` for locale coverage, strict documentation,
committed demo assets and playground browser tests. These validation workflows do not publish.

`workflow.yml` first checks stable versions and the release tag, then calls the entire
CI workflow on the same commit. The separate publish job depends on both checks and
uses only the `pypi-distributions` artifact produced after all package checks pass.
The full matrix must pass for the exact release commit; older green runs do not qualify.

After approval, run **Publish to PyPI** on `main`, keeping `publish` unchecked for a
validation-only run. Checking it uploads the current version. Alternatively, publishing
GitHub Release `v0.3.0` starts the same gated workflow. Ordinary pushes never publish
packages; manual publishing from other branches is disabled. A PyPI version cannot
be replaced after upload, so any later changes require a new version.

## Trusted Publishing

Configure the existing PyPI project's publisher with these exact values:

| Field | Value |
| --- | --- |
| Project | `django-modelsheet` |
| GitHub owner/repository | `svalench/django-modelsheet` |
| Workflow filename | `workflow.yml` |
| GitHub environment | `pypi` |

The publish job uses OIDC with job-scoped `id-token: write`; no PyPI token is needed.
Configure environment protection in GitHub if an additional maintainer approval is desired.
See [PyPI's publisher setup](https://docs.pypi.org/trusted-publishers/adding-a-publisher/).
Local validation/build commands perform no upload, tag or repository push.
