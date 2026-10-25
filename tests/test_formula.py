import datetime as dt
import json
from decimal import Decimal
from pathlib import Path

import pytest

from modelsheet.formula import FormulaError, evaluate, parse

CASES = json.loads(Path(__file__).with_name("formula_cases.json").read_text())


def normalized(value):
    if isinstance(value, Decimal):
        return format(value.normalize(), "f")
    if isinstance(value, dt.date):
        return value.isoformat()
    return value


@pytest.mark.parametrize("case", CASES, ids=lambda c: c["formula"])
@pytest.mark.parametrize("cached", [False, True])
def test_shared_golden_cases(case, cached):
    from modelsheet.formula.engine import QueryAggregates

    def query(name):
        return [10, 20, None]

    def cell(start, end=None):
        return (
            [Decimal(10), Decimal(20)] if end else {"B1": Decimal(10), "$B$2": Decimal(20)}[start]
        )

    try:
        result = evaluate(
            parse(case["formula"]),
            fields={"price": "10.00", "stock": 3},
            cell=cell,
            column=lambda n: [10, 20, None],
            query=QueryAggregates(query) if cached else query,
            today=dt.date(2026, 10, 24),
        )
    except FormulaError as exc:
        assert exc.code == case.get("error")
    else:
        assert "error" not in case
        assert normalized(result) == case["value"]


def test_formula_budgets():
    with pytest.raises(FormulaError, match="long"):
        parse("=" + "1" * 501)
    with pytest.raises(FormulaError) as exc:
        evaluate(parse("=SUM(price)"), column=lambda n: list(range(100)), max_steps=10)
    assert exc.value.code == "#LIMIT!"
    with pytest.raises(FormulaError):
        parse("=" + "(" * 30 + "1" + ")" * 30)


def test_iferror_cannot_swallow_budget():
    with pytest.raises(FormulaError) as exc:
        evaluate(parse("=IFERROR(SUM(price),1)"), column=lambda n: list(range(100)), max_steps=10)
    assert exc.value.code == "#LIMIT!"


def test_cached_query_aggregates_preserve_values_errors_and_laziness(monkeypatch):
    from collections import Counter
    from modelsheet.formula import engine

    calls = Counter()
    original = engine.aggregate

    def counted(name, values):
        calls[name] += 1
        return original(name, values)

    monkeypatch.setattr(engine, "aggregate", counted)
    lookups = []

    def query(field):
        lookups.append(field)
        return [None, "", True, "text"] if field == "empty" else [10, "20", None, True, "text"]

    cached = engine.QueryAggregates(query)
    cases = [
        ("=QSUM([price])", Decimal(30)),
        ("=QAVG([price])", Decimal(15)),
        ("=QCOUNT([price])", Decimal(2)),
        ("=IFERROR(QAVG([empty]),7)", Decimal(7)),
        ("=IF(FALSE,QSUM([unused]),8)", Decimal(8)),
    ]
    for _ in range(3):
        for expression, expected in cases:
            assert evaluate(parse(expression), query=cached) == expected
    assert lookups == ["price", "empty"]
    assert calls == {"SUM": 1, "AVG": 2, "COUNT": 1}


def test_cached_query_aggregates_preserve_step_and_time_budgets():
    from modelsheet.formula.engine import QueryAggregates

    cached = QueryAggregates(lambda field: [10, 20, 30])
    assert evaluate(parse("=QSUM([price])"), query=cached) == 60
    for expression, options in [
        ("=IFERROR(QSUM([price]),0)", {"max_steps": 4}),
        ("=QSUM([price])+QSUM([price])", {"max_steps": 8}),
        ("=QSUM([price])", {"timeout_ms": -1}),
    ]:
        with pytest.raises(FormulaError) as exc:
            evaluate(parse(expression), query=cached, **options)
        assert exc.value.code == "#LIMIT!"
