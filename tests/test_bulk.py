from decimal import Decimal

import pytest
from django.contrib import admin
from django.test import RequestFactory

from demo.shop.models import Product
from modelsheet.background import process
from modelsheet.models import Operation
from modelsheet.adapters import SaveAdapter
from .conftest import BASE, loaded, post, preview_payload

pytestmark = pytest.mark.django_db(transaction=True)


def test_preview_run_fixed_membership_and_idempotency(api, products):
    payload = preview_payload(state={"filter": {"field": "stock", "op": "lt", "value": 2}})
    result = post(api, "bulk/preview", payload)
    assert result.status_code == 200, result.content
    operation = result.json()
    assert operation["total"] == 2
    extra = Product.objects.create(name="New match", price=10, stock=0)
    assert Product.objects.get(pk=products[0].pk).price == Decimal("10")
    for _ in range(2):
        response = post(api, "bulk/run", {"operation": operation["id"]})
        assert response.status_code == 200, response.content
        assert response.json()["changed"] == 2
    assert Product.objects.get(pk=products[0].pk).price == Decimal("10.70")
    assert Product.objects.get(pk=extra.pk).price == Decimal("10")


def test_bulk_conflict_rolls_back_every_row(api, products):
    op = post(api, "bulk/preview", preview_payload()).json()
    Product.objects.filter(pk=products[1].pk).update(price=20)
    response = post(api, "bulk/run", {"operation": op["id"]})
    assert response.status_code == 409
    assert Product.objects.get(pk=products[0].pk).price == Decimal("10")
    assert Operation.objects.get(pk=op["id"]).status == "preview"


def test_bulk_assignments_use_original_row(api, products):
    response = post(
        api,
        "bulk/preview",
        preview_payload(assignments={"stock": "=[stock]+1", "price": "=[stock]+20"}),
    )
    assert response.status_code == 200, response.content
    op = response.json()
    assert post(api, "bulk/run", {"operation": op["id"]}).status_code == 200
    product = Product.objects.get(pk=products[0].pk)
    assert product.price == Decimal("20") and product.stock == 1


def test_bulk_query_aggregate_and_forbidden_position(api, products):
    op = post(api, "bulk/preview", preview_payload(assignments={"price": "=QSUM([price])"})).json()
    assert post(api, "bulk/run", {"operation": op["id"]}).status_code == 200
    assert Product.objects.get(pk=products[0].pk).price == Decimal("30")
    response = post(
        api,
        "bulk/preview",
        preview_payload(idempotency_key="position", assignments={"price": "=B1+1"}),
    )
    assert response.status_code == 400 and response.json()["error"]["code"] == "positional_bulk"


def test_preview_validation_errors_block_confirmation(api, products):
    response = post(api, "bulk/preview", preview_payload(assignments={"stock": -1}))
    assert response.status_code == 200
    op = response.json()
    assert op["errors"] == 3
    assert post(api, "bulk/run", {"operation": op["id"]}).status_code == 409


def test_selected_scope_requires_snapshot_members(api, products):
    view = loaded(api, limit=1)
    payload = preview_payload(selection=[products[1].pk], snapshot=view["snapshot"])
    assert post(api, "bulk/preview", payload).status_code == 400
    payload["selection"] = [products[0].pk]
    assert post(api, "bulk/preview", payload).json()["total"] == 1


def test_no_adapter_rejects_large_preview_before_plan(api, products, settings):
    settings.MODELSHEET = {**settings.MODELSHEET, "bulk_background_threshold": 1}
    response = post(api, "bulk/preview", preview_payload())
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "background_required"
    assert not Operation.objects.exists()


class TestAdapter:
    __test__ = False
    jobs = []

    def capture_context(self, request):
        return {"marker": "restored"}

    def restore_context(self, user, context):
        assert context["marker"] == "restored"
        request = RequestFactory().post("/")
        request.user = user
        return request

    def enqueue(self, operation_id, phase):
        self.jobs.append((operation_id, phase))


