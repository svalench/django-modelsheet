import json
from datetime import timedelta
from decimal import Decimal

import pytest
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.db.models.signals import post_save
from django.test import Client
from django.utils import timezone

from demo.shop.models import Product
from modelsheet.models import Operation, ViewSnapshot
from .conftest import BASE, loaded, post, preview_payload, save_payload

pytestmark = pytest.mark.django_db(transaction=True)


def test_schema_exposes_explicit_fields(api):
    response = api.get(BASE + "schema/")
    assert response.status_code == 200
    fields = {f["name"]: f for f in response.json()["fields"]}
    assert not fields["category"]["editable"]
    assert fields["price"]["editable"]
    assert "id" not in fields


def test_atomic_save_and_idempotent_retry(api, products):
    view = loaded(api)
    payload = save_payload(view, {"price": "12.34", "stock": 7})
    saved = []

    def receiver(sender, instance, **kwargs):
        saved.append(instance.pk)

    post_save.connect(receiver, sender=Product)
    try:
        first = post(api, "save", payload)
        second = post(api, "save", payload)
    finally:
        post_save.disconnect(receiver, sender=Product)
    assert first.status_code == second.status_code == 200, first.content
    assert first.json()["id"] == second.json()["id"]
    products[0].refresh_from_db()
    assert products[0].price == Decimal("12.34") and products[0].stock == 7
    assert saved == [products[0].pk]
    assert Operation.objects.count() == 1
    assert first.json()["items"][0]["before"]["price"] == "10.00"


def test_key_cannot_be_reused_for_other_changes(api, products):
    view = loaded(api)
    assert post(api, "save", save_payload(view, {"price": "12"})).status_code == 200
    response = post(api, "save", save_payload(view, {"price": "13"}))
    assert response.status_code == 409


def test_external_write_conflict(api, products):
    view = loaded(api)
    Product.objects.filter(pk=products[0].pk).update(price="20")
    response = post(api, "save", save_payload(view, {"price": "12"}))
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "row_conflict"
    assert not Operation.objects.exists()


def test_real_admin_write_conflicts(api, products):
    view = loaded(api)
    product = products[0]
    result = api.post(
        f"/admin/shop/product/{product.pk}/change/",
        {
            "name": product.name,
            "price": "22.00",
            "cost_price": "0",
            "stock": "0",
            "status": "ready",
            "category": product.category_id,
            "active": "on",
            "note": "",
            "available_on": "",
            "_save": "Save",
        },
    )
    assert result.status_code == 302
    assert post(api, "save", save_payload(view, {"price": "12"})).status_code == 409


def test_cross_field_validation_and_whole_batch_rollback(api, products):
    view = loaded(api)
    payload = save_payload(view, {"price": "15"})
    second = view["rows"][1]
    payload["changes"].append(
        {"pk": second["pk"], "version": second["version"], "values": {"stock": -1}}
    )
    response = post(api, "save", payload)
    assert response.status_code == 400
    assert response.json()["error"]["details"]["stock"]
    assert Product.objects.get(pk=products[0].pk).price == Decimal("10")
    assert Operation.objects.count() == 0
    assert (
        post(
            api, "save", save_payload(view, {"price": "15", "cost_price": "14"}, key="valid")
        ).status_code
        == 200
    )


def test_unique_error_not_500(api, products):
    view = loaded(api)
    response = post(api, "save", save_payload(view, {"name": products[1].name}))
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "validation"


def test_readonly_and_unknown_fields_rejected(api, products):
    view = loaded(api)
    for values in ({"id": 9}, {"category": 9}, {"__class__": "oops"}):
        assert post(api, "save", save_payload(view, values)).status_code == 403


def test_snapshot_bound_to_state_and_expiry(api, products):
    view = loaded(api)
    payload = save_payload(view, {"price": "=B1+1"})
    payload["view_state"] = {**view["state"], "offset": 200}
    assert post(api, "save", payload).json()["error"]["code"] == "stale_view"
    ViewSnapshot.objects.update(created_at=timezone.now() - timedelta(hours=1))
    assert (
        post(api, "save", save_payload(view, {"price": "11"})).json()["error"]["code"]
        == "expired_snapshot"
    )


def test_formulas_and_dependency_conflict(api, products):
    view = loaded(api)
    response = post(api, "save", save_payload(view, {"price": "=[price]*1.07"}))
    assert response.status_code == 200, response.content
    assert Product.objects.get(pk=products[0].pk).price == Decimal("10.70")
    view = loaded(api)
    Product.objects.filter(pk=products[1].pk).update(stock=4)
    response = post(api, "save", save_payload(view, {"price": "=B2+1"}, key="dependency"))
    assert response.status_code == 409


@pytest.mark.parametrize(
    "expression,code",
    [
        ("=B999", "#REF!"),
        ("=B1", "#CYCLE!"),
        ("=eval(1)", "#NAME?"),
        ("=1/0", "#DIV/0!"),
        ("=QSUM([price])", "#REF!"),
    ],
)
def test_invalid_formulas(api, products, expression, code):
    view = loaded(api)
    response = post(api, "save", save_payload(view, {"price": expression}))
    assert response.status_code == 400
    assert response.json()["error"]["code"] == code


def test_literal_formula_text(api, products):
    view = loaded(api)
    assert post(api, "save", save_payload(view, {"note": "'=eval(1)"})).status_code == 200
    assert Product.objects.get(pk=products[0].pk).note == "=eval(1)"


