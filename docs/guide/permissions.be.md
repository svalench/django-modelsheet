# Правы і цэласнасць

Правы Django, метады Admin і правы палёў дзейнічаюць і ў інтэрфейсе, і ў прамых JSON-запытах.

## Умовы доступу

Для адкрыцця патрэбны актыўны staff-карыстальнік, `modelsheet.open`, права мадэлі `view` і дазвол `ModelAdmin.has_view_permission()`. Для рэдагавання таксама патрэбныя `change`, `has_change_permission()` і права поля. Суперкарыстальнік адразу мае доступ да яўна дазволеных і зарэгістраваных мадэляў.

## Неабавязковыя ролевыя групы

```bash
python manage.py modelsheet_roles
```

Ідэмпатэнтная каманда стварае групы, але не прызначае карыстальнікаў. Прызначце групу праз Admin і ўключыце `is_staff`.

| Група | Магчымасці |
| --- | --- |
| ModelSheet Viewer | Чытанне табліц |
| ModelSheet Editor | Чытанне і рэдагаванне |
| ModelSheet Operator | Рэдагаванне, масавыя аперацыі і гісторыя |
| ModelSheet Auditor | Чытанне і гісторыя |
| ModelSheet Admin | Магчымасці пакета, без статусу superuser |

Шаблоны дазваляюць настроеныя палі. Перад прызначэннем праверце адчувальныя калонкі. Паўтор дадае дазволы, не выдаляючы праектныя.

## Палі і вобласць радкоў

```text
modelsheet.view_field_shop_product_price
modelsheet.edit_field_shop_product_price
modelsheet.bulk_shop_product
modelsheet.history_shop_product
```

Правы поля не даюць права рэдагаваць мадэль. Схаваныя палі недаступныя для пошуку, фільтраў, парадку, формул і гісторыі. Уласная `PermissionPolicy` дадаткова звужае доступ.

Для абмежавання радкоў або tenant выкарыстоўвайце `get_queryset()`, каб абмежаваць таксама падлік і пагінацыю:

```python title="Прыклад мадэлі з owner, title і status"
class DocumentAdmin(ModelSheetAdmin):
    sheet_fields = ("title", "status")
    sheet_editable = ("status",)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if request.user.is_superuser:
            return queryset
        return queryset.filter(owner=request.user)
```

Дэмамадэль Product не мае `owner`; адаптуйце прыклад да сваёй мадэлі.

## Канкурэнтныя змены { #concurrency }

Загружаны радок мае падпісаны адбітак значэнняў канкрэтных палёў. Сервер перачытвае і блакуе радкі, параўноўвае адбіткі ў транзакцыі запісу. Формулы правяраюць таксама зыходныя залежнасці. Змена праз іншую форму Admin або API дае канфлікт замест ціхага перазапісу.

PostgreSQL/MySQL блакуюць радкі. SQLite патрабуе `transaction_mode="IMMEDIATE"` і кароткіх транзакцый. Звычайныя захаванні атамарныя, фонавыя аперацыі могуць завяршыцца часткова. Адбіткі не адсочваюць усе прамежкавыя станы або адвольныя змены звязаных табліц.

## Логіка захавання

Стандартны адаптар выклікае `full_clean()` і `instance.save()`, у тым ліку сігналы. Уласныя формы Admin, `save_model()` і `save_related()` патрабуюць [SaveAdapter](../extensions.md). Знешнім эфектам патрэбная ўласная ідэмпатэнтнасць. Змены мадэлі і журнал павінны выкарыстоўваць адну БД `default`.
