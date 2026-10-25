import json
from pathlib import Path
import shutil

import pytest
import yaml

from scripts.check_release import validate_release

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def release_tree(tmp_path):
    for name in (
        "pyproject.toml",
        "modelsheet/__init__.py",
        "frontend/package.json",
        "frontend/package-lock.json",
    ):
        target = tmp_path / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, target)
    return tmp_path


def test_stable_versions_and_tag_are_consistent():
    assert validate_release(ROOT, tag="v0.3.0", stable=True) == "0.3.0"


@pytest.mark.parametrize(
    "name", ["modelsheet/__init__.py", "frontend/package.json", "frontend/package-lock.json"]
)
def test_release_check_rejects_version_drift(release_tree, name):
    path = release_tree / name
    path.write_text(path.read_text().replace("0.3.0", "0.3.1", 1))
    with pytest.raises(ValueError, match="versions must match"):
        validate_release(release_tree, stable=True)


def test_release_check_rejects_nested_lockfile_drift(release_tree):
    path = release_tree / "frontend/package-lock.json"
    data = json.loads(path.read_text())
    data["packages"][""]["version"] = "0.3.1"
    path.write_text(json.dumps(data))
    with pytest.raises(ValueError, match="versions must match"):
        validate_release(release_tree)


def test_release_check_rejects_wrong_tag_and_alpha_classifier(release_tree):
    with pytest.raises(ValueError, match="Release tag"):
        validate_release(release_tree, tag="v0.3.0a2")
    path = release_tree / "pyproject.toml"
    path.write_text(path.read_text().replace("5 - Production/Stable", "3 - Alpha"))
    with pytest.raises(ValueError, match="stable version and classifier"):
        validate_release(release_tree, stable=True)


def workflow(name):
    return yaml.load((ROOT / ".github/workflows" / name).read_text(), Loader=yaml.BaseLoader)


def test_publication_waits_for_matrix_browser_package_and_documentation():
    release, ci, docs = workflow("workflow.yml"), workflow("ci.yml"), workflow("docs-checks.yml")
    assert release["jobs"]["publish"]["needs"] == ["metadata", "validate"]
    assert release["jobs"]["validate"]["uses"] == "./.github/workflows/ci.yml"
    assert "workflow_call" in ci["on"] and "workflow_call" in docs["on"]
    assert ci["jobs"]["documentation"]["uses"] == "./.github/workflows/docs-checks.yml"
    matrix = ci["jobs"]["python"]["strategy"]["matrix"]["include"]
    assert {item["db"] for item in matrix} == {"sqlite", "postgres", "mysql"}
    assert len(matrix) == 16
    assert not any(job.get("continue-on-error") == "true" for job in ci["jobs"].values())
    package = ci["jobs"]["browser-and-package"]["steps"]
    assert any("package_smoke.py --upgrade-from 0.3.0a2" in step.get("run", "") for step in package)
    assert any("test:e2e" in step.get("run", "") for step in package)
    artifacts = [
        step for step in package if step.get("with", {}).get("name") == "pypi-distributions"
    ]
    assert len(artifacts) == 1 and "if" not in artifacts[0]
    assert any(
        "mkdocs build --strict" in step.get("run", "") for step in docs["jobs"]["build"]["steps"]
    )
    # Reusable validation never deploys documentation or uploads to PyPI itself.
    for data in (ci, docs):
        assert "deploy" not in data["jobs"] and "publish" not in data["jobs"]
