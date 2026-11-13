import hashlib
import json
import re
from contextlib import contextmanager
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, connections, transaction
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac
from django.utils.translation import gettext_lazy as _

from .adapters import serialize
from .conf import component, config
from .errors import SheetError
from .formula import FormulaError, evaluate, parse, references
from .metadata import fields_for, require_fields, require_object_editable
from .models import Operation, OperationItem, SavedView, ViewSnapshot
from .permissions import require_access, scope_history
from .query import cursor_values, encode_cursor, parse_state, queryset, sort_specs
from .registry import is_enabled


def digest(value):
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode()
    ).hexdigest()


def version(obj):
    values = {f.attname: serialize(f.value_from_object(obj)) for f in obj._meta.concrete_fields}
    return salted_hmac(
        "modelsheet.row", json.dumps(values, sort_keys=True, default=str), algorithm="sha256"
    ).hexdigest()


def original_values(obj, fields):
    adapter = component("field_adapter")
    return {name: adapter.serialize(obj._meta.get_field(name), obj) for name in fields}


def ast(expression):
    options = config()["formula"]
    return parse(expression, max_length=options["max_length"], max_depth=options["max_depth"])


def compute(node, **context):
    options = config()["formula"]
    return evaluate(
        node, max_steps=options["max_steps"], timeout_ms=options["timeout_ms"], **context
    )


@contextmanager
def write_transaction():
    connection = connections["default"]
    if (
        connection.vendor == "sqlite"
        and connection.settings_dict.get("OPTIONS", {}).get("transaction_mode", "").upper()
        != "IMMEDIATE"
    ):
        raise SheetError(
            "sqlite_configuration",
            _("SQLite writes require OPTIONS.transaction_mode=IMMEDIATE."),
            status=503,
        )
    if connection.in_atomic_block:
        raise SheetError(
            "nested_transaction", _("Sheet writes require an independent transaction."), status=503
        )
    with transaction.atomic(using="default"):
        yield


def check_model(request, admin, **kwargs):
    if not is_enabled(admin):
        raise SheetError("not_enabled", _("This model is not enabled."), status=404)
    require_access(request, admin, **kwargs)


def row_allowed(request, admin, obj, *, edit=False):
    policy = component("permission_policy")
    if not policy.can_view_object(request, admin, obj) or (
        edit and not policy.can_edit_object(request, admin, obj)
    ):
        raise SheetError("forbidden", _("Row is unavailable for this operation."), status=403)


def computed_columns(admin, fields):
    result = []
    for name, definition in admin.sheet_computed_fields.items():
        formula = definition if isinstance(definition, str) else definition["formula"]
        try:
            refs = references(ast(formula))
            if (
                refs["fields"] <= fields.keys()
                and refs["columns"] <= fields.keys()
                and not refs["query"]
            ):
                result.append(
                    {
                        "name": name,
                        "label": name,
                        "type": "computed",
                        "editable": False,
                        "formula": formula,
                    }
                )
        except FormulaError:
            continue
    return result


def model_perm(user, action, model):
    return user.has_perm(f"{model._meta.app_label}.{action}_{model._meta.model_name}")


def schema(request, admin):
    check_model(request, admin)
    fields = fields_for(request, admin)
    from .permissions import allowed

    model = admin.model
    can_change = model_perm(request.user, "change", model) and admin.has_change_permission(request)
    return {
        "fields": list(fields.values()),
        "computed": computed_columns(admin, fields),
        "page_size": config()["page_size"],
        "max_save_rows": config()["max_save_rows"],
        "formula_limits": config()["formula"],
        "timezone": timezone.get_current_timezone_name(),
        "can_bulk": allowed(request.user, "bulk", model) and can_change,
        "can_history": allowed(request.user, "history", model),
        "can_add": model_perm(request.user, "add", model) and admin.has_add_permission(request),
        "can_delete": model_perm(request.user, "delete", model)
        and admin.has_delete_permission(request),
        "can_undo": allowed(request.user, "undo", model) and can_change,
        "can_import": allowed(request.user, "bulk", model) and can_change,
        "pagination": config()["pagination"],
        "xlsx": importable("openpyxl"),
        "model": model._meta.label,
        "title": str(model._meta.verbose_name_plural),
    }


def importable(module):
    import importlib.util

    return importlib.util.find_spec(module) is not None


