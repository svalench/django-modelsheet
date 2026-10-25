# 故障排查

## 没有 Spreadsheet 按钮

确认安装并迁移了 `modelsheet`，已注册 Admin 继承 `ModelSheetAdmin`，并正确配置 `sheet_fields` 和用户权限。运行 `python manage.py check`。

## 字段只读

字段必须在 `sheet_editable` 中。`readonly_fields`、模型和字段权限、对象级 Admin hooks 以及项目策略同样生效。0.3.0不支持编辑 FK/M2M 或计算列。

## 保存冲突

源记录或依赖变化，或快照已过期。先另存所需更改，重新加载并应用；不要自行替换请求中的 `version`。若只是响应丢失，应以原始幂等键重发完全相同的请求。

## SQLite 事务模式

```python
DATABASES["default"].setdefault("OPTIONS", {})["transaction_mode"] = "IMMEDIATE"
```

仅 `select_for_update()` 不足以保护 SQLite。数据库忙会返回可重试错误，请保留原请求与原幂等键。

## 公式错误

`#REF!`：检查列顺序和快照边界，行号仅对当前页有效。`#LIMIT!`：简化表达式或范围。提高 `MODELSHEET["formula"]` 限制时应考虑项目负载。

## 大型操作被拒绝

超过 `bulk_background_threshold` 需配置 [BackgroundAdapter](../background.md)。提高阈值不会自动创建 worker 或队列；还应检查 `max_bulk_rows` 和批量权限。

## 无法切换到标准 Admin

当前筛选或排序无法精确表达。简化条件；自定义 list filters、关联搜索和表达式排序可能需要额外集成。

## 生产环境 JS 未加载

运行 `collectstatic`，检查 `STATIC_ROOT` 的服务配置，以及浏览器网络中缺失的 `modelsheet` 资源。wheel 已含编译静态文件，业务项目无需 npm。

## 报告问题

提交 [GitHub issue](https://github.com/svalench/django-modelsheet/issues)，附版本、Python/Django、数据库、最小 Admin 配置和复现步骤。删除密钥与个人数据。
