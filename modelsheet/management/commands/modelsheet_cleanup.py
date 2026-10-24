from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from modelsheet.conf import config
from modelsheet.models import Operation, ViewSnapshot


class Command(BaseCommand):
    help = "Delete expired view snapshots and terminal operations beyond retention."

    def handle(self, *args, **options):
        now = timezone.now()
        snapshots, _ = ViewSnapshot.objects.filter(
            created_at__lt=now - timedelta(seconds=config()["snapshot_ttl_seconds"])
        ).delete()
        operations, _ = Operation.objects.filter(
            status__in=["done", "partial", "cancelled", "failed", "preview"],
            updated_at__lt=now - timedelta(days=config()["history_retention_days"]),
        ).delete()
        self.stdout.write(
            f"Deleted {snapshots} snapshot objects and {operations} operation objects"
        )
