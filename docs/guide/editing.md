# Editing the sheet

The sheet edits existing records. A primary key identifies each record; row numbers refer to the loaded page.

## Local edits and Save

Double-click a cell or use the formula bar. Edits remain in a local buffer until **Save** sends one atomic request: every changed row is saved or the entire request rolls back. Validation errors keep your buffer so you can correct and retry. Undo/redo applies before saving.

| Action | Shortcut |
| --- | --- |
| Navigate | Arrows, Tab, Enter |
| Extend selection | Shift + navigation |
| Save | Ctrl/Cmd+S |
| Undo / redo | Ctrl/Cmd+Z / Ctrl/Cmd+Y |
| Fill down | Ctrl/Cmd+D |
| Copy / paste | Ctrl/Cmd+C / Ctrl/Cmd+V |

## Clipboard and fill down

Copy a range from Excel and paste into the active cell. TSV uses tabs for columns and newlines for rows:

```text title="Values for price and stock"
1200.00	10
850.50	25
3400.00	8
```

Read-only cells are skipped with a notification. The remaining changes are saved together.

Use a decimal point and ISO 8601 dates such as `2026-10-24`. Empty pasted values become NULL for nullable fields, empty strings for text fields, or validation errors for other types. Prefix literal text starting with `=` with an apostrophe: `'=SUM(A1:A2)`.

For fill down, enter the top value/formula, select the vertical range, and press Ctrl/Cmd+D. Relative references shift; absolute references stay fixed. See [cell references](formulas.md#cell-references).

## Search, filters and sorting

Search runs on the server against permitted `search_fields`. Filters support AND/OR groups. Multi-sort adds PK as a stable tie-breaker.

Use **Sort**, or Alt+click a header; Alt+Shift+click adds a sort field. Ordinary header clicks select columns. Column widths, visibility and frozen columns are adjustable; view state is stored in the URL.

Save or discard the buffer before changing the page, filter or order. Positional formulas belong to their loaded snapshot; copying them across snapshots is restricted.

## Standard Admin

**Ordinary Admin** transfers conditions, order and page only when they can be represented exactly. Unsupported states block the switch with an explanation. Create and delete records in standard Admin. See [integration boundaries](../extensions.md).
