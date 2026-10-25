# Release and limitations

## 0.3.0 · prepared, publication pending

Fixes special string primary keys in the edit buffer and immutable preview expiry. Includes permission-safe cached bulk aggregates, stale-response guards and automatic `ModelSheetAdmin` discovery. Publishing requires the complete CI matrix, browser/package checks and strict documentation checks.

0.3.0 is prepared but not yet published. Install from this checkout with `python -m pip install .`. After publication:

```bash
python -m pip install --upgrade django-modelsheet==0.3.0
```

Back up the database and pause application writes/background workers. Install the new package, run `python manage.py migrate` and `python manage.py collectstatic --noinput`, then restart the application/workers and reload browser tabs. Migration `0002_operation_preview_expires_at` preserves audit history, snapshots and items. Legacy unconfirmed previews expire conservatively: create a new preview before confirming. Confirmed runs remain resumable.

The preview deadline is fixed when preparation completes. Cancel/resume and changes to `preview_ttl_seconds` never extend it. An expired unconfirmed plan returns `expired_preview` (409); create a new preview. Resuming an empty preview keeps its original empty membership. Already confirmed runs can resume after the deadline.

## 0.3.0a2 · 24 October 2026

Fixes unchanged numeric cells appearing as modified, editor overflow and formula-bar updates during keyboard navigation. The live demo keeps cell identities stable after editing. Adds browser regression coverage and the documentation playground.

[Install from PyPI](https://pypi.org/project/django-modelsheet/0.3.0a2/){ .md-button .md-button--primary }
[GitHub Release](https://github.com/svalench/django-modelsheet/releases/tag/v0.3.0a2){ .md-button }

```bash
python -m pip install --upgrade django-modelsheet==0.3.0a2
```

## 0.3.0a1 · 24 October 2026

The first public alpha combines range editing, a local buffer, safe saves, formulas and previewed bulk operations.

[Install from PyPI](https://pypi.org/project/django-modelsheet/0.3.0a1/){ .md-button .md-button--primary }
[GitHub Release](https://github.com/svalench/django-modelsheet/releases/tag/v0.3.0a1){ .md-button }

```bash
python -m pip install django-modelsheet==0.3.0a1
```

Includes explicit model registration, clipboard/fill-down/undo, Decimal calculations, server queries, conflict detection, immutable plans, audit, idempotency and a background adapter contract. Compiled assets, the demo and MIT license are included.

## Compatibility

| Component | Project matrix |
| --- | --- |
| Django 5.2 | Python 3.11–3.14 |
| Django 6.0 / 6.1 | Python 3.12–3.14 |
| Databases | PostgreSQL, MySQL/InnoDB, SQLite |
| Installation | wheel/sdist; no Node.js |

Check your combination in [CI](https://github.com/svalench/django-modelsheet/actions/workflows/ci.yml); local checks and boundaries are in the [validation report](../validation.md).

## 0.3.0 boundaries

| Capability | Current behavior |
| --- | --- |
| Create/delete | Standard Admin |
| FK | Permitted display/filtering; no editor |
| M2M | No editor |
| Formulas | One-time values or computed columns |
| Undo | Local buffer before saving |
| File import/export | Deferred; TSV clipboard is available |
| Background queue | Provided by the project adapter |
| Multiple databases | Operations use `default` only |
| Computed-column sorting | Unsupported |

Server undo, relationship editors, import/export, fast-save, persistent formulas and cursor pagination are future directions, not dated promises.

[Source](https://github.com/svalench/django-modelsheet) · [Changelog](https://github.com/svalench/django-modelsheet/blob/main/CHANGELOG.md) · [Contributing](https://github.com/svalench/django-modelsheet/blob/main/CONTRIBUTING.md) · [Security](https://github.com/svalench/django-modelsheet/blob/main/SECURITY.md)
