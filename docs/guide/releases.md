# Версия и ограничения

## 0.3.0a1 · 24 октября 2026

Первая публичная альфа объединяет основные этапы v0.1–v0.3: редактирование диапазонов, локальный буфер, безопасное сохранение, формулы и массовые операции с предпросмотром.

[Установить из PyPI](https://pypi.org/project/django-modelsheet/0.3.0a1/){ .md-button .md-button--primary }
[GitHub Release](https://github.com/svalench/django-modelsheet/releases/tag/v0.3.0a1){ .md-button }

```bash
python -m pip install django-modelsheet==0.3.0a1
```

## Что входит

- Табличный режим явно разрешённых моделей Django Admin.
- Вставка диапазонов, Fill Down, локальные undo/redo и сохранение.
- Decimal-формулы, виртуальные колонки и серверный пересчёт.
- Серверные поиск, AND/OR-фильтры и сортировка.
- Защита от конкурентной перезаписи и атомарное сохранение.
- Неизменяемые планы массовых операций, аудит и идемпотентность.
- Контракт фонового адаптера, отмена и продолжение.
- Готовая статика, демопроект и MIT-лицензия.

## Совместимость

| Компонент | Матрица проекта |
| --- | --- |
| Django 5.2 | Python 3.11–3.14 |
| Django 6.0 / 6.1 | Python 3.12–3.14 |
| Базы данных | PostgreSQL, MySQL/InnoDB, SQLite |
| Установка | Python wheel/sdist, без Node.js |

Проверяйте результат нужной комбинации в [GitHub Actions](https://github.com/svalench/django-modelsheet/actions/workflows/ci.yml). Детали локальных проверок и их границы приведены в [отчёте](../validation.md).

## Границы альфы

| Возможность | Текущее поведение |
| --- | --- |
| Создание и удаление | Через стандартный Admin |
| FK | Разрешённые отображение и фильтрация; без редактора |
| M2M | Редактор отсутствует |
| Формулы | Однократная запись результата или виртуальная колонка |
| Undo | Только локальный буфер до сохранения |
| Импорт/экспорт файлов | Не входит; TSV clipboard доступен |
| Фоновая очередь | Подключается адаптером проекта |
| Несколько БД | Операция только в `default` |
| Сортировка виртуальных колонок | Не поддерживается |

## Развитие проекта

Для следующих версий отложены серверный undo, FK/M2M-редактирование, импорт/экспорт, fast-save, постоянные формулы и курсорная пагинация. Это направления развития, а не обещание сроков.

[Исходный код](https://github.com/svalench/django-modelsheet) · [Changelog](https://github.com/svalench/django-modelsheet/blob/main/CHANGELOG.md) · [CONTRIBUTING](https://github.com/svalench/django-modelsheet/blob/main/CONTRIBUTING.md) · [SECURITY](https://github.com/svalench/django-modelsheet/blob/main/SECURITY.md)
