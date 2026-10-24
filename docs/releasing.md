# Release procedure

## PyPI Trusted Publishing setup

The publishing workflow is `.github/workflows/workflow.yml`. `ci.yml` only runs tests
and cannot publish a package.

For the first upload, add a pending publisher at
https://pypi.org/manage/account/publishing/ with these exact values:

| PyPI form field | Value |
| --- | --- |
| PyPI project name | `django-modelsheet` |
| GitHub owner | `svalench` |
| Repository name | `django-modelsheet` |
| Workflow name (filename, without the directory) | `workflow.yml` |
| Environment name | `pypi` |

If the project already belongs to your PyPI account, add the publisher through its
Publishing settings instead. A pending publisher does not reserve the project name.
No PyPI API token or GitHub secret is required: the publish job uses OIDC with
job-scoped `id-token: write` and the `pypi` GitHub environment.

After saving the publisher, open the repository's Actions tab, select **Publish to
PyPI**, and choose **Run workflow** on `main`. Leave `publish` unchecked for a build
check, or check it to upload the current version (`0.3.0a1` initially). The workflow
builds the frontend, runs backend/unit/browser checks, builds wheel/sdist, tests
installation, and only then passes the distributions to a separate publish job.

Alternatively, publish a GitHub Release tagged `v0.3.0a1` (including a prerelease).
Release tags must match the version in pyproject.toml. A published release starts
the same workflow and uploads its artifacts after checks pass. Ordinary pushes do
not publish. Manual uploads from branches other than `main` are disabled.

Once a version is uploaded, its files cannot be replaced on PyPI; bump the version
for the next release. Future versions must also update modelsheet/__init__.py.

Official setup: https://docs.pypi.org/trusted-publishers/adding-a-publisher/

## Maintainer checklist

1. Run the full CI matrix, browser tests, package smoke test and migration checks.
2. Inspect dependencies/notices and confirm the intended PyPI name is still available.
3. Update version in pyproject.toml, modelsheet/__init__.py and frontend/package.json;
   regenerate the lockfile. Update CHANGELOG and compatibility notes.
4. Run `npm ci && npm run build` in frontend, then `python -m build` and
   `python -m twine check dist/*`. Inspect wheel assets, templates, translations and migrations.
5. Install the wheel in a clean virtualenv, run migrate and collectstatic, then test
   upgrading a database from the previous published package. Preserve old migrations.
6. Publish to TestPyPI using `python -m twine upload --repository testpypi dist/*`
   only with explicit release authorization and configured credentials. Test installation
   against TestPyPI, taking Django dependencies from the normal index.
7. After review, tag and publish to PyPI through trusted publishing or maintainer credentials.

No upload, repository push or public release is performed by local build commands.
Check availability with `python scripts/check_pypi_name.py`; a 404 is a point-in-time
observation, not reservation of the name.