def object_filter_mode(request, admin):
    """model — права только на модель; queryset — SQL; object — построчная проверка."""
    from django.contrib.admin.options import ModelAdmin

    from .permissions import PermissionPolicy

    policy = component("permission_policy")
    if type(policy).restrict_queryset is not PermissionPolicy.default_restrict_queryset:
        return "queryset"
    view = admin.has_view_permission
    func = getattr(view, "__func__", None)
    admin_default = func is ModelAdmin.has_view_permission
    policy_default = type(policy).can_view_object is PermissionPolicy.default_can_view_object
    if admin_default and policy_default:
        return "model"
    return "object"


def visible_page(request, admin, qs, state):
    mode = object_filter_mode(request, admin)
    if mode == "queryset":
        qs = component("permission_policy").restrict_queryset(request, admin, qs)
    limit = state["limit"]
    exact = config()["count_mode"] == "exact"
    if mode != "object":
        if state.get("pagination") == "keyset":
            window = list(qs[: limit + 1])
            return window[:limit], qs.count() if exact else None, len(window) > limit
        offset = state["offset"]
        return (
            list(qs[offset : offset + limit]),
            qs.count() if exact else None,
            qs[offset + limit : offset + limit + 1].exists(),
        )
    return scan_visible(request, admin, qs, state, exact=exact)


def scan_visible(request, admin, qs, state, *, exact):
    """Страница без дыр: скрытые объекты не занимают слот и не попадают в count."""
    policy = component("permission_policy")
    limit = state["limit"]
    offset = 0 if state.get("pagination") == "keyset" else state["offset"]
    page, skipped, total, has_next = [], 0, 0, False
    start, chunk = 0, max(200, limit)
    while True:
        batch = list(qs[start : start + chunk])
        if not batch:
            break
        for obj in batch:
            if not policy.can_view_object(request, admin, obj):
                continue
            total += 1
            if skipped < offset:
                skipped += 1
                continue
            if len(page) < limit:
                page.append(obj)
            else:
                has_next = True
                if not exact:
                    return page, None, True
        if len(batch) < chunk:
            break
        start += chunk
    return page, total if exact else None, has_next


def row_payload(obj, fields):
    adapter = component("field_adapter")
    labels = {}
    for name in fields:
        field = obj._meta.get_field(name)
        if field.is_relation:
            labels[name] = adapter.display(field, obj)
    return {
        "pk": str(obj.pk),
        "version": version(obj),
        "values": original_values(obj, fields),
        "labels": labels,
    }


def rows(request, admin, params):
    check_model(request, admin)
    fields, state = fields_for(request, admin), parse_state(params)
    columns = state["columns"]
    if columns is None:
        columns = list(fields)
        state["columns"] = columns
    if not isinstance(columns, list) or len(columns) != len(set(columns)):
        raise SheetError("invalid_columns", _("Columns must be a unique field list."))
    require_fields(columns, fields)
    qs = queryset(request, admin, fields, state)
    page, total, has_next = visible_page(request, admin, qs, state)
    result = [row_payload(obj, fields) for obj in page]
    snapshot_rate_limit(request)
    snapshot = ViewSnapshot.objects.create(
        user=request.user,
        model_label=admin.model._meta.label,
        site_name=admin.admin_site.name,
        state=state,
        rows=result,
        columns=columns,
    )
    prune_snapshots(request)
    next_cursor = None
    if state.get("pagination") == "keyset" and has_next and page:
        next_cursor = encode_cursor(cursor_values(page[-1], sort_specs(state, fields)))
    return {
        "rows": result,
        "snapshot": str(snapshot.pk),
        "state": state,
        "today": timezone.now().date().isoformat(),
        "count": total,
        "has_next": has_next,
        "next_cursor": next_cursor,
    }


def get_snapshot(request, admin, snapshot_id):
    try:
        snapshot = ViewSnapshot.objects.get(
            pk=snapshot_id,
            user=request.user,
            model_label=admin.model._meta.label,
            site_name=admin.admin_site.name,
        )
    except (ViewSnapshot.DoesNotExist, ValidationError, ValueError):
        raise SheetError(
            "invalid_snapshot", _("View snapshot is unavailable."), status=409
        ) from None
    if snapshot.created_at < timezone.now() - timedelta(seconds=config()["snapshot_ttl_seconds"]):
        raise SheetError("expired_snapshot", _("Reload the sheet before saving."), status=409)
    return snapshot


def operation_key(payload):
    key = payload.get("idempotency_key")
    if not isinstance(key, str) or not 1 <= len(key) <= 128:
        raise SheetError("invalid_key", _("An idempotency_key of 1–128 characters is required."))
    return key


def existing_operation(request, admin, key, request_hash):
    op = Operation.objects.filter(
        user=request.user,
        model_label=admin.model._meta.label,
        site_name=admin.admin_site.name,
        idempotency_key=key,
    ).first()
    if op and op.request_hash != request_hash:
        raise SheetError(
            "idempotency_conflict", _("This key belongs to a different request."), status=409
        )
    return op


