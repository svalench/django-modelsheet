"""Check the version shared by Python, npm, the lockfile and a release tag."""

import argparse
import ast
import json
from pathlib import Path
import re
import tomllib


def validate_release(root, *, tag=None, stable=False):
    project = tomllib.loads((root / "pyproject.toml").read_text())["project"]
    version = project["version"]
    module = ast.parse((root / "modelsheet" / "__init__.py").read_text())
    versions = [
        ast.literal_eval(node.value)
        for node in module.body
        if isinstance(node, ast.Assign)
        and any(
            isinstance(target, ast.Name) and target.id == "__version__" for target in node.targets
        )
    ]
    package = json.loads((root / "frontend" / "package.json").read_text())
    lock = json.loads((root / "frontend" / "package-lock.json").read_text())
    if versions != [version] or any(
        value != version
        for value in (
            package["version"],
            lock["version"],
            lock["packages"][""]["version"],
        )
    ):
        raise ValueError("Python, frontend and lockfile versions must match")
    if tag and tag != f"v{version}":
        raise ValueError(f"Release tag must be v{version}, got {tag}")
    if stable and (
        not re.fullmatch(r"\d+\.\d+\.\d+", version)
        or "Development Status :: 5 - Production/Stable" not in project["classifiers"]
    ):
        raise ValueError("Publication requires a stable version and classifier")
    return version


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tag", default="")
    parser.add_argument("--stable", action="store_true")
    args = parser.parse_args()
    try:
        version = validate_release(
            Path(__file__).resolve().parents[1], tag=args.tag, stable=args.stable
        )
    except (ValueError, KeyError) as exc:
        parser.exit(1, f"{exc}\n")
    print(f"Consistent release version: {version}")
