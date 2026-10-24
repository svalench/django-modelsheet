# Настройки

Все настройки находятся в `settings.MODELSHEET`. Указанные значения объединяются с настройками по умолчанию; секция `formula` также объединяется по ключам.

## Пример конфигурации

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
        "max_length": 500,
        "max_depth": 10,
        "max_steps": 10000,
        "timeout_ms": 250,
    },
}
```

## Страницы и сохранение

| Настройка | По умолчанию | Назначение |
| --- | --- | --- |
| `models` | `[]` | Явный список разрешённых моделей `app.Model` |
| `page_size` | `200` | Строк на странице |
| `max_page_size` | `500` | Верхняя граница размера страницы |
| `max_save_rows` | `500` | Строк в обычном сохранении |
| `count_mode` | `"exact"` | `exact` или `none`; во втором случае COUNT не запрашивается |
| `max_request_bytes` | `1000000` | Лимит размера запроса |
| `snapshot_ttl_seconds` | `1800` | Время жизни снимка представления |

Пагинация использует offset/limit. Курсорной пагинации и приблизительного COUNT в альфе нет.

## Массовые операции и история

| Настройка | По умолчанию | Назначение |
| --- | --- | --- |
| `bulk_background_threshold` | `5000` | Порог обязательной фоновой обработки |
| `max_bulk_rows` | `100000` | Максимум кандидатов операции |
| `chunk_size` | `200` | Размер порции фонового выполнения |
| `preview_ttl_seconds` | `1800` | Время жизни предпросмотра |
| `history_retention_days` | `365` | Срок хранения истории |
| `max_operations_per_minute` | `30` | Ограничение частоты операций |
| `max_filter_depth` | `10` | Глубина дерева условий |
| `max_filter_nodes` | `100` | Количество узлов условий |

Настройте периодический запуск через свой планировщик:

```bash
python manage.py modelsheet_cleanup
```

Команда удаляет просроченные снимки и старые завершённые операции или неиспользованные предпросмотры согласно сроку хранения. После удаления операции её ключ идемпотентности больше не защищает от повторного применения.

## Точки расширения

```python
MODELSHEET.update({
    "field_adapter": "modelsheet.adapters.FieldAdapter",
    "save_adapter": "myproject.modelsheet.ProjectSaveAdapter",
    "permission_policy": "myproject.modelsheet.ProjectPolicy",
    "background_adapter": None,
})
```

Классы создаются без аргументов. [API расширений](../extensions.md) описывает сигнатуры, [фоновые задания](../background.md) — восстановление контекста и повторную доставку.
