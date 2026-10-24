# Публікацыя пакета

## PyPI Trusted Publishing

Workflow публікацыі — `.github/workflows/workflow.yml`; `ci.yml` толькі правярае і не публікуе пакет.

Для першай публікацыі дадайце pending publisher у [PyPI Publishing](https://pypi.org/manage/account/publishing/):

| Поле | Значэнне |
| --- | --- |
| Назва праекта | `django-modelsheet` |
| GitHub owner | `svalench` |
| Repository | `django-modelsheet` |
| Імя файла workflow | `workflow.yml` |
| Environment | `pypi` |

Для існага праекта дадайце выдаўца ў яго Publishing-наладах. Pending publisher не рэзервуе назву. API token і GitHub secret не патрэбныя: заданне выкарыстоўвае OIDC, `id-token: write` і асяроддзе `pypi`.

Пасля захавання ў Actions выберыце **Publish to PyPI → Run workflow → main**. Без `publish` адбываецца толькі праверка зборкі; з ім — загрузка цяперашняй версіі. Спачатку збіраюцца frontend і wheel/sdist, выконваюцца серверныя, модульныя, браўзерныя праверкі і тэст усталявання; потым асобнае заданне загружае файлы.

Альтэрнатыва — GitHub Release з tag версіі, у тым ліку prerelease. Tag мусіць супадаць з `pyproject.toml`. Звычайны push не публікуе, ручная загрузка не з main забароненая. Загружаныя файлы версіі ў PyPI нельга замяніць: наступны выпуск патрабуе новай версіі.

## Праверкі суправаджальніка

1. Выканайце поўную матрыцу CI, браўзерныя, пакетныя і міграцыйныя праверкі.
2. Праверце ліцэнзіі залежнасцей і даступнасць назвы.
3. Абнавіце версію ў `pyproject.toml`, `modelsheet/__init__.py`, `frontend/package.json`, lockfile, changelog і нататках сумяшчальнасці.
4. Выканайце `npm ci && npm run build` у frontend, затым `python -m build` і `python -m twine check dist/*`; праверце статыку, шаблоны, пераклады і міграцыі.
5. Усталюйце wheel у чыстае асяроддзе, выканайце migrate/collectstatic і абнаўленне з папярэдняй версіі. Захоўвайце старыя міграцыі.
6. Пры дазволе на выпуск і настроеных уліковых даных загрузіце ў TestPyPI праз `python -m twine upload --repository testpypi dist/*`. Праверце ўсталяванне; залежнасці бярыце з асноўнага індэкса.
7. Пасля праверкі стварыце tag і апублікуйце PyPI праз Trusted Publishing або ўліковыя даныя суправаджальніка.

Лакальныя каманды зборкі нічога не загружаюць, не адпраўляюць у Git і не публікуюць. `python scripts/check_pypi_name.py` з адказам 404 паказвае даступнасць у той момант, а не рэзерваванне назвы.

[Афіцыйная інструкцыя PyPI](https://docs.pypi.org/trusted-publishers/adding-a-publisher/).
