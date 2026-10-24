# 五分钟安装

为已有的 `shop.Product` 模型添加表格：价格和库存可编辑，名称只读，库存金额通过公式计算。

## 1. 安装 Alpha 版

```bash
python -m pip install django-modelsheet==0.3.0a1
```

软件包包含编译后的 JS/CSS，无需 Node.js、npm 或 CDN。没有现成项目时，可先运行[演示项目](demo.md)。

## 2. 允许访问模型

```python title="settings.py"
INSTALLED_APPS += ["modelsheet"]
MODELSHEET = {"models": ["shop.Product"], "page_size": 200}
```

模型必须同时加入允许列表，并通过 `ModelSheetAdmin` 注册。

=== "SQLite"

    安全写入需要 IMMEDIATE 事务：

    ```python
    DATABASES["default"].setdefault("OPTIONS", {})
    DATABASES["default"]["OPTIONS"]["transaction_mode"] = "IMMEDIATE"
    ```

=== "PostgreSQL / MySQL"

    使用 `default` 连接和事务内行锁。MySQL 表必须使用 InnoDB。

## 3. 注册 Admin

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

已有注册时，修改现有 Admin 的基类，不要重复注册模型。

| 属性 | 用途 |
| --- | --- |
| `sheet_fields` | 表格中可用的模型字段 |
| `sheet_editable` | 可编辑字段的子集 |
| `sheet_computed_fields` | 只读虚拟列：名称 → 公式 |
| `search_fields` | 可见且允许搜索的标量字段 |

## 4. 执行迁移

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check
```

模型必须同时加入允许列表，并通过 `ModelSheetAdmin` 注册。

## 5. 打开表格

以超级用户登录，点击模型列表中的 **Spreadsheet**，或访问 `/admin/shop/product/sheet/`。修改价格并点击 **Save**，重新加载确认结果。普通员工需要配置[权限](permissions.md)。

接下来阅读：[编辑表格](editing.md)、[公式示例](formulas.md)、[批量操作](bulk.md)、[配置](configuration.md)。