def test_referenced_existing_model_text_is_not_executed(api, products):
    Product.objects.filter(pk=products[1].pk).update(note="=eval(1)")
    view = loaded(api)
    response = post(api, "save", save_payload(view, {"note": '=CONCAT(I2,"!")'}))
    assert response.status_code == 200, response.content
    assert Product.objects.get(pk=products[0].pk).note == "=eval(1)!"


def test_filters_search_sort_and_count(api, products, settings):
    view = loaded(
        api,
        filter=json.dumps(
            {
                "or": [
                    {"field": "stock", "op": "eq", "value": 2},
                    {"field": "stock", "op": "eq", "value": 0},
                ]
            }
        ),
        sort=json.dumps([{"field": "stock", "dir": "desc"}]),
        limit=1,
    )
    assert view["count"] == 2 and view["has_next"]
    assert view["rows"][0]["pk"] == str(products[2].pk)
    settings.MODELSHEET = {**settings.MODELSHEET, "count_mode": "none"}
    assert loaded(api, q="Product 1")["count"] is None


def test_filter_limits_and_orm_injection(api, products):
    response = api.get(
        BASE + "rows/", {"filter": json.dumps({"field": "price__gte", "op": "eq", "value": 0})}
    )
    assert response.status_code == 403
    tree = {"field": "price", "op": "gt", "value": 0}
    for _ in range(12):
        tree = {"and": [tree]}
    response = api.get(BASE + "rows/", {"filter": json.dumps(tree)})
    assert response.json()["error"]["code"] == "filter_limit"


def test_csrf_and_http_methods(user, products):
    client = Client(enforce_csrf_checks=True)
    client.force_login(user)
    assert post(client, "save", {}).status_code == 403
    assert client.get(BASE + "save/").status_code == 405


def grant(user, *names):
    user.user_permissions.add(*Permission.objects.filter(codename__in=names))


def test_hidden_field_not_accessible_through_any_surface(api, products):
    user = get_user_model().objects.create_user(username="limited", is_staff=True)
    grant(
        user,
        "open",
        "view_product",
        "change_product",
        "view_field_shop_product_name",
        "view_field_shop_product_price",
        "edit_field_shop_product_price",
        "bulk_shop_product",
        "history_shop_product",
    )
    api.force_login(user)
    view = loaded(api)
    assert set(view["rows"][0]["values"]) == {"name", "price"}
    assert api.get(BASE + "schema/").json()["computed"] == []
    response = api.get(
        BASE + "rows/", {"filter": json.dumps({"field": "cost_price", "op": "gt", "value": 1})}
    )
    assert response.status_code == 403
    assert post(api, "save", save_payload(view, {"cost_price": 1})).status_code == 403
    assert post(api, "save", save_payload(view, {"price": "=[cost_price]+1"})).status_code == 403
    assert (
        post(
            api, "bulk/preview", preview_payload(assignments={"price": "=[cost_price]+1"})
        ).status_code
        == 403
    )


def test_field_grant_does_not_grant_model_change(api, products):
    user = get_user_model().objects.create_user(username="viewer", is_staff=True)
    grant(
        user,
        "open",
        "view_product",
        "view_field_shop_product_price",
        "edit_field_shop_product_price",
    )
    api.force_login(user)
    view = loaded(api)
    assert not api.get(BASE + "schema/").json()["fields"][0]["editable"]
    assert post(api, "save", save_payload(view, {"price": 12})).status_code == 403


def test_row_scope_rechecked_at_save(api, products, monkeypatch):
    view = loaded(api)
    model_admin = admin.site._registry[Product]
    monkeypatch.setattr(
        model_admin, "get_queryset", lambda request: Product.objects.exclude(pk=products[0].pk)
    )
    assert post(api, "save", save_payload(view, {"price": 12})).status_code == 409


def test_history_masks_now_hidden_values(api, products):
    view = loaded(api)
    op = post(api, "save", save_payload(view, {"price": 12, "cost_price": 11})).json()
    user = get_user_model().objects.create_user(username="auditor", is_staff=True)
    grant(user, "open", "view_product", "view_field_shop_product_name", "history_shop_product")
    api.force_login(user)
    response = api.get(BASE + f"operations/{op['id']}/")
    assert response.status_code == 200
    assert response.json()["items"][0]["before"] == {}
    assert "cost_price" not in response.content.decode()
    audit = api.get(f"/admin/modelsheet/operation/{op['id']}/change/")
    assert audit.status_code == 200
    assert b"cost_price" not in audit.content
    assert api.post(f"/admin/modelsheet/operation/{op['id']}/change/", {}).status_code == 405


def test_admin_bridge_blocks_complex_filter_and_mismatched_pages(api):
    tree = {
        "or": [
            {"field": "price", "op": "gt", "value": 1},
            {"field": "stock", "op": "lt", "value": 2},
        ]
    }
    assert (
        api.get(BASE + "admin-state/", {"filter": json.dumps(tree), "limit": 200}).status_code
        == 409
    )
    assert api.get(BASE + "admin-state/", {"limit": 100}).status_code == 409
    response = api.get(BASE + "admin-state/", {"limit": 200, "offset": 400})
    assert response.status_code == 200 and "p=2" in response.json()["url"]


def test_admin_page_escapes_embedded_values(api, products):
    response = api.get(BASE, {"q": "</script><script>alert(1)</script>"})
    assert response.status_code == 200
    assert b"</script><script>alert(1)" not in response.content
    assert b"modelsheet/sheet.js" in response.content
