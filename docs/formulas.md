# Formula language

Formulas start with `=` and are parsed as a bounded expression language on both
server and client. There is no Python execution, arbitrary SQL, filesystem or network API.
The server recalculates all saved formulas and validates the resulting model values.

Operators: `+ - * / ^ &`, comparisons `= <> != < <= > >=`, parentheses and unary signs.
Arguments use commas, strings use double quotes (escape a quote by doubling it).
Literals include TRUE, FALSE and NULL. Decimal calculations use 28 significant digits
and ROUND_HALF_EVEN; model Decimal fields round to their configured decimal places.
Powers require integer exponents between -100 and 100.

Functions: IF, IFERROR, ROUND, ABS, MIN, MAX, SUM, AVG, COUNT, UPPER, LOWER, CONCAT,
TODAY, YEAR, MONTH, DAY, ISNULL, IFNULL, COALESCE, QSUM, QAVG, QCOUNT.
IF and null-coalescing functions evaluate only the required branch. IFERROR cannot
swallow complexity/time-budget errors.

`[price]` reads the row's original price, so assigning `=[price]*1.07` is not a cycle.
`B7` addresses the seventh loaded row and second displayed data column. Row addresses
are page-local, even on later pages. References outside the loaded snapshot fail.
`$B$7` locks coordinates when filling/copying; it does not reference an unloaded page.
Positional references see other pending edits and cycles are rejected.

`SUM(B1:B20)` and `SUM(price)` aggregate the loaded view. SUM/AVG/COUNT skip NULL,
empty values and nonnumeric text; COUNT counts numeric values. An empty SUM/COUNT
is zero; empty AVG/MIN/MAX is #N/A. Arithmetic on NULL is #N/A. Empty string and
zero remain distinct from NULL. Date functions use ISO dates; TODAY is pinned to
the UTC date of the view/preview, so midnight does not change a confirmed plan.

Bulk expressions allow named references only. `QSUM([price])`, `QAVG([price])`,
and `QCOUNT([price])` aggregate the immutable candidate data captured by the preview,
not an independently re-run filter at execution time. Bulk assignments all use
the original row and stored preview values; assignment order has no effect.

Errors: #REF!, #CYCLE!, #N/A, #DIV/0!, #VALUE!, #NAME?, #NUM!, #LIMIT!.
AST depth, expression length, evaluation steps/time and exponent size are bounded.
Cross-cell dependency chains are additionally capped at 100 active cells.

Changing the view requires saving/discarding edits. A save binds its snapshot ID
and full view state; stale snapshots fail. In-app clipboard copies track their source
snapshot and reject positional pastes after a view change. External clipboard
formulas are interpreted against the current view.

Formulas are one-time assignments or virtual columns. Expressions are not stored
as ongoing model dependencies. Virtual columns are readonly and cannot be used
for server sorting or filters in this version.
