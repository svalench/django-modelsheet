# Release procedure

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
