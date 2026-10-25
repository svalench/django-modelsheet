# 发布流程

此流程适用于从 **0.3.0** 开始的稳定版本。仅在获得发布批准后创建标签、发布 GitHub Release 或启用发布选项。

## 本地验证

1. 保留所有现有修改。同步 `pyproject.toml`、`modelsheet/__init__.py`、`frontend/package.json`
   和 `frontend/package-lock.json` 中两个根版本，运行 `python scripts/check_release.py --stable --tag v0.3.0`。
2. 运行 `python manage.py check`、`python manage.py makemigrations --check --dry-run`、
   `python -m ruff check .` 和 `python -m pytest -q`。
3. 在 `frontend` 中运行 `npm ci`、`npm test`、`npm run build`、`npm run build:demo`、
   `npx playwright install chromium` 和 `npm run test:e2e`，检查并提交重新生成的静态资源。
4. 安装 `requirements-docs.txt`，运行 `python scripts/check_docs_locales.py` 和
   `mkdocs build --strict`，然后在 `frontend` 中运行 `npm run test:demo`。
5. 构建到空目录：`python -m build --outdir /tmp/modelsheet-030-dist`，
   然后运行 `python -m twine check /tmp/modelsheet-030-dist/*`。
6. 运行 `python scripts/package_smoke.py --wheel /tmp/modelsheet-030-dist/django_modelsheet-0.3.0-py3-none-any.whl`，
   再添加 `--upgrade-from 0.3.0a2` 重复检查。也可传入旧版 wheel 路径。
   检查在仓库外安装、迁移和收集静态文件，并验证历史、明细和快照保留、旧计划过期。
   虚拟环境复用系统依赖，不验证全新下载的依赖解析。

保留原始 `0001` 并提供 `0002_operation_preview_expires_at`。升级前备份数据库，暂停应用写入和后台任务。
安装新包后执行迁移与 collectstatic，重启应用及后台任务并刷新页面。旧的未确认计划需要重新预览；
已确认任务仍可恢复。参见[升级说明](guide/releases.md)和[验证报告](validation.md)。

## CI 与发布门槛

可复用的 `ci.yml` 检查全部 16 个 Python/Django/数据库组合、前端单元测试、浏览器场景、
wheel/sdist 元数据、新安装及从 0.3.0a2 升级。它调用 `docs-checks.yml`，检查语言覆盖、
严格文档构建、已提交的演示资源和演示浏览器测试。这些验证流程不发布任何内容。

`workflow.yml` 首先检查稳定版本和标签，再对同一提交调用完整 CI。发布任务依赖全部检查，
仅使用验证成功后生成的 `pypi-distributions`。旧提交的绿色 CI 不能证明当前提交可发布。

获批后，在 `main` 上运行 **Publish to PyPI**。不勾选 `publish` 只执行验证；勾选才上传。
发布 GitHub Release `v0.3.0` 也会触发相同检查和上传。普通 push 不发布包，其他分支不能手动上传。
已上传的 PyPI 版本不能替换，后续更改必须使用新版本。

## Trusted Publishing

为 PyPI 项目 `django-modelsheet` 配置发布者：仓库 `svalench/django-modelsheet`、
工作流文件 `workflow.yml`、环境 `pypi`。仅发布任务通过 OIDC 使用 `id-token: write`，无需 PyPI token。
参见 [PyPI 配置说明](https://docs.pypi.org/trusted-publishers/adding-a-publisher/)。
本地验证和构建命令不会上传、创建标签或推送仓库。