def rate_limit(request):
    if (
        Operation.objects.filter(
            user=request.user, created_at__gte=timezone.now() - timedelta(minutes=1)
        ).count()
        >= config()["max_operations_per_minute"]
    ):
        raise SheetError("rate_limit", _("Too many operations. Try again later."), status=429)


def snapshot_rate_limit(request):
    """Every GET /rows stores a snapshot, so reads are throttled separately from writes."""
    if (
        ViewSnapshot.objects.filter(
            user=request.user, created_at__gte=timezone.now() - timedelta(minutes=1)
        ).count()
        >= config()["max_snapshots_per_minute"]
    ):
        raise SheetError("rate_limit", _("Too many sheet reloads. Try again later."), status=429)


def prune_snapshots(request):
    """Keep only the newest snapshots of this user and drop expired ones."""
    settings = config()
    mine = ViewSnapshot.objects.filter(user=request.user)
    mine.filter(
        created_at__lt=timezone.now() - timedelta(seconds=settings["snapshot_ttl_seconds"])
    ).delete()
    keep = list(
        mine.order_by("-created_at").values_list("pk", flat=True)[
            : settings["max_snapshots_per_user"]
        ]
    )
    mine.exclude(pk__in=keep).delete()


def validate_values(obj, values, request, fields):
    adapter = component("field_adapter")
    for name, value in values.items():
        try:
            field = obj._meta.get_field(name)
            parsed = adapter.parse(field, value)
            # FK хранит ключ в attname: присваивание поля ждёт экземпляр модели.
            setattr(obj, field.attname if field.many_to_one else name, parsed)
        except (ValidationError, ValueError, TypeError, ArithmeticError) as exc:
            raise SheetError(
                "invalid_value",
                _("Value cannot be parsed for this field."),
                pk=str(obj.pk),
                field=name,
            ) from exc
    try:
        component("save_adapter").validate(obj, request)
    except ValidationError as exc:
        errors = getattr(exc, "message_dict", {"__all__": exc.messages})
        visible = {key: messages for key, messages in errors.items() if key in fields}
        raise SheetError(
            "validation", _("Row validation failed."), pk=str(obj.pk), details=visible
        ) from exc


def save_object(obj, names, request):
    try:
        component("save_adapter").save(obj, names, request)
        obj.refresh_from_db()
    except IntegrityError:
        raise SheetError(
            "constraint_conflict",
            _("A database constraint prevented saving."),
            pk=str(obj.pk),
            status=409,
        ) from None
    except ValidationError:
        raise SheetError(
            "validation", _("The model save hook rejected this row."), pk=str(obj.pk)
        ) from None


def cell_coordinates(address):
    match = re.fullmatch(r"\$?([A-Z]+)\$?([1-9][0-9]*)", address.upper())
    if not match:
        raise FormulaError("#REF!")
    col = 0
    for letter in match[1]:
        col = col * 26 + ord(letter) - 64
    return int(match[2]) - 1, col - 1


class SheetCalculation:
    def __init__(self, snapshot, changes, fields):
        self.snapshot, self.fields = snapshot, fields
        # Never trust stored values of fields the user can no longer see.
        self.rows = {
            row["pk"]: {
                **row,
                "values": {k: v for k, v in row.get("values", {}).items() if k in fields},
            }
            for row in snapshot.rows
        }
        self.changes = {str(c["pk"]): c["values"] for c in changes}
        self.cache, self.visiting, self.dependencies = {}, set(), set()

    def value(self, pk, field):
        key = pk, field
        if key in self.cache:
            return self.cache[key]
        if key in self.visiting:
            raise FormulaError("#CYCLE!")
        if len(self.visiting) > 100:
            raise FormulaError("#LIMIT!")
        if pk not in self.rows or field not in self.fields:
            raise FormulaError("#REF!")
        self.dependencies.add(pk)
        self.visiting.add(key)
        try:
            raw = self.changes.get(pk, {}).get(field, self.rows[pk]["values"].get(field))
            changed = field in self.changes.get(pk, {})
            if changed and isinstance(raw, str) and raw.startswith("'="):
                result = raw[1:]
            elif changed and isinstance(raw, str) and raw.startswith("="):
                node = ast(raw)
                refs = references(node)
                require_fields(refs["fields"] | refs["columns"], self.fields)
                result = compute(
                    node,
                    fields=self.rows[pk]["values"],
                    cell=self.cell,
                    column=self.column,
                    today=self.snapshot.created_at.date(),
                )
            else:
                result = raw
            self.cache[key] = result
            return result
        finally:
            self.visiting.remove(key)

    def cell(self, start, end=None):
        a, b = cell_coordinates(start), cell_coordinates(end or start)
        values = []
        if max(a[0], b[0]) >= len(self.snapshot.rows) or max(a[1], b[1]) >= len(
            self.snapshot.columns
        ):
            raise FormulaError("#REF!", "Reference is outside the loaded view")
        for row in range(min(a[0], b[0]), max(a[0], b[0]) + 1):
            for col in range(min(a[1], b[1]), max(a[1], b[1]) + 1):
                values.append(self.value(self.snapshot.rows[row]["pk"], self.snapshot.columns[col]))
        return values if end else values[0]

    def column(self, name):
        require_fields([name], self.fields)
        return [self.value(row["pk"], name) for row in self.snapshot.rows]


