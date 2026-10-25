# Benchmarks

`python scripts/benchmark.py --rows 100000 --repeats 10` creates an isolated
temporary SQLite database with 50 data columns, seeds it, and measures the first
and fifth 200-row pages, an exact indexed filter, and a substring search. Repeat
with `--rows 1000000`. It prints Python/Django/platform, dataset size, SQL counts,
median/p95 and seed duration. The temporary database is deleted after the run.

Capture CPU/RAM/storage details alongside output when comparing machines. Do not
compare substring search to an indexed equality lookup. General substring search
has no universal subsecond guarantee. PostgreSQL/MySQL production benchmarks need
their actual indexes, collation, query shape, hardware and representative data.

Browser E2E includes a separate 100k-result / 50-column fixture with a 200-row
loaded window. That test records scroll frame intervals and bounded DOM rows;
it does not claim that a browser holds all 100k records. API timing and scroll
timing measure different parts of the system.

`python scripts/benchmark_bulk.py --rows 100 500 1000 --repeats 3` measures complete
bulk previews containing `QSUM` and repeated `QCOUNT` calls in a separate temporary
SQLite database. It compares the same plan builder with aggregate caching enabled
and disabled, reporting median preview time and the number of values visited by
aggregate calculations. This isolates caching, rather than comparing releases.
For this fixed formula set, cached aggregate visits grow linearly with row count.
The script adjusts the formula step limit to the requested dataset size; production
limits remain unchanged. Model validation and database writes are included in timing.
