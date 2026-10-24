# Contributing to the docs

This site uses Material for MkDocs and GitHub Pages. It has exactly three languages: English (default), Simplified Chinese and Belarusian.

## Preview and build

```bash
python -m pip install -r requirements-docs.txt
mkdocs serve
```

Open `http://127.0.0.1:8000`. Configuration is in `mkdocs.yml`; content is in `docs/`; styles are in `docs/stylesheets/extra.css`.

```bash
mkdocs build --strict
```

Build output goes into ignored `site/`. Check links, mobile layouts, both themes and all language switches before publishing.

## Translation structure

English uses `page.md`, Chinese `page.zh.md`, Belarusian `page.be.md`. Every page must have all three versions; the coverage check rejects missing translations before building. Use neutral links such as `guide/quickstart.md` so the i18n plugin retains the selected language. Do not translate API identifiers, paths or formula function names.

The English site is at `/django-modelsheet/`, Chinese at `/django-modelsheet/zh/`, Belarusian at `/django-modelsheet/be/`. The language selector retains the current page. Navigation, theme controls and search UI are localized.

## Publishing

`.github/workflows/docs.yml` checks pull requests and deploys documentation changes on `main`. Manual dispatch is also available. Documentation deployment does not publish a Python package to PyPI.

Use each page's edit link to propose changes. Explain expected results and tested versions, and never include project secrets.

Tools: [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/), [MkDocs Static i18n](https://ultrabug.github.io/mkdocs-static-i18n/), [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
