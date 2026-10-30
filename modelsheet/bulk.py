"""Persisted, immutable bulk plans and transactional execution."""

import datetime as dt
import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Count
from django.utils import timezone
from django.utils.crypto import constant_time_compare
from django.utils.translation import gettext_lazy as _

from .adapters import serialize
from .conf import component, config
from .errors import SheetError
from .formula import FormulaError, references
from .formula.engine import QueryAggregates
from .metadata import fields_for, require_fields, require_object_editable
from .models import Operation, OperationItem
from .query import parse_state, queryset
from .services import (
    ast,
    check_model,
    compute,
    digest,
    existing_operation,
    get_operation,
    operation_key,
    original_values,
    rate_limit,
    report,
    row_allowed,
    save_object,
    validate_values,
    version,
    write_transaction,
)


def candidate_queryset(request, admin, fields, parameters):
    qs = queryset(request, admin, fields, parameters["state"])
    selection = parameters.get("selection")
    return qs.filter(pk__in=selection) if selection is not None else qs


def preview(request, admin, payload):
    check_model(request, admin, change=True, action="bulk")
    fields = fields_for(request, admin)
    key, request_hash = operation_key(payload), digest(payload)
    op = existing_operation(request, admin, key, request_hash)
    if op:
        return report(request, admin, op, own=True)
    assignments = payload.get("assignments")
    if not isinstance(assignments, dict) or not assignments:
        raise SheetError("invalid_assignments", _("At least one assignment is required."))
    require_fields(assignments, fields, edit=True)
    for name, expression in assignments.items():
        if isinstance(expression, str) and expression.startswith("="):
            try:
                refs = references(ast(expression))
                require_fields(refs["fields"], fields)
                if refs["cells"] or refs["columns"]:
                    raise SheetError(
                        "positional_bulk",
                        _("Bulk formulas only accept named field references."),
                        field=name,
                    )
            except FormulaError as exc:
                raise SheetError(exc.code, str(exc), field=name) from exc
        elif isinstance(expression, (dict, list)):
            raise SheetError(
                "invalid_assignments", _("Assignments must be scalar values."), field=name
            )
    selection = payload.get("selection")
    if selection is not None and (
        not isinstance(selection, list)
        or not selection
        or len(selection) > config()["max_page_size"]
    ):
        raise SheetError(
            "invalid_selection", _("Select rows on the loaded page or all filtered rows.")
        )
    if selection is not None:
        from .services import get_snapshot

        snapshot = get_snapshot(request, admin, payload.get("snapshot"))
        if not set(map(str, selection)) <= {r["pk"] for r in snapshot.rows}:
            raise SheetError(
                "invalid_selection", _("Selected rows must belong to the loaded page.")
            )
    parameters = {
        "state": parse_state(payload.get("state", {})),
        "assignments": assignments,
        "selection": selection,
        "today": timezone.now().date().isoformat(),
    }
    qs = candidate_queryset(request, admin, fields, parameters)
    count = qs.count()
    if count > config()["max_bulk_rows"]:
        raise SheetError("bulk_limit", _("Too many matching rows. Narrow the filter."))
    background = count > config()["bulk_background_threshold"]
    adapter = component("background_adapter")
    if background and adapter is None:
        raise SheetError(
            "background_required",
            _("Configure a background adapter or narrow the filter."),
            status=409,
        )
    try:
        with write_transaction():
            get_user_model().objects.select_for_update().get(pk=request.user.pk)
            op = existing_operation(request, admin, key, request_hash)
            if op:
                return report(request, admin, op, own=True)
            rate_limit(request)
            op = Operation.objects.create(
                user=request.user,
                site_name=admin.admin_site.name,
                model_label=admin.model._meta.label,
                kind="bulk",
                status="preparing" if background else "preview",
                idempotency_key=key,
                request_hash=request_hash,
                parameters=parameters,
                total=count,
                context=adapter.capture_context(request) if background else {},
            )
            if not background:
                build_plan(request, admin, op)
    except IntegrityError:
        raise SheetError(
            "idempotency_conflict",
            _("Concurrent operation submission. Retry with the same key."),
            status=409,
        ) from None
    if background:
        enqueue(op, "preview")
    return report(request, admin, op, own=True)


