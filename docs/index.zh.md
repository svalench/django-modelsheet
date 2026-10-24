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
<span class="ms-eyebrow">让 DJANGO ADMIN 化身电子表格</span>

# 更多数据。<br>更少重复劳动。

像操作电子表格一样编辑模型：选择区域、使用公式，并在保存前预览批量更改。

<div class="ms-actions" markdown>
[开始使用 →](guide/quickstart.md){ .md-button .md-button--primary }
[查看示例](guide/formulas.md){ .md-button }
</div>

<div class="ms-install"><span>$</span><code>pip install django-modelsheet==0.3.0a1</code></div>
<div class="ms-facts"><span>MIT · open source</span><span>安装无需 Node.js</span><span>0.3.0a1 · alpha</span></div>
</div>

<div class="ms-preview" aria-label="交互式价格计算示例">
<div class="ms-window"><span class="ms-window-dots">● ● ●</span><span>shop / product / sheet</span><span class="ms-live">示例</span></div>
<div class="ms-sheet-title"><strong>商品</strong><span>3 条记录 · 本地缓冲区</span></div>
<div class="ms-formula"><span>fx</span><code id="demo-expression">=[price]*1.07</code></div>
<div class="ms-grid-scroll"><table class="ms-grid"><thead><tr><th></th><th>A <span>名称</span></th><th>B <span>价格</span></th><th>C <span>结果</span></th></tr></thead><tbody>
<tr><td>1</td><td>陶瓷杯</td><td>1 200.00</td><td class="ms-selected" data-result="0">1 284.00</td></tr>
<tr><td>2</td><td>亚麻购物袋</td><td>850.00</td><td class="ms-selected" data-result="1">909.50</td></tr>
<tr><td>3</td><td>台灯</td><td>3 400.00</td><td class="ms-selected" data-result="2">3 638.00</td></tr>
</tbody></table></div>
<div class="ms-example-controls" aria-label="选择公式示例"><button type="button" data-example="markup" aria-pressed="true">价格 +7%</button><button type="button" data-example="discount" aria-pressed="false">九折优惠</button><button type="button" data-example="round" aria-pressed="false">舍入</button></div>
<div class="ms-sheet-bottom"><span><i></i> 仅供预览 · 不保存数据</span><span>Decimal / 2 位小数</span></div>
</div>
</div>

<div class="ms-section-label">熟悉的表格，遵循您项目的规则。</div>

<div class="ms-feature-grid" markdown>
<div class="ms-feature" markdown>
<span class="ms-feature-number">01 / 编辑</span>

### 从单元格到整片区域

从 Excel 粘贴、向下填充、撤销本地编辑，一键保存全部待处理更改。

[表格操作指南 →](guide/editing.md)
</div>
<div class="ms-feature" markdown>
<span class="ms-feature-number">02 / 公式</span>

### 在数据旁完成计算

支持 `=[price]*1.07`、`IF`、`ROUND`、聚合与计算列。服务器会在写入前重新计算结果。

[公式示例 →](guide/formulas.md)
</div>
<div class="ms-feature" markdown>
<span class="ms-feature-number">03 / 批量操作</span>

### 先预览，再应用

固定记录集合，检查前 50 条结果，再确认已生成的计划。可在历史记录中跟踪执行结果。

[将价格提高 7% →](guide/bulk.md)
</div>
</div>

<div class="ms-connect" markdown>
<div markdown>
<span class="ms-eyebrow">只需在 ADMIN.PY 中添加几行</span>

## 您的模型。<br>全新的操作方式。

无需新增模型字段。复用 Admin 会话、Django 权限和 `full_clean()` 验证。

[完整接入示例 →](guide/quickstart.md)
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
### 首次使用？

[安装](guide/quickstart.md) · [演示项目](guide/demo.md) · [配置](guide/configuration.md)
</div>
<div markdown>
### 集成到现有项目？

[权限](guide/permissions.md) · [适配器](extensions.md) · [HTTP API](api.md)
</div>
</div>

!!! info "公开 Alpha 版 · 0.3.0a1"
    软件包已发布至 [PyPI](https://pypi.org/project/django-modelsheet/0.3.0a1/). 创建和删除记录仍通过标准 Admin 完成。正式使用前，请阅读 [版本限制](guide/releases.md) ，并在自己的模型上验证集成效果。
