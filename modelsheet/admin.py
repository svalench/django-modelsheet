from functools import partial
from copy import copy
from urllib.parse import urlencode

from django.contrib import admin
from django.contrib.admin.views.main import IncorrectLookupParameters
from django.db import transaction
from django.http import JsonResponse, Http404, HttpResponseNotAllowed, QueryDict
from django.core.exceptions import ValidationError
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.views.i18n import JavaScriptCatalog

from django.utils.translation import gettext_lazy as _

from .errors import SheetError
from .metadata import fields_for
from .permissions import scope_history
from .query import parse_state
from .services import check_model, report
from .models import Operation
from .views import endpoint


class ModelSheetAdmin(admin.ModelAdmin):
    sheet_fields = ()
    sheet_editable = ()
    sheet_computed_fields = {}
    sheet_enabled = True
    list_per_page = 200
    change_list_template = "modelsheet/change_list.html"

    def sheet_admin_ordering(self, request, fields):
        """Resolve Admin's actual ordering, including its deterministic PK tie breaker."""
        if request.GET.get("q") and (
            not set(self.get_search_fields(request)) <= fields.keys()
            or type(self).get_search_results is not admin.ModelAdmin.get_search_results
        ):
            raise SheetError(
                "admin_state_unsupported", _("Admin search cannot be transferred exactly.")
            )
        changelist = self.get_changelist_instance(request)
        result = []
        seen = set()
        for name in changelist.get_ordering(request, changelist.queryset):
            if not isinstance(name, str):
                raise SheetError(
                    "admin_state_unsupported", _("Expression ordering cannot be transferred.")
                )
            field = name.lstrip("-")
            if field == self.model._meta.pk.name:
                field = "pk"
            if field != "pk" and field not in fields:
                raise SheetError(
                    "admin_state_unsupported", _("Ordering uses an unavailable field.")
                )
            if field not in seen:
                result.append({"field": field, "dir": "desc" if name.startswith("-") else "asc"})
                seen.add(field)
        return result

    def get_urls(self):
        prefix = f"{self.model._meta.app_label}_{self.model._meta.model_name}"

        def wrap(view):
            return transaction.non_atomic_requests(self.admin_site.admin_view(view))

        routes = [
            path("sheet/", wrap(self.sheet_view), name=f"{prefix}_sheet"),
            path(
                "sheet/jsi18n/",
                wrap(JavaScriptCatalog.as_view(packages=["modelsheet"])),
                name=f"{prefix}_sheet_jsi18n",
            ),
            path("sheet/admin-state/", wrap(self.admin_state), name=f"{prefix}_sheet_admin_state"),
        ]
        for route, action in [
            ("schema", "schema"),
            ("rows", "rows"),
            ("save", "save"),
            ("bulk/preview", "preview"),
            ("bulk/run", "run"),
            ("history", "history"),
        ]:
            routes.append(
                path(
                    f"sheet/{route}/",
                    wrap(partial(endpoint, admin=self, action=action)),
                    name=f"{prefix}_sheet_{action}",
                )
            )
        for suffix, action in [("", "operation"), ("cancel/", "cancel"), ("resume/", "resume")]:
            routes.append(
                path(
                    f"sheet/operations/<uuid:operation_id>/{suffix}",
                    wrap(partial(endpoint, admin=self, action=action)),
                    name=f"{prefix}_sheet_{action}",
                )
            )
        return routes + super().get_urls()

    def changelist_view(self, request, extra_context=None):
        context = extra_context or {}
        try:
            check_model(request, self)
            context["modelsheet_url"] = (
                reverse(
                    f"{self.admin_site.name}:{self.model._meta.app_label}_{self.model._meta.model_name}_sheet"
                )
                + "?"
                + request.GET.urlencode()
            )
        except SheetError:
            pass
        return super().changelist_view(request, extra_context=context)

    def initial_state(self, request):
        """Translate the compatible subset of a Django changelist URL without dropping conditions."""
        from .metadata import require_fields

        fields = fields_for(request, self)
        if "offset" in request.GET or "filter" in request.GET or "sort" in request.GET:
            return parse_state(request.GET)
        state = parse_state(
            {
                "q": request.GET.get("q", ""),
                "limit": self.list_per_page,
                "offset": int(request.GET.get("p", 0)) * self.list_per_page,
            }
        )
        conditions = []
        for key, value in request.GET.items():
            if key in ("q", "p", "o", "_changelist_filters"):
                continue
            bits = key.split("__")
            name, lookup = bits[0], bits[1] if len(bits) == 2 else "exact"
            operators = {
                "exact": "eq",
                "isnull": "isnull",
                "gte": "gte",
                "lte": "lte",
                "gt": "gt",
                "lt": "lt",
                "icontains": "contains",
            }
            if len(bits) == 3 and name in fields:
                field = self.model._meta.get_field(name)
                if field.many_to_one and bits[1] == field.target_field.name:
                    lookup = bits[2]
                    bits = [name, lookup]
            if len(bits) > 2 or lookup not in operators:
                raise SheetError(
                    "admin_state_unsupported", _("This Admin filter cannot be transferred exactly.")
                )
            require_fields([name], fields)
            conditions.append(
                {
                    "field": name,
                    "op": operators[lookup],
                    "value": value.lower() in ("true", "1") if lookup == "isnull" else value,
                }
            )
        state["filter"] = {"and": conditions} if conditions else {}
        state["sort"] = self.sheet_admin_ordering(request, fields)
        return state

    def sheet_view(self, request):
        try:
            check_model(request, self)
            initial = self.initial_state(request)
        except (SheetError, ValueError, IncorrectLookupParameters) as exc:
            return TemplateResponse(
                request,
                "modelsheet/unavailable.html",
                {
                    **self.admin_site.each_context(request),
                    "title": "Model sheet unavailable",
                    "message": str(exc),
                    "opts": self.model._meta,
                },
                status=exc.status if isinstance(exc, SheetError) else 400,
            )
        context = {
            **self.admin_site.each_context(request),
            "title": str(self.model._meta.verbose_name_plural),
            "opts": self.model._meta,
            "initial_state": initial,
            "modelsheet_config": {
                "base": request.path,
                "language": request.LANGUAGE_CODE if hasattr(request, "LANGUAGE_CODE") else "en",
            },
        }
        return TemplateResponse(request, "modelsheet/sheet.html", context)

    def admin_state(self, request):
        """Return a URL only if the ordinary changelist can represent the complete view."""
        try:
            check_model(request, self)
            state = parse_state(request.GET)
            fields = fields_for(request, self)
            if state["limit"] != self.list_per_page or state["offset"] % self.list_per_page:
                raise SheetError(
                    "admin_state_unsupported", _("Admin and sheet page sizes must match.")
                )
            params = {"q": state["q"], "p": state["offset"] // self.list_per_page}
            tree = state["filter"]
            conditions = tree.get("and", [tree] if tree else [])
            for item in conditions:
                if (
                    set(item) != {"field", "op", "value"}
                    or item["op"] != "eq"
                    or item["field"] not in fields
                ):
                    raise SheetError(
                        "admin_state_unsupported",
                        _("Remove complex filters before opening ordinary Admin."),
                    )
                name = item["field"]
                if not self.lookup_allowed(f"{name}__exact", item["value"], request):
                    raise SheetError(
                        "admin_state_unsupported", _("Admin does not allow this filter.")
                    )
                key = f"{name}__exact"
                if key in params:
                    raise SheetError(
                        "admin_state_unsupported",
                        _("Repeated conditions cannot be transferred exactly."),
                    )
                params[key] = item["value"]
            display = list(self.get_list_display(request))
            if self.get_actions(request):
                display.insert(0, "action_checkbox")
            order = []
            for item in state["sort"]:
                if item["field"] == "pk":
                    continue
                if item["field"] not in display or item["field"] not in fields:
                    raise SheetError(
                        "admin_state_unsupported", _("Admin cannot represent this ordering.")
                    )
                order.append(
                    ("-" if item["dir"] == "desc" else "") + str(display.index(item["field"]))
                )
            if order:
                params["o"] = ".".join(order)
            candidate = copy(request)
            candidate.GET = QueryDict(urlencode(params))
            effective = list(state["sort"])
            if not any(item["field"] == "pk" for item in effective):
                effective.append({"field": "pk", "dir": "desc"})
            if effective != self.sheet_admin_ordering(candidate, fields):
                raise SheetError(
                    "admin_state_unsupported", _("Admin cannot preserve the complete ordering.")
                )
            url = reverse(
                f"{self.admin_site.name}:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist"
            )
            return JsonResponse({"url": url + "?" + urlencode(params)})
        except (SheetError, ValueError, TypeError, IncorrectLookupParameters) as exc:
            return JsonResponse(
                {"error": {"code": "admin_state_unsupported", "message": str(exc)}}, status=409
            )


@admin.register(Operation)
class OperationAdmin(admin.ModelAdmin):
    """Read-only audit UI; stored plans/context are never generic JSON fields."""

    list_display = ("id", "model_label", "kind", "status", "total", "changed", "created_at")
    actions = None
    show_full_result_count = False

    def targets(self, request):
        result = {}
        for model, model_admin in self.admin_site._registry.items():
            if isinstance(model_admin, ModelSheetAdmin):
                try:
                    check_model(request, model_admin, action="history")
                    result[model._meta.label] = model_admin
                except SheetError:
                    pass
        return result

    def has_module_permission(self, request):
        return bool(self.targets(request))

    def has_view_permission(self, request, obj=None):
        targets = self.targets(request)
        return (
            bool(targets)
            if obj is None
            else obj.model_label in targets and obj.site_name == self.admin_site.name
        )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_queryset(self, request):
        return scope_history(super().get_queryset(request), request.user).filter(
            model_label__in=self.targets(request), site_name=self.admin_site.name
        )

    def change_view(self, request, object_id, form_url="", extra_context=None):
        if request.method != "GET":
            return HttpResponseNotAllowed(["GET"])
        try:
            op = self.get_queryset(request).get(pk=object_id)
        except (Operation.DoesNotExist, ValueError, ValidationError):
            raise Http404
        try:
            offset = max(0, int(request.GET.get("offset", 0)))
        except ValueError:
            raise Http404
        data = report(request, self.targets(request)[op.model_label], op, offset=offset)
        return TemplateResponse(
            request,
            "modelsheet/audit.html",
            {
                **self.admin_site.each_context(request),
                "title": f"Operation {op.pk}",
                "opts": self.model._meta,
                "report": data,
            },
        )
