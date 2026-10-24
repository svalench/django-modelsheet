# 参与文档维护

网站使用 Material for MkDocs 与 GitHub Pages，仅提供英语（默认）、简体中文和白俄罗斯语。

## 预览与构建

```bash
python -m pip install -r requirements-docs.txt
mkdocs serve
```

打开 `http://127.0.0.1:8000`。配置位于 `mkdocs.yml`，内容位于 `docs/`，样式位于 `docs/stylesheets/extra.css`。

```bash
mkdocs build --strict
```

输出写入已忽略的 `site/`。发布前检查链接、移动布局、两种主题和所有语言切换。

## 翻译结构

英语为 `page.md`，中文为 `page.zh.md`，白俄罗斯语为 `page.be.md`。每页必须有三种语言版本；构建前的覆盖检查会拒绝缺失翻译。链接使用中性路径，如 `guide/quickstart.md`，插件会保持当前语言。API 标识符、路径和公式函数名不要翻译。

英语站点在 `/django-modelsheet/`，中文在 `/django-modelsheet/zh/`，白俄罗斯语在 `/django-modelsheet/be/`。语言选择器保留当前页面，导航、主题控件和搜索界面均已本地化。

## 发布

`.github/workflows/docs.yml` 检查 pull request，并在 `main` 文档变化后发布。也支持手动运行。文档部署不会向 PyPI 发布 Python 软件包。

使用页面编辑链接提出修改，说明预期结果和验证版本，勿包含项目密钥。

工具：[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/)、[MkDocs Static i18n](https://ultrabug.github.io/mkdocs-static-i18n/)、[GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
