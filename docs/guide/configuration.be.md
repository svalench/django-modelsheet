# Налады

`settings.MODELSHEET` аб'ядноўваецца са змаўчаннямі, у тым ліку ключы ў секцыі `formula`.

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

## Старонкі і захаванне

| Налада | Змаўчанне | Прызначэнне |
| --- | --- | --- |
| `models` | `[]` | Яўны спіс `app.Model` |
| `page_size` / `max_page_size` | `200` / `500` | Звычайны / найбольшы памер старонкі |
| `max_save_rows` | `500` | Максімум радкоў звычайнага захавання |
| `count_mode` | `"exact"` | `exact` або `none`; none не выконвае COUNT |
| `max_request_bytes` | `1000000` | Мяжа памеру запыту |
| `snapshot_ttl_seconds` | `1800` | Час жыцця здымка ў секундах |

Пагінацыя выкарыстоўвае offset/limit. Курсорная пагінацыя і прыблізныя падлікі не ўваходзяць.

## Аперацыі і гісторыя

| Налада | Змаўчанне | Прызначэнне |
| --- | --- | --- |
| `bulk_background_threshold` | `5000` | Парог фонавай апрацоўкі |
| `max_bulk_rows` | `100000` | Максімум кандыдатаў |
| `chunk_size` | `200` | Радкоў у фонавай порцыі |
| `preview_ttl_seconds` | `1800` | Час жыцця прагляду ў секундах |
| `history_retention_days` | `365` | Захоўванне гісторыі ў днях |
| `max_operations_per_minute` | `30` | Мяжа частаты аперацый |
| `max_filter_depth` / `max_filter_nodes` | `10` / `100` | Межы складанасці фільтра |

Заплануйце `python manage.py modelsheet_cleanup` сваім планавальнікам. Каманда выдаляе пратэрмінаваныя здымкі і старыя завершаныя аперацыі або нявыкарыстаныя прагляды паводле тэрміну захоўвання. Пасля выдалення ключ ідэмпатэнтнасці больш не засцерагае ад паўторнага прымянення.

## Пашырэнні

```python
MODELSHEET.update({
    "field_adapter": "modelsheet.adapters.FieldAdapter",
    "save_adapter": "myproject.modelsheet.ProjectSaveAdapter",
    "permission_policy": "myproject.modelsheet.ProjectPolicy",
    "background_adapter": None,
})
```

Кампаненты ствараюцца без аргументаў. Гл. [адаптары](../extensions.md) і [фонавыя заданні](../background.md).
