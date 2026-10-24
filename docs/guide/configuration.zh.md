# 配置

`settings.MODELSHEET` 与默认值合并，`formula` 内部键也会合并。

```python title="settings.py"
MODELSHEET = {
    "models": ["shop.Product", "shop.Order"],
    "page_size": 200,
    "max_page_size": 500,
    "max_save_rows": 500,
    "count_mode": "exact",
    "bulk_background_threshold": 5000,
    "max_bulk_rows": 100000,
    "chunk_size": 200,
    "snapshot_ttl_seconds": 1800,
    "preview_ttl_seconds": 1800,
    "history_retention_days": 365,
    "max_operations_per_minute": 30,
    "max_request_bytes": 1000000,
    "formula": {
        "max_length": 500, "max_depth": 10,
        "max_steps": 10000, "timeout_ms": 250,
    },
}
```

## 分页与保存

| 设置 | 默认值 | 用途 |
| --- | --- | --- |
| `models` | `[]` | 显式允许的 `app.Model` |
| `page_size` / `max_page_size` | `200` / `500` | 默认 / 最大页行数 |
| `max_save_rows` | `500` | 普通保存的最大行数 |
| `count_mode` | `"exact"` | `exact` 或 `none`；后者不执行 COUNT |
| `max_request_bytes` | `1000000` | 请求大小上限 |
| `snapshot_ttl_seconds` | `1800` | 快照有效秒数 |

采用 offset/limit 分页；不含游标分页或估算计数。

## 操作与历史

| 设置 | 默认值 | 用途 |
| --- | --- | --- |
| `bulk_background_threshold` | `5000` | 后台处理阈值 |
| `max_bulk_rows` | `100000` | 候选记录上限 |
| `chunk_size` | `200` | 后台批次行数 |
| `preview_ttl_seconds` | `1800` | 预览有效秒数 |
| `history_retention_days` | `365` | 历史保留天数 |
| `max_operations_per_minute` | `30` | 操作频率限制 |
| `max_filter_depth` / `max_filter_nodes` | `10` / `100` | 筛选复杂度上限 |

通过项目调度器定期运行 `python manage.py modelsheet_cleanup`。按保留期限删除过期快照、旧的终态操作及未使用预览。已清理的幂等键不再阻止重复应用。

## 扩展点

```python
MODELSHEET.update({
    "field_adapter": "modelsheet.adapters.FieldAdapter",
    "save_adapter": "myproject.modelsheet.ProjectSaveAdapter",
    "permission_policy": "myproject.modelsheet.ProjectPolicy",
    "background_adapter": None,
})
```

组件以无参方式实例化。参见[适配器](../extensions.md)与[后台任务](../background.md)。
