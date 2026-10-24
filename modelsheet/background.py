from django.contrib.admin import sites
from django.contrib.auth import get_user_model

from .bulk import process_operation
from .conf import component
from .models import Operation
from .errors import SheetError


def process(operation_id, phase):
    """Call from a durable queue. Retry failures after the lease expires."""
    operation = Operation.objects.get(pk=operation_id)
    request = None
    try:
        user = get_user_model().objects.get(pk=operation.user_id, is_active=True, is_staff=True)
        adapter = component("background_adapter")
        if adapter is None:
            raise RuntimeError("Background adapter is no longer configured")
        request = adapter.restore_context(user, operation.context)
        if request.user.pk != user.pk:
            raise RuntimeError("Background adapter restored the wrong user")
        for site in list(sites.all_sites):
            if site.name == operation.site_name:
                for model, admin in site._registry.items():
                    if model._meta.label == operation.model_label:
                        return process_operation(request, admin, operation_id, phase)
        raise RuntimeError("Model admin is no longer registered")
    except Exception as exc:
        from django.utils import timezone

        if isinstance(exc, SheetError) and exc.code == "worker_active":
            raise
        # Do not overwrite cancellation/completion or another live worker's state.
        failed = Operation.objects.filter(
            pk=operation_id, status__in=["queued", "preparing", "running"]
        )
        token = getattr(request, "_modelsheet_lease_token", None)
        failed = (
            failed.filter(lease_token=token) if token else failed.filter(lease_until__isnull=True)
        )
        failed.update(
            status="failed", lease_until=None, lease_token=None, updated_at=timezone.now()
        )
        raise
