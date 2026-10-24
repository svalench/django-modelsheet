# Permissions and integrity

Django permissions, Admin hooks and field permissions apply to both UI and direct JSON requests.

## Access requirements

Opening a sheet requires an active staff user, `modelsheet.open`, standard model `view` permission and `ModelAdmin.has_view_permission()`. Editing also requires `change`, `has_change_permission()` and the field's edit permission. Superusers can use explicitly enabled/registered models immediately.

## Optional role groups

```bash
python manage.py modelsheet_roles
```

The idempotent command creates groups but assigns no users. Assign groups in Admin and set the account's `is_staff` flag.

| Group | Capabilities |
| --- | --- |
| ModelSheet Viewer | Read sheets |
| ModelSheet Editor | Read and edit |
| ModelSheet Operator | Edit, bulk operations and history |
| ModelSheet Auditor | Read and history |
| ModelSheet Admin | Package capabilities; no superuser status |

Templates grant configured fields. Review sensitive columns before assigning users. Re-running adds grants without removing project-specific permissions.

## Field and row scope

```text
modelsheet.view_field_shop_product_price
modelsheet.edit_field_shop_product_price
modelsheet.bulk_shop_product
modelsheet.history_shop_product
```

Field permissions never grant model-level editing. Hidden fields cannot be used for search, filters, order, formulas or history. A custom `PermissionPolicy` further restricts access.

Use `get_queryset()` for row/tenant scope so counts and pagination are restricted too:

```python title="Example model with owner, title and status fields"
class DocumentAdmin(ModelSheetAdmin):
    sheet_fields = ("title", "status")
    sheet_editable = ("status",)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if request.user.is_superuser:
            return queryset
        return queryset.filter(owner=request.user)
```

The demo Product does not have `owner`; adapt this to your own model.

## Concurrent changes { #concurrency }

Loaded rows carry a signed fingerprint of concrete field values. The server rereads/locks rows and compares fingerprints inside the write transaction. Formulas also check source dependencies. Changes through another Admin form or API cause a conflict rather than silent overwrite.

PostgreSQL/MySQL use row locks. SQLite requires `transaction_mode="IMMEDIATE"` and short transactions. Ordinary saves are atomic; background jobs can partially finish. Fingerprints do not track every intermediate state or arbitrary related-table changes.

## Save hooks

The default adapter calls `full_clean()` and `instance.save()`, including model signals. Custom Admin forms, `save_model()` and `save_related()` require a [SaveAdapter](../extensions.md). External effects need their own idempotency. Model changes and the journal must share the `default` database.
