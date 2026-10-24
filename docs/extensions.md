# Extension API

Specify dotted class paths in MODELSHEET. Components are instantiated without arguments.

```python
from modelsheet.adapters import FieldAdapter, SaveAdapter
from modelsheet.permissions import PermissionPolicy

class ProjectSaveAdapter(SaveAdapter):
    def validate(self, instance, request):
        super().validate(instance, request)
        # Apply project-wide validation, raising Django ValidationError.

    def save(self, instance, fields, request):
        instance.save()
        # Schedule external work with transaction.on_commit and an idempotent key.

class ProjectPolicy(PermissionPolicy):
    def can_edit_object(self, request, admin, obj):
        return super().can_edit_object(request, admin, obj) and not obj.is_locked
```

- `FieldAdapter`: `supported(field)`, `editable(field)`, `metadata(field)`,
  `serialize(field, instance)`, `parse(field, value)`.
- `SaveAdapter`: `validate(instance, request)`, `save(instance, fields, request)`.
- `PermissionPolicy`: `can_view_field(request, admin, name)`,
  `can_edit_field(request, admin, name)`, `can_view_object(request, admin, obj)`,
  `can_edit_object(request, admin, obj)`.

Policies restrict access in addition to standard Django permissions. Put tenant
and row-scope filtering in `ModelAdmin.get_queryset()` so counts/pagination are
also bounded. Object hooks add per-instance decisions, not query filtering.
Adapters must not commit independently, change databases, or trust client field names.

The compiled frontend offers text and choices editors. Custom field adapters can
use this scalar editor contract; custom JavaScript widgets require rebuilding the
contributor frontend bundle. FK/M2M editing is deliberately disabled in the default adapter.

Own endpoints are excluded from ATOMIC_REQUESTS and open independent short write
transactions. PostgreSQL/MySQL lock fresh row instances before comparing the signed
fingerprint; SQLite requires IMMEDIATE transactions. Database busy/deadlock errors
produce a retryable response. Retry the exact request with its original key.

Unchanged snapshot fields are never assigned from a client payload. The default
save adapter calls the model's full `save()` (not a bulk SQL update), so project hooks
can modify other fields. Audit entries contain explicitly assigned fields and their
post-save values; custom hook side effects outside those fields are not a full database audit.

Admin integration inherits get_queryset, readonly_fields, permissions, scalar search_fields
and ordinary concrete-field ordering. Related search paths, arbitrary custom list filters,
custom display-method ordering, custom forms, save_model and save_related are not
automatically translated. Unsupported list state blocks switching rather than dropping it.
