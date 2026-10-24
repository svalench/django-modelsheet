# 发布软件包

## 配置 PyPI Trusted Publishing

发布 workflow 为 `.github/workflows/workflow.yml`；`ci.yml` 只测试，不发布。

首次发布在 [PyPI Publishing](https://pypi.org/manage/account/publishing/) 添加 pending publisher：

| 字段 | 值 |
| --- | --- |
| 项目名 | `django-modelsheet` |
| GitHub owner | `svalench` |
| Repository | `django-modelsheet` |
| Workflow 文件名 | `workflow.yml` |
| Environment | `pypi` |

已有项目应在项目 Publishing 设置中添加。Pending publisher 不预留名称。无需 API token 或 GitHub secret：任务使用 OIDC、`id-token: write` 和 `pypi` environment。

保存后在 Actions 选择 **Publish to PyPI → Run workflow → main**。不勾 `publish` 只验证构建，勾选则上传当前版本。先构建 frontend、执行后端/单元/浏览器测试、构建 wheel/sdist 并验证安装，最后由独立任务上传。

也可发布匹配版本的 GitHub Release（包括 prerelease），触发同一流程。Tag 必须与 `pyproject.toml` 版本一致；普通 push 不发布，非 main 分支禁止手动上传。已上传版本不可替换，后续必须升版本。

## 维护者检查清单

1. 运行完整 CI 矩阵、浏览器、包安装与迁移检查。
2. 检查依赖许可证和目标名称可用性。
3. 更新 `pyproject.toml`、`modelsheet/__init__.py`、`frontend/package.json` 版本、lockfile、changelog 与兼容说明。
4. 运行 frontend 的 `npm ci && npm run build`，再 `python -m build` 与 `python -m twine check dist/*`；检查静态资源、模板、翻译与迁移。
5. 在干净环境安装 wheel，运行 migrate/collectstatic，验证从旧版升级，并保留历史迁移。
6. 获得发布授权且已配置凭据后，用 `python -m twine upload --repository testpypi dist/*` 发布 TestPyPI 并验证安装；依赖从正式索引安装。
7. 审核后打 tag，通过 Trusted Publishing 或维护者凭据发布 PyPI。

本地构建不会上传、push 或公开发布。`python scripts/check_pypi_name.py` 的 404 仅表示当时名称未占用，不代表预留。

[PyPI 官方指南](https://docs.pypi.org/trusted-publishers/adding-a-publisher/)。
