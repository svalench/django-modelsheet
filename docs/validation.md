# Local validation — 2026-10-24

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