def concrete_values(obj):
    adapter = component("field_adapter")
    values = {}
    for field in obj._meta.concrete_fields:
        if field.primary_key or not adapter.supported(field):
            continue
        values[field.name] = adapter.serialize(field, obj)
    return values


def structural_changes(payload, fields):
    changes = payload.get("changes", [])
    creates = payload.get("creates", [])
    deletes = payload.get("deletes", [])
    if not isinstance(changes, list) or not isinstance(creates, list) or not isinstance(deletes, list):
        raise SheetError("invalid_changes", _("Each change requires pk, version and values."))
    total = len(changes) + len(creates) + len(deletes)
    if not 1 <= total <= config()["max_save_rows"]:
        raise SheetError("save_limit", _("Invalid number of changed rows."))
    seen = set()
    for change in changes:
        if (
            not isinstance(change, dict)
            or set(change) != {"pk", "version", "values"}
            or not isinstance(change["values"], dict)
            or not change["values"]
        ):
            raise SheetError("invalid_changes", _("Each change requires pk, version and values."))
        pk = str(change["pk"])
        if pk in seen:
            raise SheetError("duplicate_row", _("Submit one change per row."))
        seen.add(pk)
        require_fields(change["values"], fields, edit=True)
    temp_ids = set()
    for item in creates:
        if (
            not isinstance(item, dict)
            or set(item) != {"temp_id", "values"}
            or not isinstance(item["temp_id"], str)
            or not 1 <= len(item["temp_id"]) <= 64
            or not isinstance(item["values"], dict)
        ):
            raise SheetError("invalid_changes", _("Each new row requires temp_id and values."))
        if item["temp_id"] in temp_ids:
            raise SheetError("duplicate_row", _("Submit one change per row."))
        temp_ids.add(item["temp_id"])
        require_fields(item["values"], fields, edit=True)
        for raw in item["values"].values():
            if isinstance(raw, str) and raw.startswith("=") and not raw.startswith("'="):
                raise SheetError(
                    "invalid_value", _("Save a new row before using formulas."), field=None
                )
    delete_ids = []
    for item in deletes:
        if (
            not isinstance(item, dict)
            or set(item) != {"pk", "version"}
            or not isinstance(item["version"], str)
        ):
            raise SheetError("invalid_changes", _("Each deletion requires pk and version."))
        pk = str(item["pk"])
        if pk in seen or pk in delete_ids:
            raise SheetError("duplicate_row", _("Submit one change per row."))
        delete_ids.append(pk)
    return changes, creates, deletes, delete_ids


