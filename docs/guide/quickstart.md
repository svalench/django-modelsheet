# Установка за 5 минут

Подключим таблицу товаров: цену и остаток можно будет редактировать, название — только читать, а стоимость запасов — вычислять формулой.

!!! info "Текущая версия — alpha"
    Пример рассчитан на проект с настроенным Django Admin и уже существующей моделью `shop.Product`. Для знакомства без своего проекта используйте [демопроект](demo.md).

## 1. Установите пакет

```bash
python -m pip install django-modelsheet==0.3.0a1
```

Готовые JavaScript и CSS входят в пакет. Node.js, npm и CDN для подключения не нужны.

## 2. Разрешите модель

```python title="settings.py"
INSTALLED_APPS += ["modelsheet"]

MODELSHEET = {
    "models": ["shop.Product"],
    "page_size": 200,
}
```

Модель должна быть одновременно в `MODELSHEET["models"]` и зарегистрирована через `ModelSheetAdmin`. Одного наследования недостаточно.

=== "SQLite"

    Добавьте режим транзакций, необходимый для защиты от конкурентной записи:

    ```python title="settings.py"
    DATABASES["default"].setdefault("OPTIONS", {})
    DATABASES["default"]["OPTIONS"]["transaction_mode"] = "IMMEDIATE"
    ```

=== "PostgreSQL / MySQL"

    Используется стандартное соединение `default` и блокировка строк внутри транзакции. Для MySQL нужны транзакционные таблицы InnoDB. Отдельные настройки подключения для пакета не требуются.

## 3. Подключите Admin

```python title="shop/admin.py"
from django.contrib import admin
from modelsheet.admin import ModelSheetAdmin

from .models import Product


@admin.register(Product)
class ProductAdmin(ModelSheetAdmin):
    list_display = ("name", "price", "stock")
    search_fields = ("name",)
    sheet_fields = ("name", "price", "stock")
    sheet_editable = ("price", "stock")
    sheet_computed_fields = {
        "inventory_value": "=[price]*[stock]",
    }
```

Если модель уже зарегистрирована, замените базовый `admin.ModelAdmin` в существующем классе. Не регистрируйте модель повторно.

| Атрибут | Назначение |
| --- | --- |
| `sheet_fields` | Доступные в таблице поля модели |
| `sheet_editable` | Подмножество полей для изменения |
| `sheet_computed_fields` | Виртуальные колонки: имя → формула |
| `search_fields` | Поля поиска; используйте доступные скалярные поля |

## 4. Примените миграции

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check
```

Миграции создают снимки представлений и журнал операций. Добавлять поля или базовый класс в `Product` не нужно.

## 5. Откройте таблицу

Войдите в Admin как суперпользователь и нажмите **Spreadsheet** в списке товаров или откройте:

```text
/admin/shop/product/sheet/
```

Измените цену, нажмите **Save** и перезагрузите страницу: новое значение должно сохраниться. Для обычных сотрудников настройте [права доступа](permissions.md).

## Куда дальше

- [Работа с таблицей](editing.md): диапазоны, вставка, отмена и сохранение.
- [Формулы](formulas.md): наценка, скидка и вычисляемые колонки.
- [Массовые изменения](bulk.md): обновление всех подходящих товаров с предпросмотром.
- [Настройки](configuration.md): лимиты, история и адаптеры.
