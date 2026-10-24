from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from threading import Barrier

import pytest
from django.contrib.auth import get_user_model
from django.db import close_old_connections
from django.test import RequestFactory

from demo.shop.models import Product
from modelsheet.errors import SheetError
from modelsheet.models import Operation
from modelsheet.views import endpoint
from .conftest import loaded, save_payload

pytestmark = pytest.mark.django_db(transaction=True)


def test_concurrent_saves_cannot_both_overwrite_same_version(api, products, user):
    from django.contrib import admin

    view = loaded(api)
    payloads = [
        save_payload(view, {"price": value}, key=f"racer-{i}")
        for i, value in enumerate(("12", "13"))
    ]
    barrier = Barrier(2)

    def worker(payload):
        close_old_connections()
        try:
            request = RequestFactory().post("/", payload, content_type="application/json")
            request.user = get_user_model().objects.get(pk=user.pk)
            barrier.wait(timeout=10)
            return endpoint(request, admin.site._registry[Product], "save").status_code
        finally:
            close_old_connections()

    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(worker, payloads))
    assert responses.count(200) == 1
    assert set(responses) <= {200, 409, 503}
    assert Product.objects.get(pk=products[0].pk).price in (Decimal("12"), Decimal("13"))
    assert Operation.objects.filter(kind="save").count() == 1


def test_sqlite_refuses_unsafe_transaction_mode(settings):
    from django.db import connections
    from modelsheet.services import write_transaction

    connection = connections["default"]
    if connection.vendor != "sqlite":
        pytest.skip("SQLite-specific configuration")
    original = connection.settings_dict["OPTIONS"].get("transaction_mode")
    connection.settings_dict["OPTIONS"]["transaction_mode"] = "DEFERRED"
    try:
        with pytest.raises(SheetError) as exc:
            with write_transaction():
                pass
        assert exc.value.code == "sqlite_configuration"
    finally:
        connection.settings_dict["OPTIONS"]["transaction_mode"] = original
