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
<span class="ms-eyebrow">DJANGO ADMIN У ВЫГЛЯДЗЕ ТАБЛІЦЫ</span>

# Больш даных.<br>Менш руціны.

Рэдагуйце мадэлі як электронную табліцу: вылучайце дыяпазоны, ужывайце формулы і правярайце масавыя змены перад захаваннем.

<div class="ms-actions" markdown>
[Пачаць працу →](guide/quickstart.md){ .md-button .md-button--primary }
[Паспрабаваць дэма](playground.md){ .md-button }
</div>

<div class="ms-install"><span>$</span><code>pip install django-modelsheet==0.3.0</code></div>
<div class="ms-facts"><span>MIT · open source</span><span>Усталяванне без Node.js</span><span>0.3.0 · стабільная</span></div>
</div>

<div class="ms-preview" aria-label="Інтэрактыўны прыклад разліку цэн">
<div class="ms-window"><span class="ms-window-dots">● ● ●</span><span>shop / product / sheet</span><span class="ms-live">ПРЫКЛАД</span></div>
<div class="ms-sheet-title"><strong>Тавары</strong><span>3 запісы · лакальны буфер</span></div>
<div class="ms-formula"><span>fx</span><code id="demo-expression">=[price]*1.07</code></div>
<div class="ms-grid-scroll"><table class="ms-grid"><thead><tr><th></th><th>A <span>Назва</span></th><th>B <span>Цана</span></th><th>C <span>Вынік</span></th></tr></thead><tbody>
<tr><td>1</td><td>Керамічны кубак</td><td>1 200.00</td><td class="ms-selected" data-result="0">1 284.00</td></tr>
<tr><td>2</td><td>Ільняная торба</td><td>850.00</td><td class="ms-selected" data-result="1">909.50</td></tr>
<tr><td>3</td><td>Настольная лямпа</td><td>3 400.00</td><td class="ms-selected" data-result="2">3 638.00</td></tr>
</tbody></table></div>
<div class="ms-example-controls" aria-label="Выбраць прыклад формулы"><button type="button" data-example="markup" aria-pressed="true">Цана +7%</button><button type="button" data-example="discount" aria-pressed="false">Зніжка 10%</button><button type="button" data-example="round" aria-pressed="false">Акругленне</button></div>
<div class="ms-sheet-bottom"><span><i></i> Папярэдні прагляд · даныя не захоўваюцца</span><span>Decimal / 2 знакі</span></div>
</div>
</div>

<div class="ms-section-label">ЗНАЁМАЯ ТАБЛІЦА. ПРАВІЛЫ ВАШАГА ПРАЕКТА.</div>

<div class="ms-feature-grid" markdown>
<div class="ms-feature" markdown>
<span class="ms-feature-number">01 / РЭДАГАВАННЕ</span>

### Ад адной ячэйкі да дыяпазону

Устаўляйце даныя з Excel, запаўняйце ўніз, адмяняйце лакальныя праўкі. Захоўвайце ўвесь буфер адной кнопкай.

[Як працаваць з табліцай →](guide/editing.md)
</div>
<div class="ms-feature" markdown>
<span class="ms-feature-number">02 / ФОРМУЛЫ</span>

### Разлікі побач з данымі

`=[price]*1.07`, `IF`, `ROUND`, агрэгаты і вылічальныя калонкі. Сервер пералічвае вынік перад запісам.

[Прыклады формул →](guide/formulas.md)
</div>
<div class="ms-feature" markdown>
<span class="ms-feature-number">03 / МАСАВЫЯ АПЕРАЦЫІ</span>

### Спачатку ўбачыць, потым змяніць

Зафіксуйце набор запісаў, праверце першыя 50 вынікаў і пацвердзіце гатовы план. Сачыце за вынікам у гісторыі.

[Павысіць цэны на 7% →](guide/bulk.md)
</div>
</div>

<div class="ms-connect" markdown>
<div markdown>
<span class="ms-eyebrow">НЕКАЛЬКІ РАДКОЎ У ADMIN.PY</span>

## Вашы мадэлі.<br>Новы спосаб працы.

Без новых палёў мадэлі. З існымі сесіямі Admin, правамі Django і праверкай `full_clean()`.

[Поўны прыклад падключэння →](guide/quickstart.md)
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
### Падключаеце ўпершыню?

[Усталяванне](guide/quickstart.md) · [Дэмапраект](guide/demo.md) · [Налады](guide/configuration.md)
</div>
<div markdown>
### Інтэгруеце з праектам?

[Правы доступу](guide/permissions.md) · [Адаптары](extensions.md) · [HTTP API](api.md)
</div>
</div>

!!! info "Стабільны выпуск · 0.3.0"
    Усталюйце `django-modelsheet==0.3.0` з [PyPI](https://pypi.org/project/django-modelsheet/0.3.0/). Прачытайце [нататкі аб абнаўленні і абмежаванні](guide/releases.md).
