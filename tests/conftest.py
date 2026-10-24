from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from django.test import Client

from demo.shop.models import Category, Product


@pytest.fixture
def user():
    return get_user_model().objects.create_superuser(
        username="admin", password="password", email="admin@example.test"
    )


@pytest.fixture
def api(user):
    client = Client()
    client.force_login(user)
    return client


@pytest.fixture
def products():
    category = Category.objects.create(name="Consumables")
    return [
        Product.objects.create(
            name=f"Product {i}", price=Decimal("10.00"), stock=i, category=category
        )
        for i in range(3)
    ]


BASE = "/admin/shop/product/sheet/"


def post(api, route, payload):
    return api.post(BASE + route + "/", payload, content_type="application/json")


def loaded(api, **params):
    params.setdefault("sort", '[{"field":"pk","dir":"asc"}]')
    response = api.get(BASE + "rows/", params)
    assert response.status_code == 200, response.content
    return response.json()


def save_payload(view, values, index=0, key="save-1"):
    row = view["rows"][index]
    return {
        "snapshot": view["snapshot"],
        "view_state": view["state"],
        "idempotency_key": key,
        "changes": [{"pk": row["pk"], "version": row["version"], "values": values}],
    }


def preview_payload(**kwargs):
    return {
        "idempotency_key": "preview-1",
        "state": {},
        "assignments": {"price": "=[price]*1.07", "status": "order"},
        **kwargs,
    }
