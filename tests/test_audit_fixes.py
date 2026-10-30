from decimal import Decimal

import pytest
from django.contrib import admin

from demo.shop.models import Product

from .conftest import loaded, post, preview_payload, save_payload

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
