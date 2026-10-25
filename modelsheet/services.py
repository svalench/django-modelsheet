import hashlib
import json
import re
from contextlib import contextmanager
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import IntegrityError, connections, transaction
from django.utils import timezone
from django.utils.crypto import constant_time_compare, salted_hmac

from .adapters import serialize
from .conf import component, config
from .errors import SheetError
from .formula import FormulaError, evaluate, parse, references
from .metadata import fields_for, require_fields
from .models import Operation, OperationItem, ViewSnapshot
from .permissions import require_access
from .query import parse_state, queryset
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
            "SQLite writes require OPTIONS.transaction_mode=IMMEDIATE.",
            status=503,
        )
    if connection.in_atomic_block:
        raise SheetError(
            "nested_transaction", "Sheet writes require an independent transaction.", status=503
        )
    with transaction.atomic(using="default"):
        yield


def check_model(request, admin, **kwargs):
    if not is_enabled(admin):
        raise SheetError("not_enabled", "This model is not enabled.", status=404)
    require_access(request, admin, **kwargs)


def row_allowed(request, admin, obj, *, edit=False):
    policy = component("permission_policy")
    if not policy.can_view_object(request, admin, obj) or (
        edit and not policy.can_edit_object(request, admin, obj)
    ):
        raise SheetError("forbidden", "Row is unavailable for this operation.", status=403)


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


def schema(request, admin):
    check_model(request, admin)
    fields = fields_for(request, admin)
    from .permissions import allowed

    return {
        "fields": list(fields.values()),
        "computed": computed_columns(admin, fields),
        "page_size": config()["page_size"],
        "max_save_rows": config()["max_save_rows"],
        "formula_limits": config()["formula"],
        "timezone": timezone.get_current_timezone_name(),
        "can_bulk": allowed(request.user, "bulk", admin.model)
        and admin.has_change_permission(request),
        "can_history": allowed(request.user, "history", admin.model),
        "model": admin.model._meta.label,
        "title": str(admin.model._meta.verbose_name_plural),
    }


def rows(request, admin, params):
    check_model(request, admin)
    fields, state = fields_for(request, admin), parse_state(params)
    columns = state["columns"]
    if columns is None:
        columns = list(fields)
        state["columns"] = columns
    if not isinstance(columns, list) or len(columns) != len(set(columns)):
        raise SheetError("invalid_columns", "Columns must be a unique field list.")
    require_fields(columns, fields)
    qs = queryset(request, admin, fields, state)
    result = []
    for obj in qs[state["offset"] : state["offset"] + state["limit"]]:
        try:
            row_allowed(request, admin, obj)
        except SheetError:
            continue
        result.append(
            {"pk": str(obj.pk), "version": version(obj), "values": original_values(obj, fields)}
        )
    snapshot = ViewSnapshot.objects.create(
        user=request.user,
        model_label=admin.model._meta.label,
        site_name=admin.admin_site.name,
        state=state,
        rows=result,
        columns=columns,
    )
    return {
        "rows": result,
        "snapshot": str(snapshot.pk),
        "state": state,
        "today": timezone.now().date().isoformat(),
        "count": qs.count() if config()["count_mode"] == "exact" else None,
        "has_next": qs[
            state["offset"] + state["limit"] : state["offset"] + state["limit"] + 1
        ].exists(),
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
        raise SheetError("invalid_snapshot", "View snapshot is unavailable.", status=409)
    if snapshot.created_at < timezone.now() - timedelta(seconds=config()["snapshot_ttl_seconds"]):
        raise SheetError("expired_snapshot", "Reload the sheet before saving.", status=409)
    return snapshot


def operation_key(payload):
    key = payload.get("idempotency_key")
    if not isinstance(key, str) or not 1 <= len(key) <= 128:
        raise SheetError("invalid_key", "An idempotency_key of 1–128 characters is required.")
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
            "idempotency_conflict", "This key belongs to a different request.", status=409
        )
    return op


def rate_limit(request):
    if (
        Operation.objects.filter(
            user=request.user, created_at__gte=timezone.now() - timedelta(minutes=1)
        ).count()
        >= config()["max_operations_per_minute"]
    ):
        raise SheetError("rate_limit", "Too many operations. Try again later.", status=429)


