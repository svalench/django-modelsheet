"""Install the wheel into an isolated venv and check migrations/static collection."""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

wheel = next(Path("dist").glob("*.whl")).resolve()
with tempfile.TemporaryDirectory(prefix="modelsheet-smoke-") as folder:
    root = Path(folder)
    subprocess.run(
        [sys.executable, "-m", "venv", "--system-site-packages", str(root / "venv")], check=True
    )
    python = root / "venv" / "bin" / "python"
    subprocess.run([str(python), "-m", "pip", "install", "--no-deps", str(wheel)], check=True)
    (root / "settings.py").write_text(
        "SECRET_KEY='package-smoke'\n"
        "INSTALLED_APPS=['django.contrib.admin','django.contrib.auth','django.contrib.contenttypes','django.contrib.sessions','django.contrib.messages','django.contrib.staticfiles','modelsheet']\n"
        "MIDDLEWARE=['django.contrib.sessions.middleware.SessionMiddleware','django.contrib.auth.middleware.AuthenticationMiddleware','django.contrib.messages.middleware.MessageMiddleware']\n"
        "TEMPLATES=[{'BACKEND':'django.template.backends.django.DjangoTemplates','APP_DIRS':True,'OPTIONS':{'context_processors':['django.template.context_processors.request','django.contrib.auth.context_processors.auth','django.contrib.messages.context_processors.messages']}}]\n"
        "DATABASES={'default':{'ENGINE':'django.db.backends.sqlite3','NAME':'smoke.sqlite3','OPTIONS':{'transaction_mode':'IMMEDIATE'}}}\n"
        "STATIC_URL='/static/'\nSTATIC_ROOT='staticfiles'\nMODELSHEET={'models':[]}\n"
    )
    env = {**os.environ, "DJANGO_SETTINGS_MODULE": "settings", "PYTHONPATH": str(root)}
    for args in [("migrate", "--noinput"), ("collectstatic", "--noinput")]:
        subprocess.run([str(python), "-m", "django", *args], cwd=root, env=env, check=True)
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
