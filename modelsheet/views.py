import json

from django.core.exceptions import RequestDataTooBig, ValidationError
from django.db import OperationalError
from django.http import JsonResponse

from . import bulk, services
from .conf import config
from .errors import SheetError
from .models import Operation


def endpoint(request, admin, action, operation_id=None):
    expected = "GET" if action in ("schema", "rows", "operation", "history") else "POST"
    if request.method != expected:
        response = JsonResponse(
            {"error": {"code": "method_not_allowed", "message": f"Use {expected}."}}, status=405
        )
        response["Allow"] = expected
        return response
    try:
        if expected == "POST":
            if request.content_type != "application/json":
                raise SheetError("content_type", "Use application/json.", status=415)
            if len(request.body) > config()["max_request_bytes"]:
                raise SheetError("request_limit", "Request body is too large.", status=413)
            payload = json.loads(request.body or b"{}")
            if not isinstance(payload, dict):
                raise SheetError("invalid_json", "Expected a JSON object.")
        if action == "schema":
            data = services.schema(request, admin)
        elif action == "rows":
            data = services.rows(request, admin, request.GET)
        elif action == "save":
            data = services.save(request, admin, payload)
        elif action == "preview":
            data = bulk.preview(request, admin, payload)
        elif action == "run":
            data = bulk.run(request, admin, payload.get("operation"))
        elif action in ("cancel", "resume"):
            data = getattr(bulk, action)(request, admin, operation_id)
        elif action == "operation":
            services.check_model(request, admin)
            op = services.get_operation(request, admin, operation_id, own=False)
            data = services.report(
                request, admin, op, own=True, offset=max(0, int(request.GET.get("offset", 0)))
            )
        elif action == "history":
            services.check_model(request, admin, action="history")
            offset = max(0, int(request.GET.get("offset", 0)))
            ops = Operation.objects.filter(
                model_label=admin.model._meta.label, site_name=admin.admin_site.name
            ).order_by("-created_at")
            data = {
                "operations": [
                    services.report(request, admin, op, include_items=False)
                    for op in ops[offset : offset + 20]
                ],
                "has_next": ops[offset + 20 : offset + 21].exists(),
            }
        response = JsonResponse(data)
    except SheetError as exc:
        response = JsonResponse({"error": exc.as_dict()}, status=exc.status)
    except (
        json.JSONDecodeError,
        UnicodeDecodeError,
        ValidationError,
        ValueError,
        TypeError,
        KeyError,
    ):
        response = JsonResponse(
            {"error": {"code": "invalid_request", "message": "Malformed request."}}, status=400
        )
    except RequestDataTooBig:
        response = JsonResponse(
            {"error": {"code": "request_limit", "message": "Request body is too large."}},
            status=413,
        )
    except OperationalError:
        response = JsonResponse(
            {
                "error": {
                    "code": "database_busy",
                    "message": "Database unavailable or busy; retry with the same key.",
                }
            },
            status=503,
        )
    response["Cache-Control"] = "no-store"
    return response
