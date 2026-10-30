import json
from copy import copy

from django.core.exceptions import ValidationError
from django.db.models import Q

from django.utils.translation import gettext_lazy as _

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
            raise SheetError("invalid_filter", _("Invalid filter value."), field=name)

    return walk(tree)


def parse_offset(params):
    """Parse a non-negative ``offset`` bounded by ``MODELSHEET["max_offset"]``."""
    try:
        offset = max(0, int(params.get("offset", 0)))
    except (TypeError, ValueError):
        raise SheetError("invalid_offset", _("Offset must be an integer."))
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
        return {
            "q": str(params.get("q", ""))[:500],
            "filter": json.loads(filters) if isinstance(filters, str) else filters,
            "sort": json.loads(sort) if isinstance(sort, str) else sort,
            "offset": parse_offset(params),
            "limit": min(
                config()["max_page_size"], max(1, int(params.get("limit", config()["page_size"])))
            ),
            "columns": json.loads(columns) if isinstance(columns, str) else columns,
        }
    except (TypeError, ValueError):
        raise SheetError("invalid_state", _("Invalid view state."))


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
    ordering = []
    if not isinstance(state["sort"], list) or len(state["sort"]) > 10:
        raise SheetError("invalid_sort", _("Expected up to ten sort fields."))
    for item in state["sort"]:
        if (
            not isinstance(item, dict)
            or set(item) != {"field", "dir"}
            or item["dir"] not in ("asc", "desc")
        ):
            raise SheetError("invalid_sort", _("Expected field and asc/desc direction."))
        if item["field"] != "pk":
            require_fields([item["field"]], fields)
        ordering.append(("-" if item["dir"] == "desc" else "") + item["field"])
    qs = qs.order_by(*ordering, "-pk")
    related = [name for name in fields if admin.model._meta.get_field(name).many_to_one]
    return qs.select_related(*related) if related else qs
