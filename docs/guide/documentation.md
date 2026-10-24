# Разработка документации

Этот сайт собирается из Markdown в репозитории с помощью Material for MkDocs и публикуется на GitHub Pages.

## Локальный просмотр

```bash
python -m pip install -r requirements-docs.txt
mkdocs serve
```

Откройте `http://127.0.0.1:8000`. Навигация и настройки темы находятся в `mkdocs.yml`, страницы — в `docs/`, стили — в `docs/stylesheets/extra.css`.

## Проверка сборки

```bash
mkdocs build --strict
```

Готовый сайт появится в `site/`; эта папка не коммитится. Сборка проверяет ссылки и предупреждения. Перед публикацией проверьте изменённые страницы в светлой/тёмной теме и на узком экране.

## Автоматическая публикация

Workflow `.github/workflows/docs.yml` проверяет документацию в pull request. После изменений документации в `main` он собирает и публикует сайт через GitHub Actions. Можно также запустить его вручную.

Сборка документации не выпускает новую версию Python-пакета и не запускает публикацию в PyPI.

## Как предложить улучшение

Кнопка редактирования на странице ведёт к исходному Markdown в GitHub. Сопровождайте примеры описанием ожидаемого результата, называйте версию, для которой проверено поведение, и не публикуйте в документации секреты проекта.

Основные инструменты: [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) и [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