def build_plan(request, admin, op):
    """Caller owns an operation lock and transaction; never rebuild a completed preview."""
    check_model(request, admin, change=True, action="bulk")
    fields = fields_for(request, admin)
    parameters = op.parameters
    require_fields(parameters["assignments"], fields, edit=True)
    limit = config()["max_bulk_rows"]
    if op.status != "preparing":
        limit = min(limit, config()["bulk_background_threshold"])
    objects = list(
        candidate_queryset(request, admin, fields, parameters).order_by("pk")[: limit + 1]
    )
    if len(objects) > config()["max_bulk_rows"]:
        raise SheetError("bulk_limit", _("Matching set grew beyond the configured limit."))
    if len(objects) > limit:
        raise SheetError(
            "preview_changed",
            _("Matching set grew; request a new preview for background processing."),
            status=409,
        )
    # Reject the whole plan before reading values if any member is hidden. Silently
    # narrowing the set would change the meaning of the user's aggregate formulas.
    for obj in objects:
        row_allowed(request, admin, obj)
    originals = {str(obj.pk): original_values(obj, fields) for obj in objects}
    aggregates = QueryAggregates(lambda name: [row[name] for row in originals.values()])
    formulas = {}
    for raw in parameters["assignments"].values():
        if isinstance(raw, str) and raw.startswith("=") and raw not in formulas:
            try:
                formulas[raw] = ast(raw)
            except FormulaError as exc:
                raise SheetError(exc.code, str(exc)) from exc
            require_fields(references(formulas[raw])["fields"], fields)
    prepared, errors = [], 0
    # Values used by Q-aggregates are captured from this same materialized set.
    for obj in objects:
        pk, before_version = str(obj.pk), version(obj)
        values = {}
        error = {}
        before = {n: originals[pk][n] for n in parameters["assignments"]}
        try:
            row_allowed(request, admin, obj, edit=True)
            require_object_editable(request, admin, obj, parameters["assignments"])
            for name, raw in parameters["assignments"].items():
                if isinstance(raw, str) and raw.startswith("'="):
                    values[name] = raw[1:]
                elif isinstance(raw, str) and raw.startswith("="):
                    values[name] = compute(
                        formulas[raw],
                        fields=originals[pk],
                        query=aggregates,
                        today=dt.date.fromisoformat(parameters["today"]),
                    )
                else:
                    values[name] = raw
            validate_values(obj, values, request, fields)
            values = {n: original_values(obj, fields)[n] for n in values}
        except FormulaError as exc:
            error = {"code": exc.code, "message": str(exc)}
        except SheetError as exc:
            error = exc.as_dict()
        if error:
            errors += 1
            values = {name: serialize(value) for name, value in values.items()}
        prepared.append(
            OperationItem(
                operation=op,
                pk_value=pk,
                version=before_version,
                before=before,
                after=values,
                status="error" if error else "pending",
                error=error,
            )
        )
    OperationItem.objects.bulk_create(prepared, batch_size=200)
    op.total, op.errors, op.status = len(prepared), errors, "preview"
    op.preview_expires_at = timezone.now() + timedelta(seconds=config()["preview_ttl_seconds"])
    op.save()


def enqueue(op, phase):
    try:
        component("background_adapter").enqueue(str(op.pk), phase)
    except Exception:
        # Persist a recoverable state. The caller can explicitly retry dispatch via resume.
        Operation.objects.filter(pk=op.pk).update(status="dispatch_failed")
        op.refresh_from_db()
        raise SheetError(
            "dispatch_failed",
            _("Queue submission failed; operation can be resumed."),
            status=503,
            details={"operation": str(op.pk)},
        ) from None


def require_fresh_preview(op):
    if op.preview_expires_at is None or op.preview_expires_at <= timezone.now():
        raise SheetError("expired_preview", _("Create a new preview."), status=409)


def run(request, admin, operation_id):
    check_model(request, admin, change=True, action="bulk")
    op = get_operation(request, admin, operation_id)
    if op.kind != "bulk":
        raise SheetError("invalid_operation", _("Only bulk previews can be executed."))
    background = op.total > config()["bulk_background_threshold"]
    if background and component("background_adapter") is None:
        raise SheetError("background_required", _("A background adapter is required."), status=409)
    with write_transaction():
        op = Operation.objects.select_for_update().get(pk=op.pk)
        if op.status in ("done", "running", "queued", "cancelled", "partial"):
            return report(request, admin, op, own=True)
        if op.status != "preview":
            raise SheetError(
                "invalid_status", _("Operation is not ready for confirmation."), status=409
            )
        require_fresh_preview(op)
        if op.errors:
            raise SheetError(
                "invalid_preview", _("Fix preview errors and create a new preview."), status=409
            )
        if background:
            # Even a plan made synchronously can require a worker after settings change.
            op.context = component("background_adapter").capture_context(request)
            op.parameters = {**op.parameters, "confirmed": True}
            op.status = "queued"
            op.save()
        else:
            execute_items(request, admin, op, list(op.items.order_by("pk_value")), atomic=True)
            update_counts(op, finished=True)
    if background:
        enqueue(op, "run")
    return report(request, admin, op, own=True)


