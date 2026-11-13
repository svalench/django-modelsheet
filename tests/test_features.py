import io
import json
import time
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command

from demo.shop.models import Category, Product, Tag
from modelsheet.models import Operation, SavedView
from modelsheet.permissions import PermissionPolicy

from .conftest import BASE, loaded, post, save_payload

pytestmark = pytest.mark.django_db(transaction=True)


def grant(user, *names):
    user.user_permissions.add(*Permission.objects.filter(codename__in=names))


def test_relation_labels_lookup_and_decimal_comma(api, products):
    tag = Tag.objects.create(name="Cold")
    products[0].tags.add(tag)
    products[0].name = "<img src=x onerror=alert(1)>"
    products[0].save(update_fields=["name"])
    view = loaded(api, sort='[{"field":"pk","dir":"asc"}]')
    row = view["rows"][0]
    assert row["labels"]["category"] == "Consumables"
    assert row["labels"]["tags"] == ["Cold"]
    assert row["values"]["tags"] == [tag.pk]
    assert row["values"]["name"].startswith("<img")
    found = api.get(BASE + "lookup/", {"field": "category", "q": "Cons"})
    assert found.status_code == 200
    assert found.json()["results"][0]["label"] == "Consumables"
    assert b"<" not in found.content
    saved = post(api, "save", save_payload(view, {"price": "1.234,50", "category": products[0].category_id}))
    assert saved.status_code == 200, saved.content
    products[0].refresh_from_db()
    assert products[0].price == Decimal("1234.50")
    other = Category.objects.create(name="Spare")
    again = loaded(api)
    moved = post(api, "save", save_payload(again, {"category": other.pk}, key="move-category"))
    assert moved.status_code == 200, moved.content
    products[0].refresh_from_db()
    assert products[0].category_id == other.pk


def test_lookup_requires_search_fields(api, products, monkeypatch):
    from django.contrib import admin

    monkeypatch.setattr(admin.site._registry[Category], "get_search_fields", lambda request: ())
    response = api.get(BASE + "lookup/", {"field": "category", "q": "Cons"})
    assert response.status_code == 404


def test_lookup_respects_related_admin_permission(api, products):
    user = get_user_model().objects.create_user(username="clerk", is_staff=True)
    grant(
        user,
        "open",
        "view_product",
        "view_field_shop_product_category",
        "view_field_shop_product_name",
    )
    api.force_login(user)
    assert loaded(api)["rows"][0]["labels"]["category"] == "Consumables"
    denied = api.get(BASE + "lookup/", {"field": "category", "q": "Cons"})
    assert denied.status_code == 403


def test_object_pages_have_no_holes(api, products, monkeypatch):
    hidden = products[1]
    monkeypatch.setattr(
        PermissionPolicy,
        "can_view_object",
        lambda self, request, admin, obj: obj.pk != hidden.pk,
    )
    params = {"limit": "1", "sort": '[{"field":"pk","dir":"asc"}]'}
    first = api.get(BASE + "rows/", params).json()
    assert first["rows"][0]["pk"] == str(products[0].pk)
    assert first["count"] == 2 and first["has_next"] is True
    second = api.get(BASE + "rows/", {**params, "offset": 1}).json()
    assert second["rows"][0]["pk"] == str(products[2].pk)
    assert second["has_next"] is False


def test_keyset_pages_follow_sort_including_nulls(api, products, settings):
    products[0].category = None
    products[0].save(update_fields=["category"])
    settings.MODELSHEET = {"max_offset": 10, "page_size": 1}
    params = {
        "pagination": "keyset",
        "limit": 1,
        "offset": 999999,
        "sort": json.dumps([{"field": "category", "dir": "asc"}, {"field": "pk", "dir": "asc"}]),
    }
    seen = []
    cursor = None
    for _ in range(5):
        query = dict(params)
        if cursor:
            query["cursor"] = cursor
        page = api.get(BASE + "rows/", query)
        assert page.status_code == 200, page.content
        body = page.json()
        seen.extend(row["pk"] for row in body["rows"])
        if not body["has_next"]:
            break
        cursor = body["next_cursor"]
    ordered = list(
        Product.objects.order_by("category_id", "pk").values_list("pk", flat=True)
    )
    # NULLS LAST: заполненная категория раньше пустой.
    assert [int(pk) for pk in seen] == sorted(ordered, key=lambda pk: (Product.objects.get(pk=pk).category_id is None, Product.objects.get(pk=pk).category_id or 0, pk))
    forged = api.get(BASE + "rows/", {**params, "cursor": "aaaa"})
    assert forged.status_code == 400
    assert forged.json()["error"]["code"] == "invalid_cursor"


