# 本地验证 — 0.3.0 · 2026-10-25

**0.3.0** 已准备好，未上传包、创建标签、推送或发布；现有未提交修改均已保留。
环境：macOS arm64、Python 3.13.7、Django 6.0.4、SQLite、Node 22.19.0、npm 10.9.3。

| 检查 | 结果 |
| --- | --- |
| Python，包括预览失效与迁移回归测试 | 188 通过 |
| 前端单元测试，包括特殊字符串主键 | 75 通过 |
| Admin 浏览器场景 | 23 通过 |
| TypeScript、生产及演示构建 | 通过 |
| Ruff、Django、迁移一致性、版本检查 | 通过 |
| 语言覆盖 | 19 页 × 3 种语言 |
| 严格文档构建 | 通过 |
| 演示浏览器场景 | 3 通过 |
| 生产和演示资源重建 | 完全一致 |
| wheel/sdist 元数据、隔离安装和 collectstatic | 通过 |
| 从已发布的 0.3.0a2 wheel 升级 | 历史、明细、快照均保留 |

预览截止时间在准备完成时固定，取消和恢复不会延长。空计划保持原有记录集。
迁移 `0002` 将旧的未确认计划保守地标记为过期，同时保留审计数据。
`__proto__` 和 `constructor` 可以正常编辑、撤销、重做和保存。
此前的权限、聚合缓存和过期响应修复也已保留。

安装包检查在仓库外运行，复用系统依赖并使用独立数据库。未在本地运行
PostgreSQL/MySQL 或其他 Python/Django 版本。CI 配置了 16 个组合，并要求浏览器、
安装包、升级和文档检查全部通过。发布前仍需最终提交的远程 CI 成功；旧结果不能验证当前未提交修改。

下方保留历史报告，不代表 0.3.0 的验证结果。

## 验证报告 · 2026-10-24

!!! info "发布前的本地报告"
    此报告记录公开发布前的本地检查。0.3.0a1 现已在 [PyPI](https://pypi.org/project/django-modelsheet/0.3.0a1/) 发布；后续远程结果参见 [GitHub Actions](https://github.com/svalench/django-modelsheet/actions)。

## 环境与结果

版本 **0.3.0a1**。macOS arm64、Python 3.13.7、Django 6.0.4、SQLite、Node 22.19.0、npm 10.9.3。Frontend 依赖固定在 frontend/package-lock.json；浏览器测试通过 MODELSHEET_CHROMIUM 使用本机 Chromium 与 Playwright 的本地 Django 服务。

| 检查 | 结果 |
| --- | --- |
| pytest：后端、公式、权限、事务 | 102 通过 |
| Vitest：缓冲与公式 | 57 通过 |
| Playwright 浏览器场景 | 10 通过 |
| TypeScript、Vite、Ruff、Django checks | 通过 |
| 缺失迁移检测 | 无变化 |
| wheel/sdist 构建与 twine 元数据 | 通过 |
| 在仓库导入路径外安装 wheel | 通过 |
| 已安装包的 migrate/collectstatic | 通过，无需 Node.js |
| 模板、静态资源、依赖许可证 | 完整 |
| sdist 内容 | 不含 node_modules 或浏览器报告 |

Smoke test 创建可访问系统依赖的新虚拟环境，不解析依赖地安装 wheel，再使用独立数据库与 settings 在仓库外执行。它验证打包集成，不验证从索引全新下载 Django。

浏览器覆盖公式编辑/撤销/重做/保存/重载、只读粘贴、预览确认、失败保留、Admin 分页与搜索、50 列虚拟化、键盘导航、服务器排序、Ctrl+D、切换视图后拒绝位置公式粘贴。

后端覆盖权限绕过尝试、隐藏字段和历史脱敏、只读审计 Admin、标准 Admin 保存冲突、事务回滚、独立连接并发、重复键、固定候选、依赖冲突、后台取消恢复、重复投递、部分完成和批次间权限撤销。

## 测量结果

临时 SQLite 数据库含 50 个标量数据列，每页 200 行，每场景测量 10 次。后端延迟包含快照保存与精确计数，不含 HTTP/浏览器。结果为本机观察，非普适性能承诺；测试未与其他开发活动隔离，沙箱未提供 CPU/RAM 详情。

| 数据 / 操作 | 中位数 | p95 |
| --- | ---: | ---: |
| 100k / 第 1 页 | 29.94 ms | 40.70 ms |
| 100k / 第 5 页 | 33.75 ms | 40.94 ms |
| 100k / 精确索引筛选 | 2.99 ms | 4.80 ms |
| 100k / 子串搜索 | 46.60 ms | 57.19 ms |
| 1M / 第 1 页 | 36.07 ms | 300.50 ms |
| 1M / 第 5 页 | 37.32 ms | 60.13 ms |
| 1M / 精确索引筛选 | 2.15 ms | 3.37 ms |
| 1M / 子串搜索 | 377.84 ms | 442.33 ms |

每次调用使用 4 条 SQL。原始结果：[100k](benchmark-100k.json)、[1M](benchmark-1m.json)。复现方法见[性能基准](benchmarks.md)。

## 此本地报告未验证的部分

PostgreSQL/MySQL/Docker 在本机不可用；其他 Python/Django 组合由 CI 配置，需以各次运行结果为准。最初名称探测遇到证书/网络问题，不能视为名称预留。此报告编写时尚未上传 PyPI/TestPyPI 或执行远程 CI；公开 PyPI 发布后来完成，见顶部说明。首版没有旧版升级路径可测试。发布步骤见[发布指南](releasing.md)。
