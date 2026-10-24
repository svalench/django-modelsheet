# Bulk operations

Example: find ready products with stock below 10, increase price by 7%, and set status to `order`.

## 1. Choose the scope

In **Bulk change**, select highlighted page rows or all matching records, including other pages. Querysets, current permissions and the project policy always bound the scope.

```json title="Equivalent API condition"
{"and":[{"field":"stock","op":"lt","value":10},{"field":"status","op":"eq","value":"ready"}]}
```

## 2. Add assignments

| Field | New value |
| --- | --- |
| `price` | `=ROUND([price]*1.07,2)` |
| `status` | `order` |

Every assignment reads original data; assignment order has no effect.

## 3. Preview

The preview freezes all candidate PKs, source versions, calculated changes and errors. The UI shows the count and first 50 results. Newly matching products are not added later. Changing conditions or formulas requires a new preview.

## 4. Confirm

Execution takes the prepared operation ID. Repeating it does not apply the markup twice. Access and row versions are checked again before writing. Changed records produce conflicts; correcting them requires a new plan.

## 5. Review the report

History contains status, counters, row outcomes and errors. Current permissions govern both history and visible fields.

| Mode | Guarantee |
| --- | --- |
| Synchronous | One transaction; all or nothing |
| Background | Commits in chunks; partial completion is possible |

## Large operations

Default background threshold: 5000 rows; chunk size: 200. Without a `BackgroundAdapter`, exceeding the threshold fails before expensive planning. Large previews use the adapter too. A queue and Celery worker are not bundled.

Cancel stops future chunks without undoing completed changes. Resume processes unfinished entries without repeating successful ones. See the [background contract](../background.md) and [HTTP API](../api.md).