def save(request, admin, payload):
    check_model(request, admin, change=True)
    fields = fields_for(request, admin)
    changes, creates, deletes, delete_ids = structural_changes(payload, fields)
    model = admin.model
    if creates and not (
        model_perm(request.user, "add", model) and admin.has_add_permission(request)
    ):
        raise SheetError("forbidden", _("Add permission required."), status=403)
    if deletes and not (
        model_perm(request.user, "delete", model) and admin.has_delete_permission(request)
    ):
        raise SheetError("forbidden", _("Delete permission required."), status=403)
    key, request_hash = operation_key(payload), digest(payload)
    op = existing_operation(request, admin, key, request_hash)
    if op:
        return report(request, admin, op, own=True)
    snapshot = get_snapshot(request, admin, payload.get("snapshot"))
    if payload.get("view_state") != snapshot.state:
        raise SheetError("stale_view", _("View changed. Reload before saving."), status=409)
    calculation = SheetCalculation(snapshot, changes, fields)
    for pk in delete_ids:
        if pk not in calculation.rows:
            raise SheetError(
                "invalid_version", _("Row does not match the loaded snapshot."), pk=pk, status=409
            )
    evaluated = {}
    for change in changes:
        pk = str(change["pk"])
        if pk not in calculation.rows or not constant_time_compare(
            str(change["version"]), calculation.rows[pk]["version"]
        ):
            raise SheetError(
                "invalid_version", _("Row does not match the loaded snapshot."), pk=pk, status=409
            )
        evaluated[pk] = {}
        for name in change["values"]:
            try:
                evaluated[pk][name] = calculation.value(pk, name)
            except FormulaError as exc:
                raise SheetError(exc.code, str(exc), pk=pk, field=name) from exc
    if set(delete_ids) & calculation.dependencies:
        raise SheetError("invalid_changes", _("Cannot change and delete the same row."))
    for item in deletes:
        pk = str(item["pk"])
        if not constant_time_compare(str(item["version"]), calculation.rows[pk]["version"]):
            raise SheetError(
                "invalid_version", _("Row does not match the loaded snapshot."), pk=pk, status=409
            )
    try:
        with write_transaction():
            # Unique keys are also serialized by the user row to handle concurrent first submissions.
            get_user_model().objects.select_for_update().get(pk=request.user.pk)
            op = existing_operation(request, admin, key, request_hash)
            if op:
                return report(request, admin, op, own=True)
            rate_limit(request)
            qs = (
                queryset(request, admin, fields, snapshot.state)
                .select_related(None)
                .prefetch_related(None)
                .select_for_update()
            )
            needed = list(calculation.dependencies) + delete_ids
            objects = {
                str(obj.pk): obj for obj in qs.filter(pk__in=needed).order_by("pk")
            }
            for pk in calculation.dependencies:
                obj = objects.get(pk)
                if obj is None:
                    raise SheetError(
                        "row_conflict",
                        _("A referenced row is no longer available."),
                        pk=pk,
                        status=409,
                    )
                row_allowed(request, admin, obj, edit=pk in evaluated)
                if not constant_time_compare(version(obj), calculation.rows[pk]["version"]):
                    raise SheetError(
                        "row_conflict", _("Row changed since loading."), pk=pk, status=409
                    )
            for pk in delete_ids:
                obj = objects.get(pk)
                if obj is None or not constant_time_compare(
                    version(obj), calculation.rows[pk]["version"]
                ):
                    raise SheetError(
                        "row_conflict", _("Row changed since loading."), pk=pk, status=409
                    )
                row_allowed(request, admin, obj)
                if not component("permission_policy").can_delete_object(request, admin, obj):
                    raise SheetError(
                        "forbidden", _("Delete permission required."), pk=pk, status=403
                    )
            op = Operation.objects.create(
                user=request.user,
                model_label=admin.model._meta.label,
                site_name=admin.admin_site.name,
                kind="save",
                status="running",
                idempotency_key=key,
                request_hash=request_hash,
                total=len(changes) + len(creates) + len(deletes),
            )
            actions = {}
            for pk, values in evaluated.items():
                obj = objects[pk]
                require_object_editable(request, admin, obj, values)
                before = {n: original_values(obj, fields)[n] for n in values}
                validate_values(obj, values, request, fields)
                save_object(obj, values.keys(), request)
                after = {n: original_values(obj, fields)[n] for n in values}
                OperationItem.objects.create(
                    operation=op,
                    pk_value=pk,
                    version=version(obj),
                    before=before,
                    after=after,
                    status="done",
                )
                actions[pk] = "update"
            for item in deletes:
                pk = str(item["pk"])
                obj = objects[pk]
                before = concrete_values(obj)
                prior = version(obj)
                obj.delete()
                OperationItem.objects.create(
                    operation=op,
                    pk_value=pk,
                    version=prior,
                    before=before,
                    after={},
                    status="done",
                )
                actions[pk] = "delete"
            for item in creates:
                obj = admin.model()
                validate_values(obj, item["values"], request, fields)
                save_object(obj, list(item["values"]), request)
                after = {name: original_values(obj, fields)[name] for name in item["values"]}
                pk = str(obj.pk)
                OperationItem.objects.create(
                    operation=op,
                    pk_value=pk,
                    version=version(obj),
                    before={},
                    after=after,
                    status="done",
                )
                actions[pk] = "create"
            op.parameters = {"actions": actions}
            op.status, op.changed = "done", len(actions)
            op.save()
    except IntegrityError:
        raise SheetError(
            "constraint_conflict", _("A database constraint prevented saving."), status=409
        ) from None
    return report(request, admin, op, own=True)


