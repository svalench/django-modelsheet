---
template: playground.html
hide:
  - navigation
  - toc
---

# Try the live table

Edit real cells, write formulas and see the results immediately. No installation or account required. This playground uses the package's **Tabulator grid, edit buffer and Decimal formula engine**.

<div id="modelsheet-live-demo">Loading the live table…</div>

<noscript>This demo requires JavaScript. Enable it to edit the sample table.</noscript>

## Three things to try

1. **Edit a price.** Double-click B1, enter `1500`, then press Enter. The inventory total updates. Undo restores the previous value.
2. **Write a formula.** Select B1, type `=ROUND([price]*1.07,2)` in the formula bar, and press **Apply**. Or use **Prices +7%** to change all six rows at once.
3. **Reference other cells.** Enter `=ROUND(AVG(B2:B6),2)` in B1. Change B2: B1 recalculates. Try `=1/0` to see a formula error; **Save in demo** will keep all pending edits until you fix it.

You can select a range, paste TSV from a spreadsheet, and fill down. Use Ctrl/Cmd+Z to undo, Ctrl/Cmd+Y to redo and Ctrl/Cmd+S to save while the grid is focused. On a small screen, scroll the grid horizontally or use the formula bar.

## How this sandbox behaves

- `[price]` and `[stock]` read the original row values from the last demo save; `B1` and ranges see pending edits.
- **Save in demo** validates all sample rows, commits values to memory and clears undo history. It never writes to a database or browser storage.
- Prices must be nonnegative and below 10 billion; stock must be a whole number from 0 to 1,000,000. Names must be nonempty, unique and at most 100 characters. Status values are `ready` or `order`; try `=IF([stock]>0,"ready","order")` in column D.
- **Reset data** restores the six original products. Refreshing or switching language also starts a fresh demo.

!!! info "A frontend sandbox, not a Django backend"
    This demonstrates editing and calculations. Django permissions, database constraints, row locks, audit history and background operations require the installed package and are not simulated here. Do not use this demo as a persistence or security test.

[Install in your project →](guide/quickstart.md){ .md-button .md-button--primary }
[Explore formula recipes](guide/formulas.md){ .md-button }

[Bundled dependency licenses](assets/playground/THIRD_PARTY_LICENSES.txt).
