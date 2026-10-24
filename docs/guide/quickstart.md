# Installation in 5 minutes

Connect an existing `shop.Product` model: edit price and stock, keep the name read-only, and compute inventory value.

## 1. Install the alpha

```bash
python -m pip install django-modelsheet==0.3.0a1
```

The package includes compiled JavaScript/CSS. Installing it requires no Node.js, npm or CDN. To try without an existing project, use the [demo](demo.md).

## 2. Enable the model

```python title="settings.py"
INSTALLED_APPS += ["modelsheet"]
MODELSHEET = {"models": ["shop.Product"], "page_size": 200}
```

Both the allowlist and `ModelSheetAdmin` registration are required.

=== "SQLite"

    Safe writes require IMMEDIATE transactions:

    ```python
    DATABASES["default"].setdefault("OPTIONS", {})
    DATABASES["default"]["OPTIONS"]["transaction_mode"] = "IMMEDIATE"
    ```

=== "PostgreSQL / MySQL"

    The package uses the `default` connection and row locks inside transactions. MySQL tables must use InnoDB.

## 3. Register the Admin

```python title="shop/admin.py"
from django.contrib import admin
from modelsheet.admin import ModelSheetAdmin
from .models import Product


@admin.register(Product)
class ProductAdmin(ModelSheetAdmin):
    list_display = ("name", "price", "stock")
    search_fields = ("name",)
    sheet_fields = ("name", "price", "stock")
    sheet_editable = ("price", "stock")
    sheet_computed_fields = {
        "inventory_value": "=[price]*[stock]",
    }
```

If already registered, change the base class of the existing Admin; do not register the model twice.

| Attribute | Purpose |
| --- | --- |
| `sheet_fields` | Available model fields |
| `sheet_editable` | Editable subset |
| `sheet_computed_fields` | Read-only virtual columns: name → formula |
| `search_fields` | Searchable visible scalar fields |

## 4. Apply migrations

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check
```

Migrations create view snapshots and the operation journal. Your model needs no additional fields or base class.

## 5. Open the sheet

Sign in as a superuser and choose **Spreadsheet** in the model list, or visit `/admin/shop/product/sheet/`. Edit a price, press **Save**, then reload to verify it persisted. For staff accounts, configure [permissions](permissions.md).

Next: [editing](editing.md), [formula recipes](formulas.md), [bulk operations](bulk.md), [configuration](configuration.md).
