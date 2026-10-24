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
