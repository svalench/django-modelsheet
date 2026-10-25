"""Development/test project. Never deploy with this secret or DEBUG enabled."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = "modelsheet-local-demo-only-do-not-deploy"
DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "modelsheet",
    "demo.shop",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]
ROOT_URLCONF = "demo.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "demo.sqlite3",
        "OPTIONS": {"transaction_mode": "IMMEDIATE", "timeout": 20},
    }
}
if os.environ.get("MODELSHEET_DB") == "postgres":
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "modelsheet",
        "USER": "modelsheet",
        "PASSWORD": "modelsheet",
        "HOST": "127.0.0.1",
        "PORT": "5432",
    }
elif os.environ.get("MODELSHEET_DB") == "mysql":
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "modelsheet",
        "USER": "root",
        "PASSWORD": "modelsheet",
        "HOST": "127.0.0.1",
        "PORT": "3306",
        "OPTIONS": {"charset": "utf8mb4", "init_command": "SET default_storage_engine=INNODB"},
    }
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
LANGUAGE_CODE = "en"
LANGUAGES = [("en", "English"), ("ru", "Русский")]
TIME_ZONE = "UTC"
USE_TZ = True
MODELSHEET = {"page_size": 200}