def get_operation(request, admin, operation_id, *, own=True):
    try:
        filters = {
            "pk": operation_id,
            "model_label": admin.model._meta.label,
            "site_name": admin.admin_site.name,
        }
        if own:
            filters["user"] = request.user
        return scope_history(Operation.objects.all(), request.user).get(**filters)
    except (Operation.DoesNotExist, ValidationError, ValueError):
        raise SheetError("not_found", _("Operation not found."), status=404) from None


def report(request, admin, op, *, own=False, offset=0, include_items=True):
    check_model(request, admin, action=None if own and op.user_id == request.user.pk else "history")
    fields = fields_for(request, admin)
    items = []
    limit = 50 if op.status == "preview" else 200
    page = list(op.items.order_by("id")[offset : offset + limit]) if include_items else []
    objects = {
        str(obj.pk): obj
        for obj in admin.get_queryset(request).filter(pk__in=[item.pk_value for item in page])
    }
    for item in page:
        obj = objects.get(item.pk_value)
        action = (op.parameters or {}).get("actions", {}).get(item.pk_value)
        # Удалённая строка остаётся в аудите: объекта уже нет, поля режутся по правам.
        if obj is None and action != "delete":
            continue
        if obj is not None and not component("permission_policy").can_view_object(
            request, admin, obj
        ):
            continue
        error = {}
        if item.error:
            error = {"code": item.error.get("code"), "message": "Row could not be processed."}
            if item.error.get("field") in fields:
                error["field"] = item.error["field"]
                error["message"] = item.error.get("message", error["message"])
            details = item.error.get("details")
            if isinstance(details, dict):
                error["details"] = {k: v for k, v in details.items() if k in fields}
        items.append(
            {
                "pk": item.pk_value,
                "status": item.status,
                "before": {k: v for k, v in item.before.items() if k in fields},
                "after": {k: v for k, v in item.after.items() if k in fields},
                "action": action or "update",
                "error": error,
            }
        )
    return {
        "id": str(op.pk),
        "kind": op.kind,
        "status": op.status,
        "total": op.total,
        "changed": op.changed,
        "errors": op.errors,
        "cancel_requested": op.cancel_requested,
        "items": items,
        "offset": offset,
        "lease_until": op.lease_until.isoformat() if op.lease_until else None,
        "has_next": op.items.count() > offset + limit,
        "next_offset": offset + limit,
        "created_at": op.created_at.isoformat(),
    }


def related_admin(model):
    from django.contrib.admin import sites

    for site in list(sites.all_sites):
        registered = site._registry.get(model)
        if registered is not None:
            return registered
    return None


def lookup(request, admin, params):
    """Поиск связанной модели через её ModelAdmin.get_search_results и права autocomplete."""
    check_model(request, admin)
    fields = fields_for(request, admin)
    name = params.get("field")
    if not isinstance(name, str):
        raise SheetError("invalid_field", _("Field is unavailable for this operation."))
    require_fields([name], fields)
    field = admin.model._meta.get_field(name)
    if not field.is_relation or not (field.many_to_one or field.many_to_many):
        raise SheetError("invalid_field", _("Field is unavailable for this operation."))
    target = related_admin(field.remote_field.model)
    if target is None or not target.get_search_fields(request):
        raise SheetError(
            "lookup_unavailable",
            _("Related admin does not allow autocomplete."),
            status=404,
        )
    if not (
        target.has_view_permission(request) or target.has_change_permission(request)
    ):
        raise SheetError("forbidden", _("Sheet access denied."), status=403)
    term = str(params.get("q", ""))[:200]
    queryset, distinct = target.get_search_results(request, target.get_queryset(request), term)
    if distinct:
        queryset = queryset.distinct()
    return {
        "results": [
            {"id": str(obj.pk), "label": str(obj)} for obj in queryset.order_by("pk")[:20]
        ]
    }


def validate_draft(request, admin, payload):
    """full_clean без записи. Ошибки строк не откатывают соседние проверки."""
    check_model(request, admin, change=True)
    fields = fields_for(request, admin)
    changes = payload.get("changes")
    if not isinstance(changes, list) or len(changes) > config()["max_save_rows"]:
        raise SheetError("save_limit", _("Invalid number of changed rows."))
    results = []
    for change in changes:
        if not isinstance(change, dict) or "values" not in change:
            raise SheetError("invalid_changes", _("Each change requires pk, version and values."))
        pk = str(change.get("pk", ""))
        values = change["values"]
        if not isinstance(values, dict):
            raise SheetError("invalid_changes", _("Each change requires pk, version and values."))
        require_fields(values, fields, edit=True)
        obj = admin.get_queryset(request).filter(pk=pk).first() if pk and not pk.startswith("new:") else None
        created = obj is None
        if created:
            if not (model_perm(request.user, "add", admin.model) and admin.has_add_permission(request)):
                raise SheetError("forbidden", _("Add permission required."), status=403)
            obj = admin.model()
        else:
            row_allowed(request, admin, obj, edit=True)
            require_object_editable(request, admin, obj, values)
        try:
            validate_values(obj, values, request, fields)
        except SheetError as exc:
            results.append({"pk": pk, "ok": False, "error": exc.as_dict()})
            continue
        results.append({"pk": pk, "ok": True})
    return {"results": results}