def test_export_is_permission_aware_and_formula_safe(api, products, monkeypatch):
    hidden = products[2]
    hidden.note = "=1+1"
    hidden.save(update_fields=["note"])
    products[0].note = "=1+1"
    products[0].save(update_fields=["note"])
    monkeypatch.setattr(
        PermissionPolicy,
        "can_view_object",
        lambda self, request, admin, obj: obj.pk != hidden.pk,
    )
    response = api.get(BASE + "export/", {"format": "csv", "sort": '[{"field":"pk","dir":"asc"}]'})
    assert response.status_code == 200
    text = b"".join(response.streaming_content).decode()
    assert response["Content-Type"].startswith("text/csv")
    assert "Consumables" in text
    assert hidden.name not in text
    assert "'=1+1" in text
    assert "tags" in text.splitlines()[0]
    denied = api.get(BASE + "export/", {"format": "xlsx"})
    assert denied.status_code == 415
    user = get_user_model().objects.create_user(username="narrow", is_staff=True)
    grant(user, "open", "view_product", "view_field_shop_product_name")
    api.force_login(user)
    narrow = b"".join(api.get(BASE + "export/", {"format": "csv"}).streaming_content).decode()
    assert "price" not in narrow.splitlines()[0]
    assert "name" in narrow.splitlines()[0]


def test_import_preview_confirm_and_label_resolution(api, products):
    other = Category.objects.create(name="Spare")
    body = (
        "pk,price,category\n"
        f"{products[1].pk},\"12,40\",Spare\n"
    ).encode()
    preview = api.post(
        BASE + "import/",
        {
            "phase": "preview",
            "mapping": json.dumps({"pk": "pk", "price": "price", "category": "category"}),
            "idempotency_key": "import-1",
            "file": SimpleUploadedFile("goods.csv", body, content_type="text/csv"),
        },
    )
    assert preview.status_code == 200, preview.content
    assert preview.json()["status"] == "preview", preview.json()
    assert preview.json()["errors"] == 0, preview.json()["items"][0]["error"]
    confirmed = post(api, "bulk/run", {"operation": preview.json()["id"]})
    assert confirmed.status_code == 200, confirmed.content
    products[1].refresh_from_db()
    assert products[1].price == Decimal("12.40")
    assert products[1].category_id == other.pk
    inspected = api.post(
        BASE + "import/",
        {"phase": "inspect", "file": SimpleUploadedFile("goods.csv", body, content_type="text/csv")},
    )
    assert inspected.json()["headers"] == ["pk", "price", "category"]


def test_create_delete_and_conflict_safe_undo(api, products):
    view = loaded(api, sort='[{"field":"pk","dir":"asc"}]')
    removed = products[2]
    payload = save_payload(view, {"price": "11.00"})
    payload["creates"] = [{"temp_id": "new:1", "values": {"name": "Fresh", "price": "3.50", "stock": 1}}]
    payload["deletes"] = [{"pk": str(removed.pk), "version": view["rows"][2]["version"]}]
    payload["idempotency_key"] = "mix-1"
    saved = post(api, "save", payload)
    assert saved.status_code == 200, saved.content
    actions = {item["pk"]: item["action"] for item in saved.json()["items"]}
    assert "create" in actions.values() and "delete" in actions.values()
    assert not Product.objects.filter(pk=removed.pk).exists()
    created = Product.objects.get(name="Fresh")
    assert created.price == Decimal("3.50")
    Product.objects.filter(pk=products[0].pk).update(price="99")
    denied = post(api, "undo", {"idempotency_key": "undo-1"})
    assert denied.status_code == 409
    assert denied.json()["error"]["code"] == "row_conflict"
    assert not Product.objects.filter(pk=removed.pk).exists()
    assert Product.objects.filter(pk=created.pk).exists()