def execute_items(request, admin, op, items, *, atomic=False):
    # Long-running workers must not retain Django's permission cache between chunks.
    request.user.refresh_from_db()
    for name in ("_perm_cache", "_user_perm_cache", "_group_perm_cache"):
        if hasattr(request.user, name):
            delattr(request.user, name)
    check_model(request, admin, change=True, action="bulk")
    fields = fields_for(request, admin)
    require_fields(op.parameters["assignments"], fields, edit=True)
    from .query import condition

    condition(op.parameters["state"]["filter"], admin.model, fields)
    require_fields(
        [item["field"] for item in op.parameters["state"]["sort"] if item["field"] != "pk"], fields
    )
    for expression in op.parameters["assignments"].values():
        if isinstance(expression, str) and expression.startswith("="):
            require_fields(references(ast(expression))["fields"], fields)
    for item in items:
        if item.status != "pending":
            continue
        try:
            # Per-row savepoint keeps a failed constraint from breaking the chunk transaction.
            with transaction.atomic():
                obj = (
                    admin.get_queryset(request)
                    .select_related(None)
                    .select_for_update()
                    .filter(pk=item.pk_value)
                    .first()
                )
                if obj is None:
                    raise SheetError(
                        "row_conflict",
                        _("Row is no longer available."),
                        status=409,
                        pk=item.pk_value,
                    )
                row_allowed(request, admin, obj, edit=True)
                if not constant_time_compare(version(obj), item.version):
                    raise SheetError(
                        "row_conflict",
                        _("Row changed since preview."),
                        status=409,
                        pk=item.pk_value,
                    )
                require_object_editable(request, admin, obj, item.after)
                validate_values(obj, item.after, request, fields)
                save_object(obj, item.after.keys(), request)
                item.version, item.status = version(obj), "done"
                item.after = {n: original_values(obj, fields)[n] for n in item.after}
                item.save()
        except SheetError as exc:
            if atomic:
                raise
            item.status, item.error = "error", exc.as_dict()
            item.save()


def update_counts(op, *, finished=False):
    counts = dict(op.items.values_list("status").annotate(n=Count("id")).values_list("status", "n"))
    op.changed, op.errors = counts.get("done", 0), counts.get("error", 0)
    if finished:
        op.status = "partial" if op.errors else "done"
        op.lease_until, op.lease_token = None, None
    op.save()


def cancel(request, admin, operation_id):
    check_model(request, admin, change=True, action="bulk")
    with write_transaction():
        op = get_operation(request, admin, operation_id)
        op = Operation.objects.select_for_update().get(pk=op.pk)
        if op.status not in ("done", "partial", "failed"):
            op.cancel_requested = True
            op.status = "cancelled"
            op.lease_token, op.lease_until = None, None
            op.save()
    return report(request, admin, op, own=True)


def resume(request, admin, operation_id):
    check_model(request, admin, change=True, action="bulk")
    adapter = component("background_adapter")
    if adapter is None:
        raise SheetError("background_required", _("A background adapter is required."), status=409)
    with write_transaction():
        op = get_operation(request, admin, operation_id)
        op = Operation.objects.select_for_update().get(pk=op.pk)
        if op.kind != "bulk" or op.status not in (
            "cancelled",
            "dispatch_failed",
            "failed",
            "running",
            "preparing",
            "queued",
        ):
            raise SheetError("invalid_status", _("Operation cannot be resumed."), status=409)
        if op.lease_until and op.lease_until > timezone.now():
            raise SheetError("worker_active", _("A worker still owns this operation."), status=409)
        phase = "run" if op.parameters.get("confirmed") else "preview"
        if phase == "preview" and (op.preview_expires_at is not None or op.items.exists()):
            # A completed preview must never be rebuilt or implicitly confirmed.
            require_fresh_preview(op)
            op.status, op.cancel_requested = "preview", False
            op.save()
            return report(request, admin, op, own=True)
        op.status = "queued" if phase == "run" else "preparing"
        op.context = adapter.capture_context(request)
        op.cancel_requested = False
        op.lease_until, op.lease_token = None, None
        op.save()
    enqueue(op, phase)
    return report(request, admin, op, own=True)


def process_operation(request, admin, operation_id, phase):
    """At-least-once worker entry point. Lease fencing and data share a transaction."""
    check_model(request, admin, change=True, action="bulk")
    token = uuid.uuid4()
    with write_transaction():
        op = Operation.objects.select_for_update().get(pk=operation_id)
        if op.cancel_requested or op.status in ("done", "partial", "preview", "cancelled"):
            return
        if op.lease_until and op.lease_until > timezone.now():
            raise SheetError(
                "worker_active", _("Retry after the current worker lease expires."), status=409
            )
        if phase not in ("preview", "run") or (
            phase == "run" and not op.parameters.get("confirmed")
        ):
            raise SheetError(
                "not_confirmed", _("Worker cannot execute an unconfirmed plan."), status=409
            )
        if phase == "preview" and op.parameters.get("confirmed"):
            return
        op.lease_token, op.lease_until = token, timezone.now() + timedelta(minutes=5)
        op.status = "preparing" if phase == "preview" else "running"
        op.save()
        request._modelsheet_lease_token = token
    if phase == "preview":
        with write_transaction():
            op = Operation.objects.select_for_update().get(pk=operation_id)
            if op.lease_token != token or op.cancel_requested:
                return
            build_plan(request, admin, op)
            op.lease_until, op.lease_token = None, None
            op.save()
        return
    while True:
        with write_transaction():
            op = Operation.objects.select_for_update().get(pk=operation_id)
            if op.lease_token != token or op.cancel_requested:
                return
            items = list(
                op.items.filter(status="pending").order_by("pk_value")[: config()["chunk_size"]]
            )
            if not items:
                update_counts(op, finished=True)
                return
            execute_items(request, admin, op, items)
            op.lease_until = timezone.now() + timedelta(minutes=5)
            update_counts(op)
