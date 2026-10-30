"""Measure complete Q-aggregate previews in a disposable SQLite database.

python scripts/benchmark_bulk.py --rows 100 500 1000 --repeats 3
The uncached comparison uses the same safe plan builder, with only its aggregate
cache disabled. It is not a benchmark of an older release.
"""

# ruff: noqa: E402
import argparse
import json
import os
import platform
import statistics
import sys
import tempfile
import time
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--rows", nargs="+", type=int, default=[100, 500, 1000])
parser.add_argument("--repeats", type=int, default=3)
args = parser.parse_args()
if min(args.rows) < 1 or args.repeats < 1:
    parser.error("positive rows/repeats required")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "demo.settings")
os.environ.pop("MODELSHEET_DB", None)

import django

django.setup()
from django.conf import settings
from django.contrib.admin import AdminSite
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import connection, models
from django.test import RequestFactory, override_settings

from modelsheet import bulk
from modelsheet.admin import ModelSheetAdmin
from modelsheet.formula import engine
from modelsheet.models import Operation

with tempfile.TemporaryDirectory(prefix="modelsheet-bulk-bench-") as folder:
    connection.close()
    settings.DATABASES["default"] = {
        **settings.DATABASES["default"],
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": str(Path(folder) / "benchmark.sqlite3"),
        "OPTIONS": {"transaction_mode": "IMMEDIATE"},
    }
    connection.settings_dict.update(settings.DATABASES["default"])
    call_command("migrate", verbosity=0)

    class Record(models.Model):
        price = models.DecimalField(max_digits=12, decimal_places=2, default=10)
        stock = models.IntegerField(default=1)

        class Meta:
            app_label = "shop"
            db_table = "bulk_benchmark_record"

    class RecordAdmin(ModelSheetAdmin):
        sheet_fields = ("price", "stock")
        sheet_editable = sheet_fields

    with connection.schema_editor() as editor:
        editor.create_model(Record)
    model_admin = RecordAdmin(Record, AdminSite(name="bulk_benchmark"))
    request = RequestFactory().post("/")
    request.user = get_user_model().objects.create_superuser(username="benchmark", password=None)
    results = []
    original_aggregate = engine.aggregate
    for size in args.rows:
        Record.objects.all().delete()
        Record.objects.bulk_create([Record() for _ in range(size)], batch_size=1000)
        for cached in (False, True):
            samples, scans = [], []
            for repeat in range(args.repeats):
                visits = [0]

                def counted_aggregate(name, values, visits=visits):
                    visits[0] += len(values)
                    return original_aggregate(name, values)

                cache_factory = engine.QueryAggregates if cached else lambda query: query
                with (
                    override_settings(
                        MODELSHEET={
                            "bulk_background_threshold": size,
                            "max_bulk_rows": size,
                            # Preserve logical step accounting, including repeated QCOUNT.
                            "formula": {"max_steps": 3 * size + 100},
                        }
                    ),
                    patch.object(bulk, "QueryAggregates", cache_factory),
                    patch.object(engine, "aggregate", counted_aggregate),
                ):
                    started = time.perf_counter()
                    report = bulk.preview(
                        request,
                        model_admin,
                        {
                            "state": {},
                            "idempotency_key": f"{size}-{cached}-{repeat}",
                            "assignments": {
                                "price": "=QSUM([price])/QCOUNT([price])",
                                "stock": "=QCOUNT([price])",
                            },
                        },
                    )
                    samples.append((time.perf_counter() - started) * 1000)
                assert report["errors"] == 0 and report["total"] == size
                assert all(
                    item["after"] == {"price": "10.00", "stock": size} for item in report["items"]
                )
                scans.append(visits[0])
                Operation.objects.filter(pk=report["id"]).delete()
            results.append(
                {
                    "rows": size,
                    "aggregate_cache": cached,
                    "median_preview_ms": round(statistics.median(samples), 2),
                    "aggregate_value_visits": max(scans),
                }
            )
    connection.close()
    print(
        json.dumps(
            {
                "python": platform.python_version(),
                "django": django.get_version(),
                "platform": platform.platform(),
                "database": "temporary SQLite",
                "repeats": args.repeats,
                "results": results,
            },
            indent=2,
        )
    )
