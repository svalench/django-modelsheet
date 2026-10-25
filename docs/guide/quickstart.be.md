# Усталяванне за 5 хвілін

Падключым існую мадэль `shop.Product`: цану і запас можна рэдагаваць, назву — толькі чытаць, а кошт запасаў — вылічваць формулай.

## 1. Усталюйце 0.3.0

Усталюйце стабільны выпуск з PyPI:

```bash
python -m pip install django-modelsheet==0.3.0
```

Пакет утрымлівае гатовыя JS/CSS. Для ўсталявання не патрэбныя Node.js, npm або CDN. Без уласнага праекта пачніце з [дэмапраекта](demo.md).

## 2. Дадайце праграму

```python title="settings.py"
INSTALLED_APPS += ["modelsheet"]
```

Зарэгіструйце мадэль праз `ModelSheetAdmin`, як паказана ніжэй. Спіс мадэляў у наладах не патрэбны.

=== "SQLite"

    Для бяспечнага запісу патрэбныя транзакцыі IMMEDIATE:

    ```python
    DATABASES["default"].setdefault("OPTIONS", {})
    DATABASES["default"]["OPTIONS"]["transaction_mode"] = "IMMEDIATE"
    ```

=== "PostgreSQL / MySQL"

    Пакет выкарыстоўвае злучэнне `default` і блакаванне радкоў у транзакцыі. Табліцы MySQL мусяць выкарыстоўваць InnoDB.

## 3. Зарэгіструйце Admin

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

Калі мадэль ужо зарэгістраваная, замяніце базавы клас існага Admin. Не рэгіструйце яе двойчы.

| Атрыбут | Прызначэнне |
| --- | --- |
| `sheet_fields` | Даступныя палі мадэлі |
| `sheet_editable` | Падмноства палёў для рэдагавання |
| `sheet_computed_fields` | Віртуальныя калонкі толькі для чытання: назва → формула |
| `search_fields` | Бачныя скалярныя палі для пошуку |

## 4. Выканайце міграцыі

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check
```

Міграцыі ствараюць здымкі прадстаўленняў і журнал аперацый. Бізнес-мадэлі не патрэбныя дадатковыя палі або базавы клас.

## 5. Адкрыйце табліцу

Увайдзіце як супер карыстальнік і націсніце **Spreadsheet** у спісе мадэлі або адкрыйце `/admin/shop/product/sheet/`. Змяніце цану, націсніце **Save** і перазагрузіце старонку. Для супрацоўнікаў наладзьце [правы](permissions.md).

Далей: [рэдагаванне](editing.md), [формулы](formulas.md), [масавыя аперацыі](bulk.md), [налады](configuration.md).
