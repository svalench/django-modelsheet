import base64
import binascii
import json
from copy import copy

from django.core.exceptions import ValidationError
from django.db.models import F, Q
from django.utils.crypto import constant_time_compare, salted_hmac
from django.utils.translation import gettext_lazy as _

from .adapters import serialize
from .conf import component, config
from .errors import SheetError
from .metadata import require_fields

OPERATORS = {
    "eq": "exact",
    "ne": "exact",
    "lt": "lt",
    "lte": "lte",
    "gt": "gt",
    "gte": "gte",
    "in": "in",
    "not_in": "in",
    "isnull": "isnull",
    "contains": "icontains",
}


def condition(tree, model, fields):
    budget = [config()["max_filter_nodes"]]

    def walk(node, depth=0):
        budget[0] -= 1
        if budget[0] < 0 or depth > config()["max_filter_depth"]:
            raise SheetError("filter_limit", _("Filter is too complex."))
        if not isinstance(node, dict):
            raise SheetError("invalid_filter", _("Expected a filter object."))
        if not node:
            return Q()
        if "and" in node or "or" in node:
            if len(node) != 1:
                raise SheetError("invalid_filter", _("Use one group operator."))
            key = "and" if "and" in node else "or"
            if not isinstance(node[key], list) or not node[key]:
                raise SheetError("invalid_filter", _("Filter group must contain conditions."))
            result = None
            for child in node[key]:
                expr = walk(child, depth + 1)
                result = (
                    expr if result is None else (result & expr if key == "and" else result | expr)
                )
            return result
        if set(node) != {"field", "op", "value"}:
            raise SheetError("invalid_filter", _("Expected field, op and value."))
        name, op, value = node["field"], node["op"], node["value"]
        require_fields([name], fields)
        if op not in OPERATORS:
            raise SheetError("invalid_filter", _("Unsupported operator."))
        field = model._meta.get_field(name)
        adapter = component("field_adapter")
        try:
            if op == "isnull":
                if not isinstance(value, bool):
                    raise ValueError()
            elif op in ("in", "not_in"):
                if not isinstance(value, list) or len(value) > 1000:
                    raise ValueError()
                value = [
                    adapter.parse(field.target_field if field.is_relation else field, v)
                    for v in value
                ]
            else:
                if isinstance(value, (dict, list)):
                    raise ValueError()
                value = adapter.parse(field.target_field if field.is_relation else field, value)
            result = Q(**{f"{name}__{OPERATORS[op]}": value})
            return ~result if op in ("ne", "not_in") else result
        except (ValidationError, ValueError, TypeError, ArithmeticError):
            raise SheetError("invalid_filter", _("Invalid filter value."), field=name) from None

    return walk(tree)


def parse_offset(params):
    """Parse a non-negative ``offset`` bounded by ``MODELSHEET["max_offset"]``."""
    try:
        offset = max(0, int(params.get("offset", 0)))
    except (TypeError, ValueError):
        raise SheetError("invalid_offset", _("Offset must be an integer.")) from None
    if offset > config()["max_offset"]:
        raise SheetError(
            "offset_limit", _("Offset is too large; narrow the view with filters instead.")
        )
    return offset


def parse_state(params):
    if not hasattr(params, "get"):
        raise SheetError("invalid_state", _("Invalid view state."))
    try:
        filters = params.get("filter", {})
        sort = params.get("sort", [])
        columns = params.get("columns", None)
        pagination = params.get("pagination", config()["pagination"])
        cursor = params.get("cursor") or None
        if pagination not in ("offset", "keyset"):
            raise ValueError()
        if cursor is not None and (not isinstance(cursor, str) or len(cursor) > 4000):
            raise ValueError()
        # Keyset не использует offset, поэтому потолок max_offset к нему не применяется.
        offset = 0 if pagination == "keyset" else parse_offset(params)
        return {
            "q": str(params.get("q", ""))[:500],
            "filter": json.loads(filters) if isinstance(filters, str) else filters,
            "sort": json.loads(sort) if isinstance(sort, str) else sort,
            "offset": offset,
            "limit": min(
                config()["max_page_size"], max(1, int(params.get("limit", config()["page_size"])))
            ),
            "columns": json.loads(columns) if isinstance(columns, str) else columns,
            "pagination": pagination,
            "cursor": cursor,
        }
    except (TypeError, ValueError):
        raise SheetError("invalid_state", _("Invalid view state.")) from None


def sort_specs(state, fields):
    if not isinstance(state["sort"], list) or len(state["sort"]) > 10:
        raise SheetError("invalid_sort", _("Expected up to ten sort fields."))
    specs = []
    for item in state["sort"]:
        if (
            not isinstance(item, dict)
            or set(item) != {"field", "dir"}
            or item["dir"] not in ("asc", "desc")
        ):
            raise SheetError("invalid_sort", _("Expected field and asc/desc direction."))
        if item["field"] != "pk":
            require_fields([item["field"]], fields)
        specs.append({"field": item["field"], "dir": item["dir"]})
    if not any(item["field"] == "pk" for item in specs):
        specs.append({"field": "pk", "dir": "desc"})
    return specs


