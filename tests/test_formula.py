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
def test_shared_golden_cases(case):
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
            query=lambda n: [10, 20, None],
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
