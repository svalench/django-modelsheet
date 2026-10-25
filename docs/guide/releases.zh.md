# 版本与限制

## 0.3.0 · 已准备，待发布

修复编辑缓冲区中的特殊字符串主键问题，并固定预览失效时间。包含检查权限后缓存的批量聚合、过期响应保护和自动发现 `ModelSheetAdmin`。发布必须通过完整 CI 矩阵、浏览器和安装包测试，以及严格的文档检查。

0.3.0 已准备好，但尚未发布。当前可通过 `python -m pip install .` 安装本地代码。发布后：

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

服务器撤销、关系编辑器、导入导出、fast-save、持久公式和游标分页属于后续方向，并非时间承诺。

[源码](https://github.com/svalench/django-modelsheet) · [更新日志](https://github.com/svalench/django-modelsheet/blob/main/CHANGELOG.md) · [贡献指南](https://github.com/svalench/django-modelsheet/blob/main/CONTRIBUTING.md) · [安全政策](https://github.com/svalench/django-modelsheet/blob/main/SECURITY.md)
