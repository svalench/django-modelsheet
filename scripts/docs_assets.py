"""Invalidate browser caches whenever a deployed playground bundle changes."""

from hashlib import sha256
from pathlib import Path


def on_config(config):
    assets = Path(config.config_file_path).parent / "docs" / "assets" / "playground"
    digest = sha256()
    for name in ("demo.js", "demo.css"):
        digest.update((assets / name).read_bytes())
    config.extra["demo_assets_version"] = digest.hexdigest()[:16]
    return config
