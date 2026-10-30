"""Install the wheel into an isolated venv and check migrations/static collection."""

import argparse
import os
import subprocess
import sys
import tempfile
import tomllib
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--wheel", type=Path)
parser.add_argument("--upgrade-from", help="Published version or local wheel to upgrade from")
args = parser.parse_args()
version = tomllib.loads((Path(__file__).resolve().parents[1] / "pyproject.toml").read_text())[
    "project"
]["version"]
wheel = (args.wheel or Path("dist") / f"django_modelsheet-{version}-py3-none-any.whl").resolve()
if not wheel.is_file():
    parser.error(f"Build the current release wheel first: {wheel}")
with tempfile.TemporaryDirectory(prefix="modelsheet-smoke-") as folder:
    root = Path(folder)
    subprocess.run(
        [sys.executable, "-m", "venv", "--system-site-packages", str(root / "venv")], check=True
    )
    python = root / "venv" / "bin" / "python"
    (root / "settings.py").write_text(
        "SECRET_KEY='package-smoke'\n"
        "INSTALLED_APPS=['django.contrib.admin','django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles','modelsheet']\n"
        "MIDDLEWARE=['django.contrib.sessions.middleware.SessionMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.contrib.messages.middleware.MessageMiddleware']\n"
        "TEMPLATES=[{'BACKEND':'django.template.backends.django.DjangoTemplates','APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]\n"
        "DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':'smoke.sqlite3','OPTIONS':{'transaction_mode':'IMMEDIATE'}}}\n"
        "STATIC_URL='/static/'\nSTATIC_ROOT='staticfiles'\nMODELSHEET={'models':[]}\n"
    )
    env = {**os.environ, "DJANGO_SETTINGS_MODULE": "settings", "PYTHONPATH": str(root)}

    def install(requirement):
        subprocess.run(
            [str(python), "-m", "pip", "install", "--no-deps", "--force-reinstall", requirement],
            cwd=root,
            env=env,
            check=True,
        )

    if args.upgrade_from:
        previous = Path(args.upgrade_from)
        install(
            str(previous.resolve())
            if previous.is_file()
            else f"django-modelsheet=={args.upgrade_from}"
        )
        subprocess.run(
            [str(python), "-m", "django", "migrate", "--noinput"], cwd=root, env=env, check=True
        )
        subprocess.run(
            [
                str(python),
                "-c",
                """
import django
django.setup()
from django.contrib.auth import get_user_model
from modelsheet.models import Operation, OperationItem, ViewSnapshot
user = get_user_model().objects.create_user(username='upgrade-test')
for status in ('done', 'preview', 'cancelled'):
    op = Operation.objects.create(user=user, model_label='shop.Product', site_name='admin',
        kind='bulk', status=status, idempotency_key=status, request_hash='original-hash')
    if status != 'cancelled':
        OperationItem.objects.create(operation=op, pk_value='__proto__', version='original-version',
            before={'price':'10'}, after={'price':'20'}, status='done' if status=='done' else 'pending')
ViewSnapshot.objects.create(user=user, model_label='shop.Product', site_name='admin', rows=[{'pk':'__proto__'}])
""",
            ],
            cwd=root,
            env=env,
            check=True,
        )
    install(str(wheel))
    subprocess.run(
        [
            str(python),
            "-c",
            "import modelsheet, sys; from pathlib import Path; "
            "assert Path(modelsheet.__file__).resolve().is_relative_to(Path(sys.prefix).resolve()), modelsheet.__file__",
        ],
        cwd=root,
        env=env,
        check=True,
    )
    for command in [("migrate", "--noinput"), ("collectstatic", "--noinput")]:
        subprocess.run([str(python), "-m", "django", *command], cwd=root, env=env, check=True)
    if args.upgrade_from:
        subprocess.run(
            [
                str(python),
                "-c",
                """
import django
django.setup()
from django.utils import timezone
from modelsheet.models import Operation, OperationItem, ViewSnapshot
assert Operation.objects.count() == 3
assert OperationItem.objects.count() == 2
assert ViewSnapshot.objects.get().rows == [{'pk':'__proto__'}]
for op in Operation.objects.all():
    assert op.status == op.idempotency_key
    assert op.request_hash == 'original-hash'
    assert op.preview_expires_at <= timezone.now()
for item in OperationItem.objects.all():
    assert item.pk_value == '__proto__' and item.version == 'original-version'
    assert item.before == {'price':'10'} and item.after == {'price':'20'}
""",
            ],
            cwd=root,
            env=env,
            check=True,
        )
    for asset in ("sheet.js", "sheet.css", "THIRD_PARTY_LICENSES.txt"):
        assert (root / "staticfiles" / "modelsheet" / asset).is_file(), asset
    subprocess.run(
        [
            str(python),
            "-c",
            "from importlib.resources import files; assert (files('modelsheet')/'templates/modelsheet/sheet.html').is_file()",
        ],
        cwd=root,
        env=env,
        check=True,
    )
print("Wheel install, migrations, templates and collectstatic passed without Node.js")

if args.upgrade_from:
    print(
        f"Upgrade from {args.upgrade_from} to {version} preserved history and expired legacy plans"
    )
