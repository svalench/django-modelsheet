# Адаптары і інтэграцыя

Кампаненты задаюцца шляхамі класаў у `MODELSHEET` і ствараюцца без аргументаў.

```python
from modelsheet.adapters import SaveAdapter
from modelsheet.permissions import PermissionPolicy


class ProjectSaveAdapter(SaveAdapter):
    def validate(self, instance, request):
        super().validate(instance, request)
        # Дадайце праверкі праекта, можна ўзняць Django ValidationError.

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

## Інтэрфейсы

| Кампанент | Метады |
| --- | --- |
| `FieldAdapter` | `supported(field)`, `editable(field)`, `metadata(field)`, `serialize(field, instance)`, `parse(field, value)` |
| `SaveAdapter` | `validate(instance, request)`, `save(instance, fields, request)` |
| `PermissionPolicy` | `can_view_field(request, admin, name)`, `can_edit_field(request, admin, name)`, `can_view_object(request, admin, obj)`, `can_edit_object(request, admin, obj)` |

Палітыка дадаткова звужае стандартныя правы. Tenant- і row-scope-фільтры размяшчайце ў `ModelAdmin.get_queryset()`, каб абмежаваць таксама падлік і пагінацыю. Аб'ектныя метады не замяняюць фільтр запыту.

Адаптары не павінны самастойна фіксаваць транзакцыю, мяняць БД або давяраць назвам палёў ад кліента. Стандартная праверка выклікае `full_clean()`, захаванне — `save()`. Знешнія дзеянні плануйце праз `transaction.on_commit()` з уласнай ідэмпатэнтнасцю.

## Рэдактары палёў

Гатовы frontend падтрымлівае тэкст і choices. Уласны адаптар можа выкарыстоўваць гэты скалярны кантракт; новыя JS-элементы патрабуюць перазборкі frontend. Стандартны адаптар не рэдагуе FK/M2M.

## Транзакцыі і аўдыт

Пункты запісу выключаныя з `ATOMIC_REQUESTS` і адкрываюць кароткія транзакцыі. PostgreSQL/MySQL блакуюць свежыя радкі да параўнання адбітка; SQLite патрабуе IMMEDIATE. Занятасць БД або deadlock даюць паўтаральную памылку: паўтарыце зыходныя запыт і ключ.

Нязмененыя палі не прысвойваюцца з кліенцкага запыту. Звычайны `save()` дазваляе hooks праекта змяняць іншыя палі. Журнал утрымлівае яўна прысвоеныя палі і выніковыя значэнні, а не поўны аўдыт усіх эфектаў.

## Межы Admin

Успадкоўваюцца `get_queryset`, `readonly_fields`, правы, скалярныя `search_fields` і парадак звычайных палёў. Пошук па сувязях, уласныя list filters, парадак display-метадаў, формы, `save_model` і `save_related` не пераносяцца аўтаматычна. Недакладны пераход стану блакуецца, а не губляе ўмовы.

Гл. асобны кантракт [BackgroundAdapter](background.md).
