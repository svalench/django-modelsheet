from decimal import Decimal

import pytest
from django.contrib import admin
from django.test import RequestFactory

from demo.shop.models import Product
from modelsheet.adapters import SaveAdapter
from modelsheet.background import process
from modelsheet.models import Operation

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
        from django.contrib.auth import get_user_model
        from django.db import transaction

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


@pytest.mark.parametrize("policy_hook", [False, True])
def test_preview_rejects_hidden_aggregate_sources(api, products, monkeypatch, policy_hook):
    from modelsheet.permissions import PermissionPolicy

    hidden = products[-1]
    Product.objects.filter(pk=hidden.pk).update(price=Decimal("123.45"))
    if policy_hook:
        monkeypatch.setattr(
            PermissionPolicy,
            "can_view_object",
            lambda self, request, admin, obj: obj.pk != hidden.pk,
        )
    else:
        monkeypatch.setattr(
            admin.site._registry[Product],
            "has_view_permission",
            lambda request, obj=None: obj is None or obj.pk != hidden.pk,
        )
    assert len(loaded(api)["rows"]) == 2
    response = post(api, "bulk/preview", preview_payload(assignments={"price": "=QSUM([price])"}))
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"
    assert "123.45" not in response.content.decode()
    assert not Operation.objects.exists()


def test_background_preview_rechecks_sources_before_aggregation(
    api, products, background, monkeypatch
):
    from modelsheet.errors import SheetError

    response = post(api, "bulk/preview", preview_payload(assignments={"price": "=QSUM([price])"}))
    assert response.status_code == 200
    monkeypatch.setattr(
        admin.site._registry[Product],
        "has_view_permission",
        lambda request, obj=None: obj is None or obj.pk != products[-1].pk,
    )
    with pytest.raises(SheetError) as exc:
        process(*background.jobs.pop())
    assert exc.value.code == "forbidden"
    operation = Operation.objects.get(pk=response.json()["id"])
    assert operation.status == "failed"
    assert not operation.items.exists()


@pytest.mark.parametrize("snapshot_state", ["expired", "deleted"])
def test_preview_retry_uses_existing_plan_without_snapshot(api, products, snapshot_state):
    from datetime import timedelta

    from django.utils import timezone

    from modelsheet.models import ViewSnapshot

    view = loaded(api)
    payload = preview_payload(selection=[products[0].pk], snapshot=view["snapshot"])
    first = post(api, "bulk/preview", payload)
    assert first.status_code == 200
    if snapshot_state == "expired":
        ViewSnapshot.objects.update(created_at=timezone.now() - timedelta(hours=1))
    else:
        ViewSnapshot.objects.all().delete()
    retry = post(api, "bulk/preview", payload)
    assert retry.status_code == 200
    assert retry.json() == first.json()
    assert Operation.objects.count() == 1
    changed = post(api, "bulk/preview", {**payload, "assignments": {"price": "42"}})
    assert changed.status_code == 409
    assert changed.json()["error"]["code"] == "idempotency_conflict"


def test_preview_retry_ignores_new_members_but_checks_access(api, products, settings, monkeypatch):
    payload = preview_payload()
    first = post(api, "bulk/preview", payload).json()
    Product.objects.create(name="Later member", price=10, stock=1)
    settings.MODELSHEET = {**settings.MODELSHEET, "max_bulk_rows": 3}
    retry = post(api, "bulk/preview", payload)
    assert retry.status_code == 200
    assert retry.json() == first
    monkeypatch.setattr(
        admin.site._registry[Product], "has_change_permission", lambda request: False
    )
    assert post(api, "bulk/preview", payload).status_code == 403


def test_bulk_aggregates_and_parsing_are_shared_within_each_plan(api, products, monkeypatch):
    from collections import Counter

    from modelsheet import bulk
    from modelsheet.formula import engine

    parses, aggregates = Counter(), Counter()
    original_ast, original_aggregate = bulk.ast, engine.aggregate

    def counted_ast(expression):
        parses[expression] += 1
        return original_ast(expression)

    def counted_aggregate(name, values):
        aggregates[name] += 1
        return original_aggregate(name, values)

    monkeypatch.setattr(bulk, "ast", counted_ast)
    monkeypatch.setattr(engine, "aggregate", counted_aggregate)
    formula = "=QSUM([price])+QAVG([price])+QCOUNT([price])"
    payload = preview_payload(assignments={"price": formula, "stock": "=QCOUNT([price])"})
    first = post(api, "bulk/preview", payload)
    assert first.status_code == 200
    assert first.json()["errors"] == 0
    assert all(item["after"] == {"price": "43.00", "stock": 3} for item in first.json()["items"])
    assert aggregates == {"SUM": 1, "AVG": 1, "COUNT": 1}
    # Once for request validation and once for the plan, regardless of row count.
    assert parses == {formula: 2, "=QCOUNT([price])": 2}
    Product.objects.filter(pk=products[0].pk).update(price=20)
    second = post(api, "bulk/preview", {**payload, "idempotency_key": "new-plan"})
    assert second.status_code == 200
    assert all(item["after"]["price"] == "56.33" for item in second.json()["items"])
    assert aggregates == {"SUM": 2, "AVG": 2, "COUNT": 2}


