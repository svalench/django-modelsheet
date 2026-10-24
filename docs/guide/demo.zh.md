# 演示项目

仓库包含商品、分类和订单模型。初始化命令创建 500 件商品，便于体验分页、筛选和批量操作。

## 本地运行

```bash
 git clone https://github.com/svalench/django-modelsheet.git
 cd django-modelsheet
 python -m venv .venv
 source .venv/bin/activate
 python -m pip install -e '.[test]'
 python manage.py migrate
 python manage.py seed_demo --create-user
 python manage.py runserver
```

Windows 使用 `.venv\Scripts\activate` 激活环境。打开 `http://127.0.0.1:8000/admin/shop/product/sheet/`。

!!! warning "仅供本地使用的账号"
    `--create-user` 会创建用户名和密码均为 `admin` 的账号。演示配置与账号仅用于本地开发。

仓库已包含静态资源。只有修改 frontend 时才需要重新构建：

```bash
cd frontend
npm ci
npm run build
```

## 三个体验场景

### 模型验证

将价格设为低于 `cost_price`，点击 **Save**。验证失败后，本地更改仍保留；修正价格后再次保存。

### 区域公式

在首个价格单元格输入 `=ROUND([price]*1.07,2)`，选中纵向区域，按 Ctrl/Cmd+D 向下填充，检查结果并保存。

### 与标准 Admin 的冲突

先在表格加载记录，再在另一标签页的标准 Admin 表单修改同一商品。保存表格更改时会因源数据变化而报告冲突，避免静默覆盖。重新加载并应用修改。详见[并发控制](permissions.md#concurrency)。
