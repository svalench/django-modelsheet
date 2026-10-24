# 权限与数据完整性

界面和直接 JSON 请求都受 Django 权限、Admin hooks 与字段权限约束。

## 访问要求

打开表格需要 active staff 用户、`modelsheet.open`、标准模型 `view` 权限和 `ModelAdmin.has_view_permission()`。编辑还需要 `change`、`has_change_permission()` 和字段编辑权限。超级用户可直接操作明确允许且已注册的模型。

## 可选角色组

```bash
python manage.py modelsheet_roles
```

该幂等命令创建组，但不分配用户。在 Admin 中分配组，并设置用户 `is_staff`。

| 组 | 能力 |
| --- | --- |
| ModelSheet Viewer | 读取表格 |
| ModelSheet Editor | 读取与编辑 |
| ModelSheet Operator | 编辑、批量操作与历史 |
| ModelSheet Auditor | 读取与历史 |
| ModelSheet Admin | 软件包功能，不授予 superuser |

组模板授权已配置字段；分配前请检查敏感列。重复执行只追加权限，不删除项目自定义授权。

## 字段与行范围

```text
modelsheet.view_field_shop_product_price
modelsheet.edit_field_shop_product_price
modelsheet.bulk_shop_product
modelsheet.history_shop_product
```

字段权限不授予模型级编辑权限。隐藏字段不可用于搜索、筛选、排序、公式或历史。自定义 `PermissionPolicy` 可进一步收紧访问。

使用 `get_queryset()` 限制行或租户范围，计数和分页也会受约束：

```python title="包含 owner、title、status 字段的模型示例"
class DocumentAdmin(ModelSheetAdmin):
    sheet_fields = ("title", "status")
    sheet_editable = ("status",)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if request.user.is_superuser:
            return queryset
        return queryset.filter(owner=request.user)
```

演示 Product 不含 `owner`，请按自己的模型调整。

## 并发更改 { #concurrency }

加载时返回具体字段值的签名指纹。服务器在写事务内重新读取、加锁并比较指纹；公式还检查源依赖。其他 Admin 表单或 API 的修改会导致冲突，避免静默覆盖。

PostgreSQL/MySQL 使用行锁；SQLite 需要 `transaction_mode="IMMEDIATE"` 与短事务。普通保存是原子的，后台任务可能部分完成。指纹不记录全部中间状态或任意关联表变化。

## 保存 hooks

默认适配器调用 `full_clean()` 和 `instance.save()`，包括模型信号。自定义 Admin 表单、`save_model()` 和 `save_related()` 需要 [SaveAdapter](../extensions.md)。外部副作用需自行实现幂等。模型修改和日志必须位于同一 `default` 数据库。
