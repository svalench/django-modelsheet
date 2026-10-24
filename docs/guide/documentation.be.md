# Развіццё дакументацыі

Сайт выкарыстоўвае Material for MkDocs і GitHub Pages. Ёсць роўна тры мовы: англійская (асноўная), спрошчаная кітайская і беларуская.

## Прагляд і зборка

```bash
python -m pip install -r requirements-docs.txt
mkdocs serve
```

Адкрыйце `http://127.0.0.1:8000`. Налады ў `mkdocs.yml`, змест у `docs/`, стылі ў `docs/stylesheets/extra.css`.

```bash
mkdocs build --strict
```

Вынік трапляе ў ігнараваную папку `site/`. Перад публікацыяй праверце спасылкі, мабільную кампаноўку, абедзве тэмы і пераключэнне ўсіх моў.

## Структура перакладаў

Англійская — `page.md`, кітайская — `page.zh.md`, беларуская — `page.be.md`. Усе тры версіі абавязковыя; праверка пакрыцця адхіляе прапушчаныя пераклады да зборкі. Выкарыстоўвайце нейтральныя спасылкі кшталту `guide/quickstart.md`, каб плагін захоўваў мову. Не перакладайце ідэнтыфікатары API, шляхі і назвы функцый формул.

Англійская версія знаходзіцца ў `/django-modelsheet/`, кітайская ў `/django-modelsheet/zh/`, беларуская ў `/django-modelsheet/be/`. Выбар мовы захоўвае цяперашнюю старонку. Навігацыя, пераключальнікі тэмы і пошукавы інтэрфейс лакалізаваныя.

## Публікацыя

`.github/workflows/docs.yml` правярае pull request і публікуе змены дакументацыі з `main`. Даступны ручны запуск. Публікацыя сайта не выпускае Python-пакет у PyPI.

Спасылка рэдагавання вядзе да зыходнага файла. Апісвайце чаканы вынік і правераныя версіі, не дадавайце сакрэты праекта.

Інструменты: [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/), [MkDocs Static i18n](https://ultrabug.github.io/mkdocs-static-i18n/), [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
