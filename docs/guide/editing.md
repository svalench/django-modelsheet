# Editing the sheet

The sheet edits existing records. A primary key identifies each record; row numbers refer to the loaded page.

## Local edits and Save

Double-click a cell or use the formula bar. Edits remain in a local buffer until **Save** sends one atomic request: every changed row is saved or the entire request rolls back. Validation errors keep your buffer so you can correct and retry. Undo/redo applies before saving.

| Action | Shortcut |
| --- | --- |
| Navigate | Arrows, Tab |
| Edit the selected cell | F2, typing, Enter or double-click |
| Extend selection | Shift + navigation |
| Save | Ctrl/Cmd+S |
| Undo / redo | Ctrl/Cmd+Z / Ctrl/Cmd+Y |
| Fill down / fill right | Ctrl/Cmd+D / Ctrl/Cmd+R |
| Copy / paste | Ctrl/Cmd+C / Ctrl/Cmd+V |

## Clipboard and fill down

Copy a range from Excel and paste into the active cell. TSV uses tabs for columns and newlines for rows:

```text title="Values for price and stock"
1200.00	10
850.50	25
3400.00	8
```

Read-only cells are skipped with a notification. The remaining changes are saved together.

Decimals accept a point or a comma. Dates and times use the field editor and are shown in the active locale; the stored value stays ISO 8601 (`2026-10-24`). Empty pasted values become NULL for nullable fields, empty strings for text fields, or validation errors for other types. Prefix literal text starting with `=` with an apostrophe: `'=SUM(A1:A2)`. Booleans use a checkbox, choices use a list, and foreign keys use an autocomplete that only offers rows the related ModelAdmin allows you to view. Many-to-many labels are read-only.

For fill down, enter the top value/formula, select the vertical range, and press Ctrl/Cmd+D. Relative references shift; absolute references stay fixed. See [cell references](formulas.md#cell-references).

## Search, filters and sorting

Search runs on the server against permitted `search_fields`. Press Enter or **Search**. Filters use localized operators and typed values; the active filter is shown as chips, not raw JSON. Multi-sort adds PK as a stable tie-breaker.

Use **Sort**, or Alt+click a header; Alt+Shift+click adds a sort field. Ordinary header clicks select columns. Column widths, visibility and frozen columns are adjustable; view state is stored in the URL.

Save or discard the buffer before changing the page, filter or order. Positional formulas belong to their loaded snapshot; copying them across snapshots is restricted.

## Standard Admin

**Ordinary Admin** transfers conditions, order and page only when they can be represented exactly. Unsupported states block the switch with an explanation.

**Add row** and **Delete rows** join the same atomic save when the user has the model's add or delete permission. **Revert save** asks the server to undo the last save when fingerprints still match. **Find** replaces text on the loaded page through the local buffer. **Views** stores the filter, sort, columns, freeze and widths in this browser and can save a shared view on the server. **Export** downloads the whole filtered view. **Import** uploads a CSV or XLSX into the bulk preview. See [integration boundaries](../extensions.md).
