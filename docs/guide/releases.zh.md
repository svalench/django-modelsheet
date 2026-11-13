# 版本与限制

## 0.5.0 · 2026 年 11 月 13 日

外键显示关联对象的文本，并提供受权限约束的自动完成编辑器。支持按字段类型编辑、CSV/XLSX 导入导出、已保存视图、在表格中新增和删除行、服务器撤销上次保存、更易读的筛选、查找替换、向右填充、可选后台适配器、不落库的校验，以及可选的键集分页。对象权限不再在分页中留下空位。迁移 `0003_saved_view` 增加共享视图。

```bash
python -m pip install --upgrade 'django-modelsheet[xlsx,celery]==0.5.0'
```

`xlsx` 与 `celery` 为可选依赖。备份数据库，安装软件包，执行 `migrate` 和 `collectstatic`，重启后台进程并刷新浏览器。默认分页仍是 `offset`，默认不配置后台适配器。

## 0.4.0 · 2026 年 10 月 30 日

按记录只读字段会在保存和批量操作中被拒绝。`GET rows/` 受频率限制，并会清理旧快照。`history_scope` 可以隐藏其他用户的操作（默认仍为 `"all"`）。`offset` 受 `max_offset` 限制。API 错误信息可翻译，意外异常不再被报告为格式错误的请求。

没有数据库迁移。安装 `django-modelsheet==0.4.0`，执行 `collectstatic` 并重启。

## 0.3.0 · 2026 年 10 月 25 日

修复编辑缓冲区中的特殊字符串主键问题，并固定预览失效时间。包含检查权限后缓存的批量聚合、过期响应保护和自动发现 `ModelSheetAdmin`。发布必须通过完整 CI 矩阵、浏览器和安装包测试，以及严格的文档检查。

从 PyPI 安装稳定版本：

[GitHub Release](https://github.com/svalench/django-modelsheet/releases/tag/v0.3.0) · [PyPI](https://pypi.org/project/django-modelsheet/0.3.0/)

```bash
python -m pip install --upgrade django-modelsheet==0.3.0
```

备份数据库并暂停应用写入和后台任务。安装新包，运行 `python manage.py migrate` 和 `python manage.py collectstatic --noinput`，然后重启应用及后台任务并刷新浏览器页面。迁移 `0002_operation_preview_expires_at` 保留审计历史、快照和操作明细。旧的未确认预览将保守地标记为过期，确认前必须重新预览。已确认的任务仍可恢复执行。

预览截止时间在准备完成时固定。取消、恢复以及修改 `preview_ttl_seconds` 均不会延长截止时间。过期且未确认的计划返回 `expired_preview`（409），需要重新预览。恢复空预览会保留原始空记录集。已确认的任务在截止时间后仍可恢复执行。

## 0.3.0a2 · 2026 年 10 月 24 日

修复未修改的数字单元格被标记为已修改、编辑器溢出和键盘导航时公式栏未更新的问题。在线演示在编辑后保持单元格标识稳定，并新增浏览器回归测试。

[从 PyPI 安装](https://pypi.org/project/django-modelsheet/0.3.0a2/){ .md-button .md-button--primary }
[GitHub Release](https://github.com/svalench/django-modelsheet/releases/tag/v0.3.0a2){ .md-button }

```bash
python -m pip install --upgrade django-modelsheet==0.3.0a2
```

## 0.3.0a1 · 2026 年 10 月 24 日

首个公开 Alpha 版包含区域编辑、本地缓冲、安全保存、公式和带预览的批量操作。

[从 PyPI 安装](https://pypi.org/project/django-modelsheet/0.3.0a1/){ .md-button .md-button--primary }
[GitHub Release](https://github.com/svalench/django-modelsheet/releases/tag/v0.3.0a1){ .md-button }

```bash
python -m pip install django-modelsheet==0.3.0a1
```

包含显式模型注册、剪贴板、填充、撤销、Decimal 计算、服务器查询、冲突检测、不可变计划、审计、幂等与后台适配器契约，以及编译静态资源、演示项目和 MIT 许可证。

## 兼容性

| 组件 | 项目矩阵 |
| --- | --- |
| Django 5.2 | Python 3.11–3.14 |
| Django 6.0 / 6.1 | Python 3.12–3.14 |
| 数据库 | PostgreSQL、MySQL/InnoDB、SQLite |
| 安装 | wheel/sdist，无需 Node.js |

在 [CI](https://github.com/svalench/django-modelsheet/actions/workflows/ci.yml) 检查所用组合；本地验证范围见[验证报告](../validation.md)。

## 0.5.0 边界

| 功能 | 当前行为 |
| --- | --- |
| 创建 / 删除 | 拥有模型 add/delete 权限时，与其他更改同一次原子保存 |
| 外键 | 显示文本并自动完成；存储值仍是主键 |
| 多对多 | 只读标签；导入和撤销不修改关联 |
| 公式 | 一次性计算值或虚拟列；新行不能以公式开头 |
| 撤销 | 本地缓冲，以及冲突安全的服务器撤销上次保存 |
| 文件导入 / 导出 | CSV；安装可选 extra 后支持 XLSX；仍支持 TSV 剪贴板 |
| 后台队列 | 可选线程、Django tasks 或 Celery；默认不启用 |
| 分页 | 默认 offset；keyset 需显式开启，且不受 `max_offset` 限制 |
| 多数据库 | 仅 `default` |
| 计算列排序 | 不支持 |

## 0.3.0 边界

| 功能 | 当前行为 |
| --- | --- |
| 创建 / 删除 | 标准 Admin |
| FK | 允许的展示与筛选，无编辑器 |
| M2M | 无编辑器 |
| 公式 | 一次性计算值或虚拟列 |
| 撤销 | 仅保存前的本地缓冲 |
| 文件导入 / 导出 | 推迟，支持 TSV 剪贴板 |
| 后台队列 | 项目适配器提供 |
| 多数据库 | 仅 `default` |
| 计算列排序 | 不支持 |

上表记录的是 0.3.0。关系编辑器、导入导出、服务器撤销和键集分页已在 0.5.0 提供。fast-save 与持久公式仍是后续工作。

[源码](https://github.com/svalench/django-modelsheet) · [更新日志](https://github.com/svalench/django-modelsheet/blob/main/CHANGELOG.md) · [贡献指南](https://github.com/svalench/django-modelsheet/blob/main/CONTRIBUTING.md) · [安全政策](https://github.com/svalench/django-modelsheet/blob/main/SECURITY.md)
