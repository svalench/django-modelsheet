# Працэдура выпуску

Працэдура датычыцца стабільных выпускаў, пачынаючы з **0.3.0**. Стварайце тэг,
GitHub Release і ўключайце параметр публікацыі толькі пасля дазволу на выпуск.

## Лакальная праверка

1. Захавайце ўсе змены. Узгадніце версіі ў `pyproject.toml`, `modelsheet/__init__.py`,
   `frontend/package.json` і двух каранёвых запісах `frontend/package-lock.json`.
   Выканайце `python scripts/check_release.py --stable --tag v0.3.0`.
2. Выканайце `python manage.py check`, `python manage.py makemigrations --check --dry-run`,
   `python -m ruff check .` і `python -m pytest -q`.
3. У `frontend` выканайце `npm ci`, `npm test`, `npm run build`, `npm run build:demo`,
   `npx playwright install chromium` і `npm run test:e2e`. Уключыце абноўленыя рэсурсы ў каміт.
4. Усталюйце `requirements-docs.txt`, выканайце `python scripts/check_docs_locales.py`,
   `mkdocs build --strict`, затым `npm run test:demo` у `frontend`.
5. Збярыце пакет у пусты каталог: `python -m build --outdir /tmp/modelsheet-030-dist`.
   Праверце `python -m twine check /tmp/modelsheet-030-dist/*`.
6. Выканайце `python scripts/package_smoke.py --wheel /tmp/modelsheet-030-dist/django_modelsheet-0.3.0-py3-none-any.whl`
   і паўтарыце з `--upgrade-from 0.3.0a2`. Можна перадаць шлях да старога wheel.
   Праверка працуе па-за рэпазіторыем: міграцыі, статыка, захаванне гісторыі, элементаў і здымкаў.
   Віртуальнае асяроддзе выкарыстоўвае сістэмныя залежнасці, а не правярае іх новую загрузку.

Захавайце `0001` і дадайце `0002_operation_preview_expires_at`. Перад абнаўленнем зрабіце
рэзервовую копію БД і прыпыніце запіс ды фонавых выканаўцаў. Усталюйце пакет, выканайце
міграцыі і collectstatic, перазапусціце праграму і перазагрузіце ўкладкі. Старыя непацверджаныя
планы патрабуюць новага прагляду; пацверджаныя аперацыі можна працягнуць.
Гл. [нататкі аб абнаўленні](guide/releases.md) і [вынікі праверак](validation.md).

## CI і публікацыя

Паўторна выкарыстальны `ci.yml` правярае ўсе 16 спалучэнняў Python/Django/БД,
тэсты frontend і браўзера, wheel/sdist, чыстую ўстаноўку і абнаўленне з 0.3.0a2.
Ён выклікае `docs-checks.yml`: лакалі, строгая зборка дакументацыі, актуальнасць
рэсурсаў і тэсты пляцоўкі. Гэтыя працэсы нічога не публікуюць.

`workflow.yml` правярае стабільныя версіі і тэг, затым запускае поўны CI для таго ж
каміта. Публікацыя залежыць ад усіх праверак і выкарыстоўвае толькі правераны артэфакт
`pypi-distributions`. Зялёны CI для старога каміта не пацвярджае гатоўнасць новага.

Пасля дазволу запусціце **Publish to PyPI** на `main`: выключаны `publish` азначае
толькі праверку; уключаны — загрузку. Публікацыя GitHub Release `v0.3.0` запускае тыя ж
праверкі і загрузку. Звычайны push не публікуе пакет. Версію ў PyPI нельга замяніць.

## Trusted Publishing

Для праекта `django-modelsheet` наладзьце выдаўца: рэпазіторый
`svalench/django-modelsheet`, файл `workflow.yml`, асяроддзе `pypi`.
Выкарыстоўваецца OIDC з `id-token: write` толькі ў задачы публікацыі; токен PyPI не патрэбны.
[Інструкцыя PyPI](https://docs.pypi.org/trusted-publishers/adding-a-publisher/).
Лакальныя праверкі не выконваюць загрузку, стварэнне тэгаў або push.
