# Local validation — 0.3.0 · 2026-10-25

Version **0.3.0** is prepared; no package upload, tag, push or release was performed.
Existing uncommitted changes were preserved. Environment: macOS arm64, Python 3.13.7,
Django 6.0.4, SQLite, Node 22.19.0 and npm 10.9.3.

| Check | Result |
| --- | --- |
| Python tests, including preview expiry and migration regressions | 188 passed |
| Frontend unit tests, including special string primary keys | 75 passed |
| Admin browser scenarios | 23 passed |
| TypeScript, production and playground builds | Passed |
| Ruff, Django checks, migration consistency, release versions | Passed |
| Locale coverage | 19 pages × 3 languages |
| Strict documentation build | Passed |
| Playground browser scenarios | 3 passed |
| Production/demo asset reproducibility | Identical rebuild |
| wheel/sdist metadata, isolated wheel install and collectstatic | Passed |
| Upgrade from the published 0.3.0a2 wheel | Passed; history, items and snapshots retained |

Preview deadlines are fixed at preparation completion. Cancel/resume cannot refresh
an expired deadline; empty plans keep their original membership. Migration `0002`
conservatively expires old unconfirmed plans while retaining audit data. String keys
such as `__proto__` and `constructor` remain ordinary data through editing, undo/redo
and saving. Earlier permission, aggregate-cache and stale-response fixes remain included.

The package smoke environment reuses system dependencies and runs outside the repository.
The upgrade check downloads the published previous wheel and uses an isolated database.
PostgreSQL/MySQL and other Python/Django versions were not run locally. The reusable
CI configures 16 combinations and gates publishing on all of them, plus browser,
package/upgrade and documentation checks. The final release commit still needs a green
remote run; previous runs do not verify these uncommitted changes.

The earlier report below is retained as historical evidence, not the current release result.

## Local validation — 2026-10-24

!!! info "Historical local report"
    This records checks before the public release. Version 0.3.0a1 is now available on [PyPI](https://pypi.org/project/django-modelsheet/0.3.0a1/). For subsequent remote runs, consult [GitHub Actions](https://github.com/svalench/django-modelsheet/actions).

Package: **0.3.0a1**. Environment: macOS arm64, Python 3.13.7, Django 6.0.4,
SQLite, Node 22.19.0, npm 10.9.3. Frontend dependency versions are pinned in
frontend/package-lock.json. Browser tests used an existing Chromium installation
through MODELSHEET_CHROMIUM, with Playwright's local Django test server.

| Check | Result |
| --- | --- |
| pytest backend/formula/permission/transaction tests | 102 passed |
| Vitest buffer/formula tests | 57 passed |
| Playwright browser scenarios | 10 passed |
| TypeScript check and production Vite bundle | Passed |
| Ruff | Passed |
| Django system checks | Passed |
| Missing migration detection | No changes detected |
| wheel and sdist build | Passed |
| twine metadata checks | Both distributions passed |
| Wheel installation outside repository import path | Passed |
| Installed wheel migrations and collectstatic | Passed without Node.js |
| Wheel templates, compiled assets, dependency notices | Present |
| sdist contents | No node_modules or browser reports |

The package smoke test creates a new virtualenv with access to existing system
dependencies, installs the wheel without resolving dependencies, then runs outside
the repository with a separate database/settings module. It verifies package contents
and integration, not a fresh download of Django from an index.

Browser coverage includes formula edit/undo/redo/save/reload, readonly clipboard
paste, preview/confirmation, failed-save retention, Admin pagination/search roundtrip,
50-column virtualization, arrow/Tab/Enter/Shift navigation, server sorting, Ctrl+D,
and rejecting copied positional formulas after a page change.

Backend coverage includes permission bypass attempts, hidden fields/history masking,
read-only audit Admin, conflicts with an actual ordinary Admin save, atomic rollback,
concurrent saves through separate connections, duplicate keys, frozen bulk membership,
dependency conflicts, background cancellation/resume, duplicate delivery, partial results,
and permission revocation between worker chunks.

## Recorded benchmarks

The benchmark creates a temporary SQLite file with 50 scalar data columns and
returns 200-row windows. Ten samples were measured per case. Backend latency
includes snapshot persistence and exact count; it excludes HTTP/browser overhead.
These are local observations, not release-wide performance guarantees. The runs
were not isolated from other development/test activity; CPU model/RAM were not
available through the sandbox's hardware-query interface.

| Dataset / operation | Median | p95 |
| --- | ---: | ---: |
| 100k / first 200-row page | 29.94 ms | 40.70 ms |
| 100k / fifth page | 33.75 ms | 40.94 ms |
| 100k / exact indexed filter | 2.99 ms | 4.80 ms |
| 100k / substring search | 46.60 ms | 57.19 ms |
| 1M / first 200-row page | 36.07 ms | 300.50 ms |
| 1M / fifth page | 37.32 ms | 60.13 ms |
| 1M / exact indexed filter | 2.15 ms | 3.37 ms |
| 1M / substring search | 377.84 ms | 442.33 ms |

Each case used four SQL queries per call. Raw results are in
[benchmark-100k.json](benchmark-100k.json) and [benchmark-1m.json](benchmark-1m.json).
See [benchmark instructions](benchmarks.md) to reproduce them.

## Checks that still require an external environment

- PostgreSQL/MySQL servers and Docker were unavailable locally. The CI workflow
  configures service containers and runs the same transactional tests against both.
- Django 5.2/6.1 and the other Python versions are configured in CI but were not run
  in this local environment. The compatibility matrix is a target until those jobs pass.
- PyPI name availability could not be established: the direct probe encountered
  certificate/transport failures, and the web fetch was unavailable. The read-only
  scripts/check_pypi_name.py probe is provided for a release environment with working
  trusted TLS access. No name reservation is implied.
- No package was uploaded to PyPI/TestPyPI, no remote CI run or repository push was
  performed, and no upgrade from a prior published release was possible for this
  initial distribution. The release procedure is documented in releasing.md.
