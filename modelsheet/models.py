import uuid

from django.conf import settings
from django.db import models


class ViewSnapshot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    model_label = models.CharField(max_length=200)
    site_name = models.CharField(max_length=100)
    state = models.JSONField(default=dict)
    rows = models.JSONField(default=list)
    columns = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)


class Operation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    model_label = models.CharField(max_length=200)
    site_name = models.CharField(max_length=100)
    kind = models.CharField(max_length=20, default="save")
    status = models.CharField(max_length=24, default="preview", db_index=True)
    idempotency_key = models.CharField(max_length=128)
    request_hash = models.CharField(max_length=64)
    parameters = models.JSONField(default=dict)
    context = models.JSONField(default=dict)
    total = models.PositiveIntegerField(default=0)
    changed = models.PositiveIntegerField(default=0)
    errors = models.PositiveIntegerField(default=0)
    cancel_requested = models.BooleanField(default=False)
    lease_until = models.DateTimeField(null=True)
    lease_token = models.UUIDField(null=True)
    preview_expires_at = models.DateTimeField(null=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "site_name", "model_label", "idempotency_key"],
                name="modelsheet_idempotency",
            )
        ]
        permissions = [("open", "Can open model sheets")]


class OperationItem(models.Model):
    operation = models.ForeignKey(Operation, on_delete=models.CASCADE, related_name="items")
    pk_value = models.CharField(max_length=255)
    version = models.CharField(max_length=64)
    before = models.JSONField(default=dict)
    after = models.JSONField(default=dict)
    status = models.CharField(max_length=24, default="pending")
    error = models.JSONField(default=dict)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["operation", "pk_value"],
                name="modelsheet_operation_row",
            )
        ]
