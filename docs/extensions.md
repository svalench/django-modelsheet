# Адаптеры и интеграция

Компоненты указываются в `MODELSHEET` строковыми путями к классам и создаются без аргументов.

```python title="settings.py"
MODELSHEET = {
    "models": ["shop.Product"],
    "save_adapter": "myproject.modelsheet.ProjectSaveAdapter",
    "permission_policy": "myproject.modelsheet.ProjectPolicy",
}
```

## SaveAdapter

Валидация и сохранение с бизнес-логикой проекта:

```python title="myproject/modelsheet.py"
from django.core.exceptions import ValidationError
from modelsheet.adapters import SaveAdapter


class ProjectSaveAdapter(SaveAdapter):
    def validate(self, instance, request):
        super().validate(instance, request)
        # Дополнительное правило только для модели с price.
        if hasattr(instance, "price") and instance.price < 0:
            raise ValidationError({"price": "Цена не может быть отрицательной."})

    def save(self, instance, fields, request):
        instance.save()
```

Стандартная реализация вызывает `full_clean()` и `save()`. Кастомный адаптер не должен самостоятельно коммитить транзакцию или менять БД. Для внешних эффектов используйте `transaction.on_commit()` и собственный ключ идемпотентности.

## PermissionPolicy

Политика дополняет стандартные права и методы Admin, сужая доступ:

```python title="Пример для модели с is_locked"
from modelsheet.permissions import PermissionPolicy


class ProjectPolicy(PermissionPolicy):
    def can_edit_object(self, request, admin, obj):
        return (
            super().can_edit_object(request, admin, obj)
            and not getattr(obj, "is_locked", False)
        )
```

| Метод | Область |
| --- | --- |
| `can_view_field(request, admin, name)` | Чтение поля |
| `can_edit_field(request, admin, name)` | Изменение поля |
| `can_view_object(request, admin, obj)` | Чтение записи |
| `can_edit_object(request, admin, obj)` | Изменение записи |

Tenant-фильтры размещайте в `ModelAdmin.get_queryset()`, чтобы они ограничивали подсчёт и страницы. Объектные методы не заменяют фильтрацию запроса.

## FieldAdapter

Настройка сериализации, разбора и метаданных полей:

| Метод | Назначение |
| --- | --- |
| `supported(field)` | Поддерживается ли поле |
| `editable(field)` | Допускается ли редактирование типа |
| `metadata(field)` | Метаданные редактора |
| `serialize(field, instance)` | Значение для JSON |
| `parse(field, value)` | Разбор клиентского значения |

Укажите класс в `MODELSHEET["field_adapter"]`. Готовый frontend поддерживает текст и choices. Новые JS-виджеты требуют изменения и пересборки frontend. Стандартный адаптер не редактирует FK/M2M.

## Транзакции и аудит

Эндпоинты записи исключены из `ATOMIC_REQUESTS` и открывают собственные короткие транзакции. PostgreSQL/MySQL блокируют свежие строки перед проверкой отпечатка, SQLite требует IMMEDIATE. Временная занятость БД возвращает повторяемую ошибку: повторяйте исходный запрос с исходным ключом.

Неизменённые поля не присваиваются из клиентского payload. Обычный `save()` может изменить другие поля через проектные hooks. Журнал содержит явно присвоенные поля и их итоговые значения, а не полный аудит всех побочных эффектов модели.

## Что наследуется от Admin

Поддерживаются `get_queryset`, `readonly_fields`, permissions, скалярные `search_fields` и порядок по обычным полям.

Related search paths, произвольные custom list filters, сортировка через display-методы, формы Admin, `save_model` и `save_related` автоматически не переводятся. При невозможности точно перенести состояние переход между видами блокируется.

Фоновое выполнение вынесено в отдельный [контракт BackgroundAdapter](background.md).
