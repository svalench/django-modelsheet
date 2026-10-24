# Formula recipes

Start with `=`. The client previews the result; the server recalculates and validates it before writing.

!!! info "One-time assignments"
    A model field stores the calculated value, not a persistent dependency. Use `sheet_computed_fields` for display-only calculated columns.

## Recipes

| Goal | Formula |
| --- | --- |
| Raise prices by 7% | `=ROUND([price]*1.07,2)` |
| Apply a 10% discount | `=ROUND([price]*0.9,2)` |
| Inventory value | `=[price]*[stock]` |
| Status from stock | `=IF([stock]>0,"ready","order")` |
| Replace NULL | `=IFNULL([note],"No note")` |
| Uppercase name | `=UPPER([name])` |
| Year from date | `=YEAR([available_on])` |
| Loaded prices total | `=SUM(price)` |
| Handle division errors | `=IFERROR([price]/[stock],0)` |

Fields must exist and be visible to the user. Status strings must match the field's choices.

## Original row values

`[price]` reads the original row value, so assigning `=[price]*1.07` to price does not form a cycle. `1200.00` becomes `1284.00`. All bulk assignments also use original data, regardless of assignment order.

## Cell references { #cell-references }

| Reference | Meaning |
| --- | --- |
| `B7` | Seventh loaded row, second displayed data column |
| `$B$7` | Fixed row and column when copying |
| `B$7` / `$B7` | Fixed row / fixed column |
| `B1:B20` | Current snapshot range |

Positional references see pending edits. Out-of-snapshot references yield `#REF!`; cycles yield `#CYCLE!`. On later pages, `B7` still means that page's seventh row.

## Computed columns

```python
sheet_computed_fields = {
    "inventory_value": "=[price]*[stock]",
    "availability": '=IF([stock]>0,"In stock","On order")',
}
```

Columns are read-only and cannot be used for server sorting or filtering in this version.

## Aggregates and precision

`SUM`, `AVG`, `COUNT` cover the loaded range, not every database row. `COUNT` counts numeric values. NULL, empty values and nonnumeric text are skipped.

Bulk formulas allow named references only. `QSUM`, `QAVG`, `QCOUNT` cover the immutable preview set, for example `=[price]/QSUM([price])`.

Decimal uses 28 significant digits and `ROUND_HALF_EVEN`; model fields round to their `decimal_places`. `ROUND(8.5,0)` is `8`, `ROUND(9.5,0)` is `10`.

| Error | Meaning |
| --- | --- |
| `#REF!` | Unavailable/out-of-snapshot reference |
| `#CYCLE!` | Dependency cycle |
| `#DIV/0!` | Division by zero |
| `#VALUE!` | Incompatible types |
| `#NAME?` | Unknown function/name |
| `#N/A` | Missing calculation input |
| `#NUM!` | Invalid numeric result |
| `#LIMIT!` | Computation budget exceeded |

See the full [formula specification](../formulas.md).