def encode_cursor(values):
    payload = json.dumps(values, separators=(",", ":"), default=str).encode()
    signature = salted_hmac("modelsheet.cursor", payload, algorithm="sha256").hexdigest()
    raw = signature.encode() + b"." + payload
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_cursor(token):
    padded = token + "=" * (-len(token) % 4)
    try:
        raw = base64.urlsafe_b64decode(padded.encode())
        signature, payload = raw.split(b".", 1)
        values = json.loads(payload)
    except (ValueError, binascii.Error, UnicodeError, json.JSONDecodeError):
        raise SheetError("invalid_cursor", _("Cursor is invalid.")) from None
    expected = salted_hmac("modelsheet.cursor", payload, algorithm="sha256").hexdigest().encode()
    if not constant_time_compare(signature, expected) or not isinstance(values, list):
        raise SheetError("invalid_cursor", _("Cursor is invalid."))
    return values


def cursor_values(obj, specs):
    values = []
    for spec in specs:
        if spec["field"] == "pk":
            values.append(serialize(obj.pk))
            continue
        field = obj._meta.get_field(spec["field"])
        values.append(serialize(field.value_from_object(obj)))
    return values


def restore_cursor_values(model, specs, raw_values):
    if len(raw_values) != len(specs):
        raise SheetError("invalid_cursor", _("Cursor is invalid."))
    adapter = component("field_adapter")
    restored = []
    for spec, value in zip(specs, raw_values, strict=True):
        if value is None:
            restored.append(None)
            continue
        if spec["field"] == "pk":
            restored.append(model._meta.pk.to_python(value))
            continue
        field = model._meta.get_field(spec["field"])
        target = field.target_field if field.is_relation else field
        try:
            restored.append(adapter.parse(target, value))
        except (ValidationError, ValueError, TypeError, ArithmeticError):
            raise SheetError("invalid_cursor", _("Cursor is invalid.")) from None
    return restored


def keyset_filter(specs, values):
    """Следующая страница при NULLS LAST: NULL больше любого значения в обоих направлениях."""
    query = Q()
    added = False
    for index, (spec, value) in enumerate(zip(specs, values, strict=True)):
        equals = Q()
        for earlier, earlier_value in zip(specs[:index], values[:index], strict=True):
            name = earlier["field"]
            if earlier_value is None:
                equals &= Q(**{f"{name}__isnull": True})
            else:
                equals &= Q(**{name: earlier_value})
        if value is None:
            continue
        lookup = "gt" if spec["dir"] == "asc" else "lt"
        strict = Q(**{f"{spec['field']}__{lookup}": value}) | Q(
            **{f"{spec['field']}__isnull": True}
        )
        query |= equals & strict
        added = True
    if not added:
        return Q(pk__in=[])
    return query


def apply_ordering(qs, specs, *, keyset):
    if not keyset:
        # Прежний контракт: сортировка пользователя и обязательный хвост -pk.
        user = [("-" if spec["dir"] == "desc" else "") + spec["field"] for spec in specs]
        if user and user[-1] == "-pk":
            user = user[:-1]
        return qs.order_by(*user, "-pk")
    expressions = []
    for spec in specs:
        expression = F(spec["field"])
        expressions.append(
            expression.desc(nulls_last=True)
            if spec["dir"] == "desc"
            else expression.asc(nulls_last=True)
        )
    return qs.order_by(*expressions)


def queryset(request, admin, fields, state):
    qs = admin.get_queryset(request)
    if qs.db != "default":
        raise SheetError(
            "database_unsupported", _("Model sheets currently require the default database.")
        )
    qs = qs.filter(condition(state["filter"], admin.model, fields))
    if state["q"]:
        names = [n for n in admin.get_search_fields(request) if n in fields]
        if names:
            from django.contrib.admin import ModelAdmin

            safe_admin = copy(admin)
            safe_admin.get_search_fields = lambda request: names
            qs, duplicates = ModelAdmin.get_search_results(safe_admin, request, qs, state["q"])
            if duplicates:
                qs = qs.distinct()
        else:
            qs = qs.none()
    specs = sort_specs(state, fields)
    keyset = state.get("pagination") == "keyset"
    qs = apply_ordering(qs, specs, keyset=keyset)
    if keyset and state.get("cursor"):
        raw = decode_cursor(state["cursor"])
        qs = qs.filter(keyset_filter(specs, restore_cursor_values(admin.model, specs, raw)))
    related, prefetched = [], []
    for name in fields:
        field = admin.model._meta.get_field(name)
        if field.many_to_one:
            related.append(name)
        elif field.many_to_many:
            prefetched.append(name)
    if related:
        qs = qs.select_related(*related)
    if prefetched:
        qs = qs.prefetch_related(*prefetched)
    return qs
