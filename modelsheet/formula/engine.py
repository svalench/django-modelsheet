"""Small bounded spreadsheet language. No Python AST/eval or host object access."""

import datetime as dt
import re
import time
from decimal import Decimal, InvalidOperation, ROUND_HALF_EVEN, localcontext

TOKEN = re.compile(
    r"\s*(?:(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+)|"
    r'("(?:[^"]|"")*")|\[([A-Za-z_][A-Za-z_0-9]*)\]|'
    r"(\$?[A-Za-z]+\$?[1-9][0-9]*)|([A-Za-z_][A-Za-z_0-9]*)|"
    r"(<=|>=|<>|!=|[+\-*/^&=<>():,]))"
)
FUNCTIONS = {
    "IF",
    "IFERROR",
    "ROUND",
    "ABS",
    "MIN",
    "MAX",
    "SUM",
    "AVG",
    "COUNT",
    "UPPER",
    "LOWER",
    "CONCAT",
    "TODAY",
    "YEAR",
    "MONTH",
    "DAY",
    "ISNULL",
    "IFNULL",
    "COALESCE",
    "QSUM",
    "QAVG",
    "QCOUNT",
}


class FormulaError(Exception):
    def __init__(self, code, message="Invalid formula"):
        self.code = code
        super().__init__(message)


def parse(expression, max_length=500, max_depth=10):
    if not isinstance(expression, str) or len(expression) > max_length:
        raise FormulaError("#LIMIT!", "Expression is too long")
    source = expression[1:] if expression.startswith("=") else expression
    tokens, pos = [], 0
    while pos < len(source):
        if not source[pos:].strip():
            break
        match = TOKEN.match(source, pos)
        if not match:
            raise FormulaError("#NAME?", "Invalid token")
        index = next(i for i, value in enumerate(match.groups()) if value is not None)
        tokens.append((index, match.group(index + 1)))
        pos = match.end()
    tokens.append((5, "EOF"))
    cursor = 0

    def take():
        nonlocal cursor
        token = tokens[cursor]
        cursor += 1
        return token

    def expect(value):
        if take()[1] != value:
            raise FormulaError("#VALUE!", f"Expected {value}")

    def expr(minimum=0, depth=0):
        if depth > max_depth:
            raise FormulaError("#LIMIT!", "Expression is too deep")
        kind, value = take()
        if kind == 0:
            node = ["number", value]
        elif kind == 1:
            node = ["string", value[1:-1].replace('""', '"')]
        elif kind == 2:
            node = ["field", value]
        elif kind == 3:
            node = ["cell", value.upper()]
        elif kind == 4:
            upper = value.upper()
            if tokens[cursor][1] == "(":
                if upper not in FUNCTIONS:
                    raise FormulaError("#NAME?", "Unknown function")
                take()
                args = []
                if tokens[cursor][1] != ")":
                    while True:
                        args.append(expr(0, depth + 1))
                        if tokens[cursor][1] != ",":
                            break
                        take()
                expect(")")
                node = ["call", upper, args]
            elif upper in ("TRUE", "FALSE", "NULL"):
                node = ["literal", {"TRUE": True, "FALSE": False, "NULL": None}[upper]]
            else:
                node = ["column", value]
        elif value in ("+", "-"):
            node = ["unary", value, expr(40, depth + 1)]
        elif value == "(":
            node = expr(0, depth + 1)
            expect(")")
        else:
            raise FormulaError("#VALUE!", "Expected an expression")
        precedence = {
            "=": 10,
            "<>": 10,
            "!=": 10,
            "<": 10,
            ">": 10,
            "<=": 10,
            ">=": 10,
            "&": 15,
            "+": 20,
            "-": 20,
            "*": 30,
            "/": 30,
            "^": 40,
            ":": 50,
        }
        while tokens[cursor][1] in precedence and precedence[tokens[cursor][1]] >= minimum:
            op = take()[1]
            level = precedence[op]
            right = expr(level if op == "^" else level + 1, depth + 1)
            node = ["range" if op == ":" else "binary", op, node, right]
        return node

    try:
        result = expr()
        if tokens[cursor][1] != "EOF":
            raise FormulaError("#VALUE!", "Unexpected token")

        # Long left-associated chains also count towards the AST depth limit.
        def check(node, depth=0):
            if depth > max_depth:
                raise FormulaError("#LIMIT!", "Expression is too deep")
            for item in node[1:]:
                if isinstance(item, list):
                    if item and isinstance(item[0], list):
                        for child in item:
                            check(child, depth + 1)
                    elif item:
                        check(item, depth + 1)

        check(result)
        return result
    except (IndexError, RecursionError):
        raise FormulaError("#VALUE!", "Incomplete expression")


