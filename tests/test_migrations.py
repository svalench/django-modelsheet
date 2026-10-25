from datetime import timedelta

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.utils import timezone

pytestmark = pytest.mark.django_db(transaction=True)


def test_upgrade_preserves_audit_data_and_expires_legacy_unconfirmed_plans(user):
    old_target = [("modelsheet", "0001_initial")]
    new_target = [("modelsheet", "0002_operation_preview_expires_at")]
    executor = MigrationExecutor(connection)
    executor.migrate(old_target)
    try:
        old_apps = executor.loader.project_state(old_target).apps
        Operation = old_apps.get_model("modelsheet", "Operation")
        Item = old_apps.get_model("modelsheet", "OperationItem")
        records = {}
        for status in (
            "preview",
            "cancelled",
            "failed",
            "dispatch_failed",
            "preparing",
            "queued",
            "running",
            "done",
        ):
            op = Operation.objects.create(
                user_id=user.pk,
                model_label="shop.Product",
                site_name="admin",
                kind="bulk",
                status=status,
                idempotency_key=status,
                request_hash="hash",
                parameters={"confirmed": status in ("queued", "running", "done")},
            )
            records[status] = op.pk
        Item.objects.create(
            operation_id=records["preview"],
            pk_value="constructor",
            version="v1",
            before={"price": "10"},
            after={"price": "20"},
        )
        # Even a legacy plan recently refreshed by resume must not regain lifetime.
        Operation.objects.filter(pk=records["preview"]).update(
            created_at=timezone.now() - timedelta(days=1), updated_at=timezone.now()
        )
        executor = MigrationExecutor(connection)
        executor.migrate(new_target)
        new_apps = executor.loader.project_state(new_target).apps
        UpdatedOperation = new_apps.get_model("modelsheet", "Operation")
        UpdatedItem = new_apps.get_model("modelsheet", "OperationItem")
        assert UpdatedOperation.objects.count() == len(records)
        assert UpdatedItem.objects.get(operation_id=records["preview"]).after == {"price": "20"}
        for status, pk in records.items():
            op = UpdatedOperation.objects.get(pk=pk)
            assert op.status == status
            if status in ("preparing", "queued", "running"):
                assert op.preview_expires_at is None
            else:
                assert op.preview_expires_at <= timezone.now()
    finally:
        MigrationExecutor(connection).migrate(new_target)
