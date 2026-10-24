---
template: home.html
hide:
  - navigation
  - toc
  - edit
  - footer
---

<div class="ms-hero" markdown>
<div class="ms-intro" markdown>
<span class="ms-eyebrow">DJANGO ADMIN, В ТАБЛИЧНОМ ВИДЕ</span>

# Много данных.<br>Меньше рутины.

Редактируйте модели как электронную таблицу: выделяйте диапазоны, используйте формулы и проверяйте массовые изменения перед сохранением.

<div class="ms-actions" markdown>
[Начать работу →](guide/quickstart.md){ .md-button .md-button--primary }
[Смотреть примеры](guide/formulas.md){ .md-button }
</div>

<div class="ms-install"><span>$</span><code>pip install django-modelsheet==0.3.0a1</code></div>
<div class="ms-facts"><span>MIT · open source</span><span>Без Node.js при установке</span><span>0.3.0a1 · alpha</span></div>
</div>

<div class="ms-preview" aria-label="Интерактивный пример расчёта цен">
<div class="ms-window"><span class="ms-window-dots">● ● ●</span><span>shop / product / sheet</span><span class="ms-live">ПРИМЕР</span></div>
<div class="ms-sheet-title"><strong>Товары</strong><span>3 записи · локальный буфер</span></div>
<div class="ms-formula"><span>fx</span><code id="demo-expression">=[price]*1.07</code></div>
<div class="ms-grid-scroll"><table class="ms-grid"><thead><tr><th></th><th>A <span>Название</span></th><th>B <span>Цена</span></th><th>C <span>Результат</span></th></tr></thead><tbody>
<tr><td>1</td><td>Керамическая чашка</td><td>1 200.00</td><td class="ms-selected" data-result="0">1 284.00</td></tr>
<tr><td>2</td><td>Льняной шоппер</td><td>850.00</td><td class="ms-selected" data-result="1">909.50</td></tr>
<tr><td>3</td><td>Настольная лампа</td><td>3 400.00</td><td class="ms-selected" data-result="2">3 638.00</td></tr>
</tbody></table></div>
<div class="ms-example-controls" aria-label="Выбрать пример формулы"><button type="button" data-example="markup" aria-pressed="true">+7% к цене</button><button type="button" data-example="discount" aria-pressed="false">Скидка 10%</button><button type="button" data-example="round" aria-pressed="false">Округление</button></div>
<div class="ms-sheet-bottom"><span><i></i> Предпросмотр · данные не сохраняются</span><span>Decimal / 2 знака</span></div>
</div>
</div>

<div class="ms-section-label">ЗНАКОМАЯ ТАБЛИЦА. ПРАВИЛА ВАШЕГО ПРОЕКТА.</div>

<div class="ms-feature-grid" markdown>
<div class="ms-feature" markdown>
<span class="ms-feature-number">01 / РЕДАКТИРОВАНИЕ</span>

### От одной ячейки до диапазона

Вставляйте данные из Excel, заполняйте вниз, отменяйте локальные правки. Сохраняйте весь буфер одной кнопкой.

[Как работать с таблицей →](guide/editing.md)
</div>
<div class="ms-feature" markdown>
<span class="ms-feature-number">02 / ФОРМУЛЫ</span>

### Расчёты рядом с данными

`=[price]*1.07`, `IF`, `ROUND`, агрегаты и виртуальные колонки. Сервер пересчитывает результат перед записью.

[Рецепты формул →](guide/formulas.md)
</div>
<div class="ms-feature" markdown>
<span class="ms-feature-number">03 / МАССОВЫЕ ОПЕРАЦИИ</span>

### Сначала увидеть, потом изменить

Зафиксируйте набор записей, проверьте первые 50 результатов и подтвердите готовый план. Следите за результатом в истории.

[Изменить цены на 7% →](guide/bulk.md)
</div>
</div>

<div class="ms-connect" markdown>
<div markdown>
<span class="ms-eyebrow">НЕСКОЛЬКО СТРОК В ADMIN.PY</span>

## Ваши модели.<br>Новый способ работы.

Без новых полей в модели. С существующими сессиями Admin, правами Django и валидацией `full_clean()`.

[Полный пример подключения →](guide/quickstart.md)
</div>
<div markdown>
```python title="shop/admin.py"
@admin.register(Product)
class ProductAdmin(ModelSheetAdmin):
    sheet_fields = ("name", "price", "stock")
    sheet_editable = ("price", "stock")
    sheet_computed_fields = {
        "inventory_value": "=[price]*[stock]",
    }
```
</div>
</div>

<div class="ms-route-grid" markdown>
<div markdown>
### Подключаете впервые?

[Установка](guide/quickstart.md) · [Демопроект](guide/demo.md) · [Настройки](guide/configuration.md)
</div>
<div markdown>
### Интегрируете с проектом?

[Права доступа](guide/permissions.md) · [Адаптеры](extensions.md) · [HTTP API](api.md)
</div>
</div>

!!! info "Открытая альфа · 0.3.0a1"
    Пакет уже доступен в [PyPI](https://pypi.org/project/django-modelsheet/0.3.0a1/). Создание и удаление записей остаются в стандартном Admin. Перед внедрением изучите [ограничения версии](guide/releases.md) и проверьте интеграцию на своих моделях.