def undo(request, admin, payload):
    check_model(request, admin, change=True, action="undo")
    key, request_hash = operation_key(payload), digest(payload)
    current = existing_operation(request, admin, key, request_hash)
    if current:
        return report(request, admin, current, own=True)
    target = undo_target(request, admin, payload.get("operation"))
    try:
        with write_transaction():
            get_user_model().objects.select_for_update().get(pk=request.user.pk)
            current = existing_operation(request, admin, key, request_hash)
            if current:
                return report(request, admin, current, own=True)
            rate_limit(request)
            target = Operation.objects.select_for_update().get(pk=target.pk)
            if target.parameters.get("undone_by"):
                raise SheetError("already_undone", _("This save was already reverted."), status=409)
            op = Operation.objects.create(
                user=request.user,
                model_label=admin.model._meta.label,
                site_name=admin.admin_site.name,
                kind="undo",
                status="running",
                idempotency_key=key,
                request_hash=request_hash,
                total=target.items.count(),
                parameters={"undo_of": str(target.pk)},
            )
            actions = {}
            for item in target.items.order_by("id"):
                action = (target.parameters or {}).get("actions", {}).get(item.pk_value, "update")
                actions[item.pk_value] = apply_undo_item(request, admin, op, item, action)
            op.parameters = {"undo_of": str(target.pk), "actions": actions}
            op.status, op.changed = "done", len(actions)
            op.save()
            target.parameters = {**target.parameters, "undone_by": str(op.pk)}
            target.save(update_fields=["parameters", "updated_at"])
    except IntegrityError:
        raise SheetError(
            "constraint_conflict", _("A database constraint prevented saving."), status=409
        ) from None
    return report(request, admin, op, own=True)


def undo_target(request, admin, operation_id):
    qs = Operation.objects.filter(
        user=request.user,
        model_label=admin.model._meta.label,
        site_name=admin.admin_site.name,
        kind="save",
        status="done",
    )
    if operation_id:
        try:
            op = qs.get(pk=operation_id)
        except (Operation.DoesNotExist, ValidationError, ValueError):
            raise SheetError("not_found", _("Operation not found."), status=404) from None
    else:
        op = qs.order_by("-created_at").first()
        if op is None:
            raise SheetError("not_found", _("Operation not found."), status=404)
    if op.parameters.get("undone_by"):
        raise SheetError("already_undone", _("This save was already reverted."), status=409)
    return op


def apply_undo_item(request, admin, operation, item, action):
    model = admin.model
    fields = fields_for(request, admin)
    if action == "create":
        obj = admin.get_queryset(request).select_for_update().filter(pk=item.pk_value).first()
        if obj is None or not constant_time_compare(version(obj), item.version):
            raise SheetError(
                "row_conflict", _("Row changed since saving."), pk=item.pk_value, status=409
            )
        if not component("permission_policy").can_delete_object(request, admin, obj):
            raise SheetError("forbidden", _("Delete permission required."), status=403)
        before = concrete_values(obj)
        obj.delete()
        OperationItem.objects.create(
            operation=operation,
            pk_value=item.pk_value,
            version=item.version,
            before=before,
            after={},
            status="done",
        )
        return "delete"
    if action == "delete":
        if model.objects.filter(pk=item.pk_value).exists():
            raise SheetError(
                "row_conflict", _("Row changed since saving."), pk=item.pk_value, status=409
            )
        restore_deleted(model, item.pk_value, item.before)
        obj = model.objects.get(pk=item.pk_value)
        OperationItem.objects.create(
            operation=operation,
            pk_value=item.pk_value,
            version=version(obj),
            before={},
            after={key: value for key, value in item.before.items() if key in fields},
            status="done",
        )
        return "create"
    obj = admin.get_queryset(request).select_for_update().filter(pk=item.pk_value).first()
    if obj is None or not constant_time_compare(version(obj), item.version):
        raise SheetError(
            "row_conflict", _("Row changed since saving."), pk=item.pk_value, status=409
        )
    row_allowed(request, admin, obj, edit=True)
    visible = {key: value for key, value in item.before.items() if key in fields}
    validate_values(obj, visible, request, fields)
    save_object(obj, visible.keys(), request)
    OperationItem.objects.create(
        operation=operation,
        pk_value=item.pk_value,
        version=version(obj),
        before=item.after,
        after={key: original_values(obj, fields)[key] for key in visible},
        status="done",
    )
    return "update"


