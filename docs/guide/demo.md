# Demo project

The repository includes products, categories and orders. The seed command creates 500 products for trying pagination, filters and bulk operations.

## Run locally

```bash
 git clone https://github.com/svalench/django-modelsheet.git
 cd django-modelsheet
 python -m venv .venv
 source .venv/bin/activate
 python -m pip install -e '.[test]'
 python manage.py migrate
 python manage.py seed_demo --create-user
 python manage.py runserver
```

On Windows, activate with `.venv\Scripts\activate`. Open `http://127.0.0.1:8000/admin/shop/product/sheet/`.

!!! warning "Local credentials only"
    `--create-user` creates `admin` / `admin`. The demo settings and credentials are for local development.

Compiled assets are included. Rebuild only when modifying the frontend:

```bash
cd frontend
npm ci
npm run build
```

## Try three scenarios

### Model validation

Set a product's price below its `cost_price` and press **Save**. Validation fails and the buffer stays intact. Correct the price and save again.

### Range formulas

Enter `=ROUND([price]*1.07,2)` in the first price cell, select a vertical range, fill down with Ctrl/Cmd+D, inspect the results and save.

### Conflict with ordinary Admin

Load a row in the sheet, edit the same product in a standard Admin form in another tab, then save the pending sheet edits. The changed source state causes a conflict instead of a silent overwrite. Reload current data and reapply your changes. See [concurrency](permissions.md#concurrency).