def test_expired_preview_cannot_be_renewed_by_cancel_resume(api, products, settings):
    from datetime import timedelta

    from django.utils import timezone

    settings.MODELSHEET = {
        **settings.MODELSHEET,
        "background_adapter": "tests.test_bulk.TestAdapter",
    }
    result = post(api, "bulk/preview", preview_payload()).json()
    operation = Operation.objects.get(pk=result["id"])
    assert operation.preview_expires_at > timezone.now()
    deadline = timezone.now() - timedelta(hours=1)
    Operation.objects.filter(pk=operation.pk).update(preview_expires_at=deadline)
    assert (
        post(api, "bulk/run", {"operation": result["id"]}).json()["error"]["code"]
        == "expired_preview"
    )
    assert post(api, f"operations/{result['id']}/cancel", {}).status_code == 200
    response = post(api, f"operations/{result['id']}/resume", {})
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "expired_preview"
    operation.refresh_from_db()
    assert operation.preview_expires_at == deadline
    assert operation.status == "cancelled"
    assert not operation.items.filter(status="done").exists()
    assert Product.objects.get(pk=products[0].pk).price == Decimal("10")


@pytest.mark.parametrize("empty", [False, True])
def test_resume_preserves_deadline_and_empty_preview_membership(api, products, settings, empty):
    settings.MODELSHEET = {
        **settings.MODELSHEET,
        "background_adapter": "tests.test_bulk.TestAdapter",
    }
    TestAdapter.jobs = []
    state = {"filter": {"field": "stock", "op": "lt", "value": 0}} if empty else {}
    result = post(api, "bulk/preview", preview_payload(state=state)).json()
    operation = Operation.objects.get(pk=result["id"])
    deadline = operation.preview_expires_at
    # Changing TTL after planning must not extend an existing deadline.
    settings.MODELSHEET = {**settings.MODELSHEET, "preview_ttl_seconds": 999999}
    if empty:
        Product.objects.filter(pk=products[0].pk).update(stock=-1)
    for _ in range(2):
        assert post(api, f"operations/{result['id']}/cancel", {}).status_code == 200
        resumed = post(api, f"operations/{result['id']}/resume", {})
        assert resumed.status_code == 200
        assert resumed.json()["status"] == "preview"
        assert resumed.json()["total"] == result["total"]
        operation.refresh_from_db()
        assert operation.preview_expires_at == deadline
    assert TestAdapter.jobs == []
    assert post(api, "bulk/run", {"operation": result["id"]}).json()["changed"] == result["total"]


def test_background_deadline_starts_after_preparation_and_does_not_stop_confirmed_resume(
    api, products, background
):
    from datetime import timedelta

    from django.utils import timezone

    result = post(api, "bulk/preview", preview_payload()).json()
    operation = Operation.objects.get(pk=result["id"])
    assert operation.preview_expires_at is None
    Operation.objects.filter(pk=operation.pk).update(created_at=timezone.now() - timedelta(days=1))
    process(*background.jobs.pop())
    operation.refresh_from_db()
    assert operation.preview_expires_at > timezone.now()
    assert post(api, "bulk/run", {"operation": result["id"]}).json()["status"] == "queued"
    background.jobs.clear()
    deadline = timezone.now() - timedelta(hours=1)
    Operation.objects.filter(pk=operation.pk).update(preview_expires_at=deadline)
    assert post(api, f"operations/{result['id']}/cancel", {}).status_code == 200
    assert post(api, f"operations/{result['id']}/resume", {}).json()["status"] == "queued"
    process(*background.jobs.pop())
    operation.refresh_from_db()
    assert operation.status == "done" and operation.changed == 3
    assert operation.preview_expires_at == deadline


def test_cancel_before_background_preparation_can_resume(api, products, background):
    result = post(api, "bulk/preview", preview_payload()).json()
    background.jobs.clear()
    assert post(api, f"operations/{result['id']}/cancel", {}).status_code == 200
    assert post(api, f"operations/{result['id']}/resume", {}).json()["status"] == "preparing"
    process(*background.jobs.pop())
    operation = Operation.objects.get(pk=result["id"])
    assert operation.status == "preview"
    assert operation.preview_expires_at is not None