def validate_values(obj, values, request, fields):
    adapter = component("field_adapter")
    for name, value in values.items():
        try:
            setattr(obj, name, adapter.parse(obj._meta.get_field(name), value))
        except (ValidationError, ValueError, TypeError, ArithmeticError) as exc:
            raise SheetError(
                "invalid_value",
                "Value cannot be parsed for this field.",
                pk=str(obj.pk),
                field=name,
            ) from exc
    try:
        component("save_adapter").validate(obj, request)
    except ValidationError as exc:
        errors = getattr(exc, "message_dict", {"__all__": exc.messages})
        visible = {key: messages for key, messages in errors.items() if key in fields}
        raise SheetError("validation", "Row validation failed.", pk=str(obj.pk), details=visible)


def save_object(obj, names, request):
    try:
        component("save_adapter").save(obj, names, request)
        obj.refresh_from_db()
    except IntegrityError:
        raise SheetError(
            "constraint_conflict",
            "A database constraint prevented saving.",
            pk=str(obj.pk),
            status=409,
        )
    except ValidationError:
        raise SheetError("validation", "The model save hook rejected this row.", pk=str(obj.pk))


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
        self.rows = {row["pk"]: row for row in snapshot.rows}
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


def save(request, admin, payload):
    check_model(request, admin, change=True)
    fields = fields_for(request, admin)
    changes = payload.get("changes")
    if not isinstance(changes, list) or not 1 <= len(changes) <= config()["max_save_rows"]:
        raise SheetError("save_limit", "Invalid number of changed rows.")
    seen = set()
    for change in changes:
        if (
            not isinstance(change, dict)
            or set(change) != {"pk", "version", "values"}
            or not isinstance(change["values"], dict)
            or not change["values"]
        ):
            raise SheetError("invalid_changes", "Each change requires pk, version and values.")
        pk = str(change["pk"])
        if pk in seen:
            raise SheetError("duplicate_row", "Submit one change per row.")
        seen.add(pk)
        require_fields(change["values"], fields, edit=True)
    key, request_hash = operation_key(payload), digest(payload)
    op = existing_operation(request, admin, key, request_hash)
    if op:
        return report(request, admin, op, own=True)
    snapshot = get_snapshot(request, admin, payload.get("snapshot"))
    if payload.get("view_state") != snapshot.state:
        raise SheetError("stale_view", "View changed. Reload before saving.", status=409)
    calculation = SheetCalculation(snapshot, changes, fields)
    evaluated = {}
    for change in changes:
        pk = str(change["pk"])
        if pk not in calculation.rows or not constant_time_compare(
            str(change["version"]), calculation.rows[pk]["version"]
        ):
            raise SheetError(
                "invalid_version", "Row does not match the loaded snapshot.", pk=pk, status=409
            )
        evaluated[pk] = {}
        for name in change["values"]:
            try:
                evaluated[pk][name] = calculation.value(pk, name)
            except FormulaError as exc:
                raise SheetError(exc.code, str(exc), pk=pk, field=name)
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
                .select_for_update()
            )
            objects = {
                str(obj.pk): obj
                for obj in qs.filter(pk__in=calculation.dependencies).order_by("pk")
            }
            for pk in calculation.dependencies:
                obj = objects.get(pk)
                if obj is None:
                    raise SheetError(
                        "row_conflict",
                        "A referenced row is no longer available.",
                        pk=pk,
                        status=409,
                    )
                row_allowed(request, admin, obj, edit=pk in evaluated)
                if not constant_time_compare(version(obj), calculation.rows[pk]["version"]):
                    raise SheetError(
                        "row_conflict", "Row changed since loading.", pk=pk, status=409
                    )
            op = Operation.objects.create(
                user=request.user,
                model_label=admin.model._meta.label,
                site_name=admin.admin_site.name,
                kind="save",
                status="running",
                idempotency_key=key,
                request_hash=request_hash,
                total=len(changes),
            )
            for pk, values in evaluated.items():
                obj = objects[pk]
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
            op.status, op.changed = "done", len(changes)
            op.save()
    except IntegrityError:
        raise SheetError(
            "constraint_conflict", "A database constraint prevented saving.", status=409
        )
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
        return Operation.objects.get(**filters)
    except (Operation.DoesNotExist, ValidationError, ValueError):
        raise SheetError("not_found", "Operation not found.", status=404)


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
        if obj is None or not component("permission_policy").can_view_object(request, admin, obj):
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