def restore_deleted(model, pk, before):
    adapter = component("field_adapter")
    obj = model()
    obj.pk = model._meta.pk.to_python(pk)
    autos = {}
    for field in model._meta.concrete_fields:
        if field.primary_key or field.name not in before:
            continue
        try:
            parsed = adapter.parse(field, before[field.name])
        except (ValidationError, ValueError, TypeError, ArithmeticError) as exc:
            raise SheetError(
                "invalid_value",
                _("Value cannot be parsed for this field."),
                pk=str(pk),
                field=field.name,
            ) from exc
        setattr(obj, field.attname, parsed)
        if getattr(field, "auto_now", False) or getattr(field, "auto_now_add", False):
            autos[field.attname] = parsed
    obj.save(force_insert=True)
    if autos:
        model.objects.filter(pk=obj.pk).update(**autos)


def saved_views(request, admin):
    check_model(request, admin)
    rows = SavedView.objects.filter(
        model_label=admin.model._meta.label, site_name=admin.admin_site.name
    ).filter(Q_owner(request))
    return {
        "views": [
            {
                "id": str(row.pk),
                "name": row.name,
                "shared": row.shared,
                "own": row.user_id == request.user.pk,
                "state": row.state,
            }
            for row in rows.order_by("name")
        ]
    }


def Q_owner(request):
    from django.db.models import Q

    return Q(user=request.user) | Q(shared=True)


def save_view(request, admin, payload):
    check_model(request, admin)
    name = payload.get("name")
    state = payload.get("state")
    shared = bool(payload.get("shared"))
    if not isinstance(name, str) or not 1 <= len(name) <= 80:
        raise SheetError("invalid_view", _("View name must be 1–80 characters."))
    if not isinstance(state, dict):
        raise SheetError("invalid_state", _("Invalid view state."))
    stored = view_state(state)
    if len(json.dumps(stored)) > 20_000:
        raise SheetError("invalid_state", _("Invalid view state."))
    if (
        SavedView.objects.filter(
            user=request.user,
            model_label=admin.model._meta.label,
            site_name=admin.admin_site.name,
        ).count()
        >= 50
        and not SavedView.objects.filter(
            user=request.user,
            model_label=admin.model._meta.label,
            site_name=admin.admin_site.name,
            name=name,
        ).exists()
    ):
        raise SheetError("view_limit", _("Too many saved views."))
    row, _created = SavedView.objects.update_or_create(
        user=request.user,
        model_label=admin.model._meta.label,
        site_name=admin.admin_site.name,
        name=name,
        defaults={"shared": shared, "state": stored},
    )
    return {"id": str(row.pk), "name": row.name, "shared": row.shared, "state": row.state}


def delete_view(request, admin, payload):
    check_model(request, admin)
    try:
        row = SavedView.objects.get(
            pk=payload.get("id"),
            user=request.user,
            model_label=admin.model._meta.label,
            site_name=admin.admin_site.name,
        )
    except (SavedView.DoesNotExist, ValidationError, ValueError):
        raise SheetError("not_found", _("View not found."), status=404) from None
    row.delete()
    return {"deleted": True}


def view_state(state):
    frozen = state.get("frozen", 0)
    widths = state.get("widths", {})
    if not isinstance(frozen, int) or isinstance(frozen, bool) or frozen < 0 or frozen > 50:
        raise SheetError("invalid_state", _("Invalid view state."))
    if not isinstance(widths, dict) or any(
        not isinstance(name, str) or not isinstance(width, (int, float)) or isinstance(width, bool)
        for name, width in widths.items()
    ):
        raise SheetError("invalid_state", _("Invalid view state."))
    parsed = parse_state(
        {
            "q": state.get("q", ""),
            "filter": state.get("filter", {}),
            "sort": state.get("sort", []),
            "columns": state.get("columns"),
            "limit": state.get("limit", config()["page_size"]),
            "offset": 0,
            "pagination": state.get("pagination", "offset"),
        }
    )
    parsed["offset"] = 0
    parsed["cursor"] = None
    parsed["frozen"] = frozen
    parsed["widths"] = {name: int(width) for name, width in widths.items()}
    return parsed
