# 适配器与集成

在 `MODELSHEET` 中使用带点号的类路径指定组件，组件以无参方式实例化。

```python
from modelsheet.adapters import SaveAdapter
from modelsheet.permissions import PermissionPolicy


class ProjectSaveAdapter(SaveAdapter):
    def validate(self, instance, request):
        super().validate(instance, request)
        # 在此添加项目验证，可抛出 Django ValidationError。

    def save(self, instance, fields, request):
        instance.save()


class ProjectPolicy(PermissionPolicy):
    def can_edit_object(self, request, admin, obj):
        return (
            super().can_edit_object(request, admin, obj)
            and not getattr(obj, "is_locked", False)
        )
```

```python title="settings.py"
MODELSHEET.update({
    "save_adapter": "myproject.modelsheet.ProjectSaveAdapter",
    "permission_policy": "myproject.modelsheet.ProjectPolicy",
})
```

## 接口

| 组件 | 方法 |
| --- | --- |
| `FieldAdapter` | `supported(field)`, `editable(field)`, `metadata(field)`, `serialize(field, instance)`, `parse(field, value)` |
| `SaveAdapter` | `validate(instance, request)`, `save(instance, fields, request)` |
| `PermissionPolicy` | `can_view_field(request, admin, name)`, `can_edit_field(request, admin, name)`, `can_view_object(request, admin, obj)`, `can_edit_object(request, admin, obj)` |

策略在标准 Django 权限之外进一步收紧访问。租户和行范围应放在 `ModelAdmin.get_queryset()`，使计数与分页也受限；对象 hooks 不能替代查询筛选。

适配器不得独立提交事务、切换数据库或信任客户端字段名。默认验证调用 `full_clean()`，默认保存调用实例 `save()`。外部工作请通过 `transaction.on_commit()` 调度，并自行处理幂等。

## 字段编辑器

已编译 frontend 支持文本和 choices。自定义字段适配器可复用该标量契约；新 JS 控件需要修改并重新构建 frontend。默认适配器不编辑 FK/M2M。

## 事务与审计

包端点排除在 `ATOMIC_REQUESTS` 外，使用独立短写事务。PostgreSQL/MySQL 在比较签名指纹前锁定新读取的记录；SQLite 需要 IMMEDIATE。数据库忙或死锁返回可重试错误，应使用原请求和原键重试。

未修改字段不会从客户端赋值。默认 `save()` 允许项目 hooks 修改其他字段，但审计只记录显式赋值字段及其保存后值，并非完整数据库审计。

## Admin 集成边界

继承 `get_queryset`、`readonly_fields`、权限、标量 `search_fields` 和普通具体字段排序。关联搜索、自定义 list filters、display 方法排序、自定义表单、`save_model` 与 `save_related` 不会自动转换。不能精确转换状态时阻止切换，而非丢弃条件。

后台扩展参见 [BackgroundAdapter](background.md)。