@pytest.fixture
def background(settings):
    TestAdapter.jobs = []
    settings.MODELSHEET = {
        **settings.MODELSHEET,
        "bulk_background_threshold": 1,
        "chunk_size": 1,
        "background_adapter": "tests.test_bulk.TestAdapter",
    }
    return TestAdapter


def test_background_contract_duplicate_delivery_and_cancel_resume(api, products, background):
    op = post(api, "bulk/preview", preview_payload()).json()
    assert op["status"] == "preparing"
    process(*background.jobs.pop())
    assert Operation.objects.get(pk=op["id"]).status == "preview"
    response = post(api, "bulk/run", {"operation": op["id"]})
    assert response.status_code == 200 and response.json()["status"] == "queued"
    job = background.jobs.pop()
    response = post(api, f"operations/{op['id']}/cancel", {})
    assert response.json()["status"] == "cancelled"
    process(*job)
    assert Product.objects.get(pk=products[0].pk).price == Decimal("10")
    response = post(api, f"operations/{op['id']}/resume", {})
    assert response.status_code == 200, response.content
    process(*background.jobs.pop())
    process(*job)
    response = api.get(BASE + f"operations/{op['id']}/").json()
    assert response["status"] == "done" and response["changed"] == 3
    assert Product.objects.get(pk=products[0].pk).price == Decimal("10.70")


def test_background_conflict_is_partial(api, products, background):
    op = post(api, "bulk/preview", preview_payload()).json()
    process(*background.jobs.pop())
    Product.objects.filter(pk=products[1].pk).update(price=20)
    assert post(api, "bulk/run", {"operation": op["id"]}).status_code == 200
    process(*background.jobs.pop())
    operation = Operation.objects.get(pk=op["id"])
    assert operation.status == "partial" and operation.changed == 2 and operation.errors == 1


def test_permission_rechecked_in_worker(api, products, background, user):
    op = post(api, "bulk/preview", preview_payload()).json()
    user.is_active = False
    user.save()
    with pytest.raises(type(user).DoesNotExist):
        process(*background.jobs.pop())
    assert Operation.objects.get(pk=op["id"]).status == "failed"


def test_row_access_rechecked_at_execution(api, products, monkeypatch):
    op = post(api, "bulk/preview", preview_payload()).json()
    monkeypatch.setattr(
        admin.site._registry[Product],
        "get_queryset",
        lambda request: Product.objects.exclude(pk=products[0].pk),
    )
    assert post(api, "bulk/run", {"operation": op["id"]}).status_code == 409


class RevokeAfterFirstChunk(SaveAdapter):
    def save(self, instance, fields, request):
        from django.db import transaction
        from django.contrib.auth import get_user_model

        super().save(instance, fields, request)
        transaction.on_commit(
            lambda: get_user_model().objects.filter(pk=request.user.pk).update(is_active=False)
        )


def test_worker_refreshes_permission_between_chunks(api, products, background, settings, user):
    op = post(api, "bulk/preview", preview_payload()).json()
    process(*background.jobs.pop())
    assert post(api, "bulk/run", {"operation": op["id"]}).status_code == 200
    settings.MODELSHEET = {
        **settings.MODELSHEET,
        "save_adapter": "tests.test_bulk.RevokeAfterFirstChunk",
    }
    from modelsheet.errors import SheetError

    with pytest.raises(SheetError):
        process(*background.jobs.pop())
    operation = Operation.objects.get(pk=op["id"])
    assert operation.status == "failed" and operation.changed == 1
    assert operation.items.filter(status="pending").count() == 2


def test_saved_plan_cannot_use_now_hidden_source_field(api, products, monkeypatch):
    response = post(api, "bulk/preview", preview_payload(assignments={"price": "=[cost_price]+12"}))
    assert response.status_code == 200
    from modelsheet.permissions import PermissionPolicy

    original = PermissionPolicy.can_view_field
    monkeypatch.setattr(
        PermissionPolicy,
        "can_view_field",
        lambda self, request, admin, field: field != "cost_price"
        and original(self, request, admin, field),
    )
    assert post(api, "bulk/run", {"operation": response.json()["id"]}).status_code == 403
