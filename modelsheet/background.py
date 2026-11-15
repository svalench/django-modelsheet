import threading

from django.contrib.admin import sites
from django.contrib.auth import get_user_model
from django.db import connections
from django.test import RequestFactory

from .adapters import BackgroundAdapter
from .bulk import process_operation
from .conf import component
from .errors import SheetError
from .models import Operation


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


def worker_request(user):
    """Минимальный request для воркера. Проектный адаптер обязан добавить tenant."""
    request = RequestFactory().post("/modelsheet-worker/")
    request.user = user
    return request


class ThreadBackgroundAdapter(BackgroundAdapter):
    """Фон в потоке процесса. Не переживает рестарт; resume после истечения lease."""

    def capture_context(self, request):
        return {}

    def restore_context(self, user, context):
        return worker_request(user)

    def enqueue(self, operation_id, phase):
        def run():
            try:
                process(operation_id, phase)
            finally:
                connections.close_all()

        threading.Thread(target=run, name=f"modelsheet-{phase}", daemon=True).start()


class DjangoTasksBackgroundAdapter(BackgroundAdapter):
    """Очередь django.tasks (Django 6+). ImmediateBackend выполняет задачу сразу."""

    def capture_context(self, request):
        return {}

    def restore_context(self, user, context):
        return worker_request(user)

    def enqueue(self, operation_id, phase):
        try:
            from django.tasks import task
        except ImportError as exc:
            raise RuntimeError("django.tasks is available on Django 6 and newer.") from exc
        # Задача обязана быть функцией модуля: django.tasks отклоняет вложенные.
        if getattr(process_modelsheet_operation, "enqueue", None) is None or not isinstance(
            process_modelsheet_operation, task_type()
        ):
            globals()["process_modelsheet_operation"] = task(process_modelsheet_operation)
        process_modelsheet_operation.enqueue(operation_id, phase)


def process_modelsheet_operation(operation_id, phase):
    process(operation_id, phase)


def task_type():
    try:
        from django.tasks import Task
    except ImportError:
        return ()
    return Task
