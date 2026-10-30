from decimal import Decimal

import pytest
from django.contrib import admin

from demo.shop.models import Product

from .conftest import BASE, loaded, post, preview_payload, save_payload

pytestmark = pytest.mark.django_db(transaction=True)


@pytest.fixture
def lock_first(monkeypatch, products):
    """Make ``price`` read-only only for the first product, like ``if obj and obj.locked``."""
    model_admin = admin.site._registry[Product]
    original = model_admin.get_readonly_fields

    def readonly(request, obj=None):
        fields = tuple(original(request, obj))
        if obj is not None and obj.pk == products[0].pk:
            fields += ("price",)
        return fields

    monkeypatch.setattr(model_admin, "get_readonly_fields", readonly)
    return products[0]


def test_save_rejects_field_readonly_for_this_object(api, lock_first):
    view = loaded(api)
    assert view["rows"][0]["pk"] == str(lock_first.pk)
    response = post(api, "save", save_payload(view, {"price": 99}))
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "readonly_field"
    lock_first.refresh_from_db()
    assert lock_first.price == Decimal("10.00")
    # Other rows stay editable.
    ok = post(api, "save", save_payload(view, {"price": 99}, index=1, key="save-2"))
    assert ok.status_code == 200, ok.content


def test_bulk_preview_marks_object_readonly_rows_as_errors(api, lock_first):
    op = post(api, "bulk/preview", preview_payload(assignments={"price": 5})).json()
    assert op["errors"] == 1
    assert post(api, "bulk/run", {"operation": op["id"]}).status_code == 409
    lock_first.refresh_from_db()
    assert lock_first.price == Decimal("10.00")


def test_snapshots_are_pruned_per_user(api, products, settings):
    from modelsheet.models import ViewSnapshot

    settings.MODELSHEET = {"max_snapshots_per_user": 3}
    views = [loaded(api) for _ in range(5)]
    assert ViewSnapshot.objects.count() == 3
    # The newest snapshot is still usable for saving.
    response = post(api, "save", save_payload(views[-1], {"price": 11}))
    assert response.status_code == 200, response.content


def test_snapshot_reads_are_rate_limited(api, products, settings):
    settings.MODELSHEET = {"max_snapshots_per_minute": 2}
    loaded(api)
    loaded(api)
    response = api.get(BASE + "rows/")
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "rate_limit"


def test_snapshot_values_of_revoked_fields_are_not_used(api, products):
    from django.contrib.auth import get_user_model
    from django.contrib.auth.models import Permission

    from modelsheet.models import ViewSnapshot
    from modelsheet.services import SheetCalculation

    user = get_user_model().objects.create_user(username="revoked", is_staff=True)
    names = [
        "open",
        "view_product",
        "change_product",
        "view_field_shop_product_name",
        "view_field_shop_product_price",
        "edit_field_shop_product_price",
        "view_field_shop_product_stock",
    ]
    user.user_permissions.add(*Permission.objects.filter(codename__in=names))
    api.force_login(user)
    view = loaded(api, columns='["name","price","stock"]')
    assert "stock" in view["rows"][0]["values"]
    user.user_permissions.remove(Permission.objects.get(codename="view_field_shop_product_stock"))
    api.force_login(get_user_model().objects.get(pk=user.pk))
    response = post(api, "save", save_payload(view, {"price": "=C1"}))
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "#REF!"
    snapshot = ViewSnapshot.objects.get(pk=view["snapshot"])
    calculation = SheetCalculation(snapshot, [], {"name": {}, "price": {}})
    assert all("stock" not in row["values"] for row in calculation.rows.values())
