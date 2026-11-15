"""Celery-адаптер. Установите extra ``celery`` и добавьте модуль в imports воркера."""

from modelsheet.adapters import BackgroundAdapter
from modelsheet.background import process, worker_request

try:
    from celery import shared_task
except ImportError:  # pragma: no cover - зависимость необязательна

    def shared_task(*args, **kwargs):
        def decorator(func):
            return func

        if args and callable(args[0]) and not kwargs:
            return args[0]
        return decorator


@shared_task(name="modelsheet.process_operation")
def process_operation(operation_id, phase):
    process(operation_id, phase)


class CeleryBackgroundAdapter(BackgroundAdapter):
    def capture_context(self, request):
        return {}

    def restore_context(self, user, context):
        return worker_request(user)

    def enqueue(self, operation_id, phase):
        delay = getattr(process_operation, "delay", None)
        if delay is None:
            raise RuntimeError("Install django-modelsheet[celery] and configure a Celery app.")
        delay(str(operation_id), phase)