def test_undo_restores_deleted_row_when_fingerprint_matches(api, products):
    view = loaded(api, sort='[{"field":"pk","dir":"asc"}]')
    target = products[2]
    payload = {
        "snapshot": view["snapshot"],
        "view_state": view["state"],
        "idempotency_key": "delete-only",
        "changes": [],
        "deletes": [{"pk": str(target.pk), "version": view["rows"][2]["version"]}],
    }
    assert post(api, "save", payload).status_code == 200
    assert not Product.objects.filter(pk=target.pk).exists()
    undone = post(api, "undo", {"idempotency_key": "undo-delete"})
    assert undone.status_code == 200, undone.content
    assert Product.objects.filter(pk=target.pk, name=target.name).exists()
    again = post(api, "undo", {"idempotency_key": "undo-delete-2"})
    assert again.status_code == 409


def test_validate_does_not_write(api, products):
    view = loaded(api)
    response = post(
        api,
        "validate",
        {"changes": [{"pk": view["rows"][0]["pk"], "values": {"stock": -1, "price": "10,25"}}]},
    )
    assert response.status_code == 200, response.content
    assert response.json()["results"][0]["ok"] is False
    products[0].refresh_from_db()
    assert products[0].stock == 0
    assert products[0].price == Decimal("10.00")
    ok = post(
        api,
        "validate",
        {"changes": [{"pk": "new:1", "values": {"name": "Draft", "price": "4", "stock": 1}}]},
    )
    assert ok.json()["results"][0]["ok"] is True
    assert not Product.objects.filter(name="Draft").exists()


def test_saved_views_are_private_until_shared(api, products):
    state = {"q": "Product", "filter": {}, "sort": [{"field": "name", "dir": "asc"}], "frozen": 1, "widths": {"name": 180}}
    saved = post(api, "views/save", {"name": "Shelf", "state": state, "shared": False})
    assert saved.status_code == 200, saved.content
    assert api.get(BASE + "views/").json()["views"][0]["name"] == "Shelf"
    other = get_user_model().objects.create_superuser(username="other", password="password", email="o@example.test")
    api.force_login(other)
    assert api.get(BASE + "views/").json()["views"] == []
    api.force_login(get_user_model().objects.get(username="admin"))
    assert post(api, "views/save", {"name": "Shelf", "state": state, "shared": True}).status_code == 200
    api.force_login(other)
    assert api.get(BASE + "views/").json()["views"][0]["shared"] is True
    assert post(api, "views/delete", {"id": SavedView.objects.get().pk}).status_code == 404


def test_roles_grant_undo_to_editors_not_viewers():
    call_command("modelsheet_roles", stdout=io.StringIO())
    admin = Group.objects.get(name="ModelSheet Admin").permissions
    viewer = Group.objects.get(name="ModelSheet Viewer").permissions
    editor = Group.objects.get(name="ModelSheet Editor").permissions
    assert admin.filter(codename="undo_shop_product").exists()
    assert editor.filter(codename="undo_shop_product").exists()
    assert editor.filter(codename="add_product").exists()
    assert not viewer.filter(codename="undo_shop_product").exists()
    assert not viewer.filter(codename="add_product").exists()


def test_thread_adapter_previews_above_the_threshold(api, products, settings):
    settings.MODELSHEET = {
        "background_adapter": "modelsheet.background.ThreadBackgroundAdapter",
        "bulk_background_threshold": 1,
    }
    from .conftest import preview_payload

    response = post(api, "bulk/preview", preview_payload())
    assert response.status_code == 200, response.content
    operation = None
    for _ in range(50):
        operation = Operation.objects.get(pk=response.json()["id"])
        if operation.status == "preview":
            break
        time.sleep(0.05)
    assert operation is not None
    assert operation.status == "preview"
    assert operation.total == 3


def test_django_tasks_adapter_runs_when_configured(api, products, settings):
    pytest.importorskip("django.tasks")
    settings.MODELSHEET = {
        "background_adapter": "modelsheet.background.DjangoTasksBackgroundAdapter",
        "bulk_background_threshold": 1,
    }
    settings.TASKS = {
        "default": {"BACKEND": "django.tasks.backends.immediate.ImmediateBackend"}
    }
    from .conftest import preview_payload

    response = post(api, "bulk/preview", preview_payload())
    assert response.status_code == 200, response.content
    operation = Operation.objects.get(pk=response.json()["id"])
    assert operation.status == "preview"
    assert operation.total == 3


def test_celery_adapter_reports_missing_dependency():
    from modelsheet.contrib.celery_adapter import CeleryBackgroundAdapter, process_operation

    if getattr(process_operation, "delay", None) is not None:
        pytest.skip("celery is installed")
    with pytest.raises(RuntimeError, match="celery"):
        CeleryBackgroundAdapter().enqueue("1", "preview")