def references(node):
    result = {"fields": set(), "cells": set(), "columns": set(), "query": False}

    def walk(n):
        if n[0] in ("field", "cell", "column"):
            result[{"field": "fields", "cell": "cells", "column": "columns"}[n[0]]].add(n[1])
        elif n[0] == "call":
            result["query"] |= n[1].startswith("Q")
            for child in n[2]:
                walk(child)
        elif n[0] in ("binary", "range"):
            walk(n[2])
            walk(n[3])
        elif n[0] == "unary":
            walk(n[2])

    walk(node)
    return result


def number(value):
    if value is None:
        raise FormulaError("#N/A", "NULL is not a number")
    if isinstance(value, bool):
        return Decimal(int(value))
    if not isinstance(value, (int, float, Decimal, str)):
        raise FormulaError("#VALUE!")
    try:
        result = Decimal(str(value))
        if not result.is_finite():
            raise InvalidOperation()
        return result
    except InvalidOperation:
        raise FormulaError("#VALUE!", "Expected a number")


def evaluate(
    node,
    *,
    fields=None,
    cell=None,
    column=None,
    query=None,
    today=None,
    max_steps=10000,
    timeout_ms=250,
):
    fields = fields or {}
    deadline, steps = time.monotonic() + timeout_ms / 1000, 0

    def tick(amount=1):
        nonlocal steps
        steps += amount
        if steps > max_steps or time.monotonic() > deadline:
            raise FormulaError("#LIMIT!", "Formula budget exceeded")

    def arity(args, low, high=None):
        if len(args) < low or (high is not None and len(args) > high):
            raise FormulaError("#VALUE!", "Wrong number of arguments")

    def run(n):
        tick()
        kind = n[0]
        if kind == "number":
            return number(n[1])
        if kind in ("string", "literal"):
            return n[1]
        if kind == "field":
            if n[1] not in fields:
                raise FormulaError("#REF!", "Field is unavailable")
            return fields[n[1]]
        if kind == "column":
            if column is None:
                raise FormulaError("#REF!")
            return column(n[1])
        if kind == "cell":
            if cell is None:
                raise FormulaError("#REF!")
            return cell(n[1])
        if kind == "range":
            if n[2][0] != "cell" or n[3][0] != "cell" or cell is None:
                raise FormulaError("#REF!")
            values = cell(n[2][1], n[3][1])
            tick(len(values))
            return values
        if kind == "unary":
            return number(run(n[2])) * (-1 if n[1] == "-" else 1)
        if kind == "binary":
            op, left, right = n[1], run(n[2]), run(n[3])
            if op == "&":
                return text_value(left) + text_value(right)
            if op in ("=", "!=", "<>", "<", ">", "<=", ">="):
                if left is None or right is None:
                    if op == "=":
                        return left is right
                    if op in ("!=", "<>"):
                        return left is not right
                    raise FormulaError("#N/A")
                if isinstance(left, (int, Decimal, float)) or isinstance(
                    right, (int, Decimal, float)
                ):
                    left, right = number(left), number(right)
                return {
                    "=": lambda: left == right,
                    "!=": lambda: left != right,
                    "<>": lambda: left != right,
                    "<": lambda: left < right,
                    ">": lambda: left > right,
                    "<=": lambda: left <= right,
                    ">=": lambda: left >= right,
                }[op]()
            a, b = number(left), number(right)
            if op == "+":
                return a + b
            if op == "-":
                return a - b
            if op == "*":
                return a * b
            if op == "/":
                if not b:
                    raise FormulaError("#DIV/0!")
                return a / b
            if op == "^":
                if abs(b) > 100 or b != int(b):
                    raise FormulaError("#NUM!", "Integer exponent from -100 to 100 required")
                return a ** int(b)
        if kind != "call":
            raise FormulaError("#VALUE!")
        name, args = n[1], n[2]
        if name == "IF":
            arity(args, 3, 3)
            return run(args[1] if run(args[0]) else args[2])
        if name == "IFERROR":
            arity(args, 2, 2)
            try:
                return run(args[0])
            except FormulaError as exc:
                if exc.code == "#LIMIT!":
                    raise
                return run(args[1])
        if name in ("IFNULL", "COALESCE"):
            arity(args, 2, 2 if name == "IFNULL" else None)
            for arg in args:
                value = run(arg)
                if value is not None:
                    return value
            return None
        if name.startswith("Q"):
            arity(args, 1, 1)
            if query is None or args[0][0] != "field":
                raise FormulaError("#REF!", "Query aggregates require a bulk field reference")
            values = query(args[0][1])
            tick(len(values))
            return aggregate(name[1:], values)
        values = [run(arg) for arg in args]
        if name in ("SUM", "AVG", "COUNT", "MIN", "MAX"):
            arity(args, 1)
            flat = [v for item in values for v in (item if isinstance(item, list) else [item])]
            tick(len(flat))
            return aggregate(name, flat)
        if name == "TODAY":
            arity(args, 0, 0)
            return today or dt.datetime.now(dt.timezone.utc).date()
        if name in ("YEAR", "MONTH", "DAY"):
            arity(args, 1, 1)
            value = values[0]
            if not isinstance(value, dt.date):
                value = dt.date.fromisoformat(str(value)[:10])
            return Decimal(getattr(value, name.lower()))
        if name == "ISNULL":
            arity(args, 1, 1)
            return values[0] is None
        if name in ("UPPER", "LOWER"):
            arity(args, 1, 1)
            return getattr(text_value(values[0]), name.lower())()
        if name == "CONCAT":
            arity(args, 1)
            return "".join(text_value(v) for v in values)
        if name == "ABS":
            arity(args, 1, 1)
            return abs(number(values[0]))
        if name == "ROUND":
            arity(args, 1, 2)
            places = number(values[1]) if len(values) == 2 else Decimal(0)
            if abs(places) > 20 or places != int(places):
                raise FormulaError("#NUM!")
            return number(values[0]).quantize(
                Decimal(1).scaleb(-int(places)), rounding=ROUND_HALF_EVEN
            )
        raise FormulaError("#NAME?")

    try:
        with localcontext() as context:
            context.prec = 28
            result = run(node)
            if isinstance(result, Decimal) and (
                not result.is_finite() or abs(result.adjusted()) > 1000
            ):
                raise FormulaError("#NUM!")
            return result
    except FormulaError:
        raise
    except (ArithmeticError, TypeError, ValueError, OverflowError):
        raise FormulaError("#VALUE!", "Invalid operand")


def text_value(value):
    if value is None:
        return ""
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, dt.date):
        return value.isoformat()
    return str(value)


def aggregate(name, values):
    numbers = []
    for value in values:
        if value is None or value == "" or isinstance(value, bool):
            continue
        try:
            numbers.append(number(value))
        except FormulaError:
            continue
    if name == "COUNT":
        return Decimal(len(numbers))
    if name == "SUM":
        return sum(numbers, Decimal(0))
    if not numbers:
        raise FormulaError("#N/A")
    return {
        "AVG": lambda: sum(numbers) / len(numbers),
        "MIN": lambda: min(numbers),
        "MAX": lambda: max(numbers),
    }[name]()
