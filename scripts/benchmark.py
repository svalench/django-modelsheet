"""Reproducible 50-column backend benchmark on an isolated temporary SQLite DB.

python scripts/benchmark.py --rows 100000
python scripts/benchmark.py --rows 1000000
The reported exact-index lookup and substring search are intentionally separate.
"""

# ruff: noqa: E402
import argparse
import json
import math
import os
import platform
import statistics
import sys
import tempfile
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
parser = argparse.ArgumentParser()
parser.add_argument("--rows", type=int, default=100000)
parser.add_argument("--repeats", type=int, default=10)
args = parser.parse_args()
if args.rows < 1 or args.repeats < 1:
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
from django.test.utils import CaptureQueriesContext

from modelsheet.admin import ModelSheetAdmin
from modelsheet.services import rows

with tempfile.TemporaryDirectory(prefix="modelsheet-bench-") as folder:
    connection.close()
    settings.DATABASES["default"]["NAME"] = str(Path(folder) / "benchmark.sqlite3")
    settings.DATABASES["default"]["ENGINE"] = "django.db.backends.sqlite3"
    settings.DATABASES["default"]["OPTIONS"] = {"transaction_mode": "IMMEDIATE"}
    connection.settings_dict.update(settings.DATABASES["default"])
    call_command("migrate", verbosity=0)
    Record = type(
        "BenchmarkRecord",
        (models.Model,),
        {
            "__module__": __name__,
            "Meta": type("Meta", (), {"app_label": "shop", "db_table": "benchmark_record"}),
            "key": models.CharField(max_length=30, unique=True),
            **{f"value_{i}": models.IntegerField(default=0) for i in range(49)},
        },
    )
    with connection.schema_editor() as editor:
        editor.create_model(Record)
    started = time.perf_counter()
    for offset in range(0, args.rows, 1000):
        Record.objects.bulk_create(
            [Record(key=f"item-{i:09}") for i in range(offset, min(offset + 1000, args.rows))]
        )
    seed_seconds = time.perf_counter() - started

    class BenchmarkAdmin(ModelSheetAdmin):
        sheet_fields = ("key", *(f"value_{i}" for i in range(49)))
        sheet_editable = tuple(f"value_{i}" for i in range(49))
        search_fields = ("key",)

    model_admin = BenchmarkAdmin(Record, AdminSite(name="benchmark"))
    user = get_user_model().objects.create_superuser(username="benchmark", password=None)
    request = RequestFactory().get("/")
    request.user = user
    results = {}
    with override_settings(MODELSHEET={"models": ["shop.BenchmarkRecord"]}):
        for label, params in {
            "first_page_200x50": {},
            "page_5_200x50": {"offset": 800},
            "indexed_exact_filter": {
                "filter": {"field": "key", "op": "eq", "value": f"item-{args.rows - 1:09}"}
            },
            "substring_search": {"q": f"{args.rows - 1:09}"},
        }.items():
            samples, sql_counts = [], []
            for _ in range(args.repeats):
                with CaptureQueriesContext(connection) as queries:
                    start = time.perf_counter()
                    result = rows(request, model_admin, params)
                    samples.append((time.perf_counter() - start) * 1000)
                sql_counts.append(len(queries))
            results[label] = {
                "median_ms": round(statistics.median(samples), 2),
                "p95_ms": round(sorted(samples)[max(0, math.ceil(len(samples) * 0.95) - 1)], 2),
                "sql_queries": max(sql_counts),
                "returned_rows": len(result["rows"]),
            }
    print(
        json.dumps(
            {
                "platform": platform.platform(),
                "python": platform.python_version(),
                "django": django.get_version(),
                "database": "SQLite (temporary file)",
                "rows": args.rows,
                "columns": 50,
                "repeats": args.repeats,
                "seed_seconds": round(seed_seconds, 2),
                "results": results,
            },
            indent=2,
        )
    )
