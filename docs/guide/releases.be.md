# Версія і абмежаванні

## 0.3.0a1 · 24 кастрычніка 2026

Першая адкрытая альфа аб'ядноўвае рэдагаванне дыяпазонаў, лакальны буфер, бяспечнае захаванне, формулы і масавыя аперацыі з папярэднім праглядам.

[Усталяваць з PyPI](https://pypi.org/project/django-modelsheet/0.3.0a1/){ .md-button .md-button--primary }
[GitHub Release](https://github.com/svalench/django-modelsheet/releases/tag/v0.3.0a1){ .md-button }

```bash
python -m pip install django-modelsheet==0.3.0a1
```

Уваходзяць яўная рэгістрацыя мадэляў, буфер абмену, запаўненне, адмена, Decimal-разлікі, серверныя запыты, выяўленне канфліктаў, нязменныя планы, аўдыт, ідэмпатэнтнасць і кантракт фонавага адаптара. Таксама гатовая статыка, дэма і MIT-ліцэнзія.

## Сумяшчальнасць

| Кампанент | Матрыца праекта |
| --- | --- |
| Django 5.2 | Python 3.11–3.14 |
| Django 6.0 / 6.1 | Python 3.12–3.14 |
| Базы даных | PostgreSQL, MySQL/InnoDB, SQLite |
| Усталяванне | wheel/sdist, без Node.js |

Праверце патрэбную камбінацыю ў [CI](https://github.com/svalench/django-modelsheet/actions/workflows/ci.yml); лакальныя праверкі і іх межы — у [справаздачы](../validation.md).

## Межы альфы

| Магчымасць | Цяперашнія паводзіны |
| --- | --- |
| Стварэнне / выдаленне | Стандартны Admin |
| FK | Дазволены паказ і фільтры, без рэдактара |
| M2M | Без рэдактара |
| Формулы | Аднаразовыя значэнні або віртуальныя калонкі |
| Адмена | Лакальны буфер да захавання |
| Імпарт / экспарт файлаў | Адкладзеныя; TSV-буфер даступны |
| Фонавая чарга | Адаптар праекта |
| Некалькі БД | Толькі `default` |
| Парадак вылічальных калонак | Не падтрымліваецца |

Серверная адмена, рэдактары сувязей, імпарт/экспарт, fast-save, пастаянныя формулы і курсорная пагінацыя — кірункі развіцця без абяцаных тэрмінаў.

[Зыходны код](https://github.com/svalench/django-modelsheet) · [Змены](https://github.com/svalench/django-modelsheet/blob/main/CHANGELOG.md) · [Удзел](https://github.com/svalench/django-modelsheet/blob/main/CONTRIBUTING.md) · [Бяспека](https://github.com/svalench/django-modelsheet/blob/main/SECURITY.md)
