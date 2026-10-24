---
template: home.html
hide:
  - navigation
  - toc
  - edit
  - footer
---

<div class="ms-hero" markdown>
<div class="ms-intro" markdown>
<span class="ms-eyebrow">DJANGO ADMIN, IN A SPREADSHEET</span>

# More data.<br>Less busywork.

Edit your models like a spreadsheet: select ranges, write formulas and preview bulk changes before saving.

<div class="ms-actions" markdown>
[Get started →](guide/quickstart.md){ .md-button .md-button--primary }
[Try live demo](playground.md){ .md-button }
</div>

<div class="ms-install"><span>$</span><code>pip install django-modelsheet==0.3.0a1</code></div>
<div class="ms-facts"><span>MIT · open source</span><span>No Node.js required to install</span><span>0.3.0a1 · alpha</span></div>
</div>

<div class="ms-preview" aria-label="Interactive pricing example">
<div class="ms-window"><span class="ms-window-dots">● ● ●</span><span>shop / product / sheet</span><span class="ms-live">EXAMPLE</span></div>
<div class="ms-sheet-title"><strong>Products</strong><span>3 records · local buffer</span></div>
<div class="ms-formula"><span>fx</span><code id="demo-expression">=[price]*1.07</code></div>
<div class="ms-grid-scroll"><table class="ms-grid"><thead><tr><th></th><th>A <span>Name</span></th><th>B <span>Price</span></th><th>C <span>Result</span></th></tr></thead><tbody>
<tr><td>1</td><td>Ceramic cup</td><td>1 200.00</td><td class="ms-selected" data-result="0">1 284.00</td></tr>
<tr><td>2</td><td>Linen tote bag</td><td>850.00</td><td class="ms-selected" data-result="1">909.50</td></tr>
<tr><td>3</td><td>Desk lamp</td><td>3 400.00</td><td class="ms-selected" data-result="2">3 638.00</td></tr>
</tbody></table></div>
<div class="ms-example-controls" aria-label="Choose a formula example"><button type="button" data-example="markup" aria-pressed="true">Price +7%</button><button type="button" data-example="discount" aria-pressed="false">10% discount</button><button type="button" data-example="round" aria-pressed="false">Rounding</button></div>
<div class="ms-sheet-bottom"><span><i></i> Preview · no data is saved</span><span>Decimal / 2 places</span></div>
</div>
</div>

<div class="ms-section-label">A FAMILIAR GRID. YOUR PROJECT’S RULES.</div>

<div class="ms-feature-grid" markdown>
<div class="ms-feature" markdown>
<span class="ms-feature-number">01 / EDITING</span>

### From one cell to a whole range

Paste from Excel, fill down and undo local edits. Save the entire buffer with one button.

[Working with the sheet →](guide/editing.md)
</div>
<div class="ms-feature" markdown>
<span class="ms-feature-number">02 / FORMULAS</span>

### Calculations next to your data

`=[price]*1.07`, `IF`, `ROUND`, aggregates and computed columns. The server recalculates before writing.

[Formula recipes →](guide/formulas.md)
</div>
<div class="ms-feature" markdown>
<span class="ms-feature-number">03 / BULK OPERATIONS</span>

### Preview first. Apply second.

Freeze the record set, inspect the first 50 results and confirm the prepared plan. Track the outcome in history.

[Raise prices by 7% →](guide/bulk.md)
</div>
</div>

<div class="ms-connect" markdown>
<div markdown>
<span class="ms-eyebrow">A FEW LINES IN ADMIN.PY</span>

## Your models.<br>A new way to work.

No extra model fields. Uses existing Admin sessions, Django permissions and `full_clean()` validation.

[Complete setup example →](guide/quickstart.md)
</div>
<div markdown>
```python title="shop/admin.py"
@admin.register(Product)
class ProductAdmin(ModelSheetAdmin):
    sheet_fields = ("name", "price", "stock")
    sheet_editable = ("price", "stock")
    sheet_computed_fields = {
        "inventory_value": "=[price]*[stock]",
    }
```
</div>
</div>

<div class="ms-route-grid" markdown>
<div markdown>
### First time here?

[Installation](guide/quickstart.md) · [Demo project](guide/demo.md) · [Configuration](guide/configuration.md)
</div>
<div markdown>
### Integrating with your project?

[Permissions](guide/permissions.md) · [Adapters](extensions.md) · [HTTP API](api.md)
</div>
</div>

!!! info "Public alpha · 0.3.0a1"
    The package is available on [PyPI](https://pypi.org/project/django-modelsheet/0.3.0a1/). Creating and deleting records stays in standard Admin. Before adopting, read the [release limitations](guide/releases.md) and test the integration on your own models.
