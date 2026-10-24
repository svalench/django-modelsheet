import Decimal from 'decimal.js';

Decimal.set({precision: 28, rounding: Decimal.ROUND_HALF_EVEN});
export type AST = any[];
export class FormulaError extends Error {
  constructor(public code: string, message = 'Invalid formula') { super(message); }
}
const functions = new Set('IF IFERROR ROUND ABS MIN MAX SUM AVG COUNT UPPER LOWER CONCAT TODAY YEAR MONTH DAY ISNULL IFNULL COALESCE QSUM QAVG QCOUNT'.split(' '));
const pattern = /\s*(?:(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+)|("(?:[^"]|"")*")|\[([A-Za-z_][A-Za-z_0-9]*)\]|(\$?[A-Za-z]+\$?[1-9][0-9]*)|([A-Za-z_][A-Za-z_0-9]*)|(<=|>=|<>|!=|[+\-*/^&=<>():,]))/y;

export function parse(expression: string, maxLength = 500, maxDepth = 10): AST {
  if (typeof expression !== 'string' || expression.length > maxLength) throw new FormulaError('#LIMIT!');
  const source = expression.startsWith('=') ? expression.slice(1) : expression;
  const tokens: [number, string][] = [];
  let offset = 0;
  while (offset < source.length) {
    if (!source.slice(offset).trim()) break;
    pattern.lastIndex = offset;
    const match = pattern.exec(source);
    if (!match) throw new FormulaError('#NAME?', 'Invalid token');
    const kind = match.slice(1).findIndex(value => value !== undefined);
    tokens.push([kind, match[kind + 1]]);
    offset = pattern.lastIndex;
  }
  tokens.push([5, 'EOF']);
  let cursor = 0;
  const take = () => {
    if (!tokens[cursor]) throw new FormulaError('#VALUE!');
    return tokens[cursor++];
  };
  const expect = (value: string) => { if (take()[1] !== value) throw new FormulaError('#VALUE!'); };
  const expr = (minimum = 0, depth = 0): AST => {
    if (depth > maxDepth) throw new FormulaError('#LIMIT!');
    const [kind, value] = take();
    let node: AST;
    if (kind === 0) node = ['number', value];
    else if (kind === 1) node = ['string', value.slice(1, -1).replaceAll('""', '"')];
    else if (kind === 2) node = ['field', value];
    else if (kind === 3) node = ['cell', value.toUpperCase()];
    else if (kind === 4) {
      const name = value.toUpperCase();
      if (tokens[cursor]?.[1] === '(') {
        if (!functions.has(name)) throw new FormulaError('#NAME?');
        take();
        const args: AST[] = [];
        if (tokens[cursor]?.[1] !== ')') {
          while (true) {
            args.push(expr(0, depth + 1));
            if (tokens[cursor]?.[1] !== ',') break;
            take();
          }
        }
        expect(')');
        node = ['call', name, args];
      } else if (['TRUE', 'FALSE', 'NULL'].includes(name)) {
        node = ['literal', name === 'NULL' ? null : name === 'TRUE'];
      } else node = ['column', value];
    } else if (['+', '-'].includes(value)) node = ['unary', value, expr(40, depth + 1)];
    else if (value === '(') { node = expr(0, depth + 1); expect(')'); }
    else throw new FormulaError('#VALUE!');
    const precedence: Record<string, number> = {'=':10, '<>':10, '!=':10, '<':10, '>':10, '<=':10, '>=':10, '&':15, '+':20, '-':20, '*':30, '/':30, '^':40, ':':50};
    while (tokens[cursor]?.[1] in precedence && precedence[tokens[cursor][1]] >= minimum) {
      const op = take()[1], level = precedence[op];
      node = [op === ':' ? 'range' : 'binary', op, node, expr(op === '^' ? level : level + 1, depth + 1)];
    }
    return node;
  };
  const result = expr();
  if (tokens[cursor]?.[1] !== 'EOF') throw new FormulaError('#VALUE!');
  const check = (node: AST, depth = 0) => {
    if (depth > maxDepth) throw new FormulaError('#LIMIT!');
    if (node[0] === 'call') node[2].forEach((n: AST) => check(n, depth + 1));
    if (['binary', 'range'].includes(node[0])) { check(node[2], depth + 1); check(node[3], depth + 1); }
    if (node[0] === 'unary') check(node[2], depth + 1);
  };
  check(result);
  return result;
}

export function references(node: AST) {
  const result = {fields: new Set<string>(), cells: new Set<string>(), columns: new Set<string>(), query: false};
  const walk = (n: AST) => {
    if (n[0] === 'field') result.fields.add(n[1]);
    else if (n[0] === 'cell') result.cells.add(n[1]);
    else if (n[0] === 'column') result.columns.add(n[1]);
    else if (n[0] === 'call') { result.query ||= n[1].startsWith('Q'); n[2].forEach(walk); }
    else if (['binary', 'range'].includes(n[0])) { walk(n[2]); walk(n[3]); }
    else if (n[0] === 'unary') walk(n[2]);
  };
  walk(node);
  return result;
}

export function number(value: any): Decimal {
  if (value === null || value === undefined) throw new FormulaError('#N/A');
  try {
    if (typeof value === 'boolean') value = value ? 1 : 0;
    if (!['string', 'number'].includes(typeof value) && !Decimal.isDecimal(value)) throw new Error();
    const result = new Decimal(value);
    if (!result.isFinite()) throw new Error();
    return result;
  } catch { throw new FormulaError('#VALUE!'); }
}
function text(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value);
}
function aggregate(name: string, values: any[]) {
  const numbers: Decimal[] = [];
  for (const value of values) {
    if (value === null || value === '' || typeof value === 'boolean') continue;
    try { numbers.push(number(value)); } catch { /* Text cells do not contribute. */ }
  }
  if (name === 'COUNT') return new Decimal(numbers.length);
  const sum = () => numbers.reduce((a, b) => a.plus(b), new Decimal(0));
  if (name === 'SUM') return sum();
  if (!numbers.length) throw new FormulaError('#N/A');
  if (name === 'AVG') return sum().div(numbers.length);
  return name === 'MIN' ? Decimal.min(...numbers) : Decimal.max(...numbers);
}
export interface EvaluationContext {
  fields?: Record<string, any>;
  cell?: (start: string, end?: string) => any;
  column?: (name: string) => any[];
  query?: (name: string) => any[];
  today?: string;
  maxSteps?: number;
  timeoutMs?: number;
}
export function evaluate(node: AST, context: EvaluationContext = {}): any {
  let steps = 0;
  const deadline = performance.now() + (context.timeoutMs ?? 250);
  const tick = (amount = 1) => {
    steps += amount;
    if (steps > (context.maxSteps ?? 10000) || performance.now() > deadline) throw new FormulaError('#LIMIT!');
  };
  const arity = (args: AST[], low: number, high = Infinity) => {
    if (args.length < low || args.length > high) throw new FormulaError('#VALUE!');
  };
  const run = (n: AST): any => {
    tick();
    const kind = n[0];
    if (kind === 'number') return number(n[1]);
    if (kind === 'string' || kind === 'literal') return n[1];
    if (kind === 'field') {
      if (!Object.hasOwn(context.fields ?? {}, n[1])) throw new FormulaError('#REF!');
      return context.fields![n[1]];
    }
    if (kind === 'column') { if (!context.column) throw new FormulaError('#REF!'); return context.column(n[1]); }
    if (kind === 'cell') { if (!context.cell) throw new FormulaError('#REF!'); return context.cell(n[1]); }
    if (kind === 'range') {
      if (n[2][0] !== 'cell' || n[3][0] !== 'cell' || !context.cell) throw new FormulaError('#REF!');
      const values = context.cell(n[2][1], n[3][1]); tick(values.length); return values;
    }
    if (kind === 'unary') return number(run(n[2])).times(n[1] === '-' ? -1 : 1);
    if (kind === 'binary') {
      const op = n[1];
      let a = run(n[2]), b = run(n[3]);
      if (op === '&') return text(a) + text(b);
      if (['=', '!=', '<>', '<', '>', '<=', '>='].includes(op)) {
        if (a === null || b === null) {
          if (op === '=') return a === b;
          if (op === '!=' || op === '<>') return a !== b;
          throw new FormulaError('#N/A');
        }
        let compare: number;
        if (typeof a === 'number' || typeof b === 'number' || Decimal.isDecimal(a) || Decimal.isDecimal(b)) compare = number(a).cmp(number(b));
        else compare = a === b ? 0 : a < b ? -1 : 1;
        const comparisons: Record<string, boolean> = {'=':compare === 0, '!=':compare !== 0, '<>':compare !== 0, '<':compare < 0, '>':compare > 0, '<=':compare <= 0, '>=':compare >= 0};
        return comparisons[op];
      }
      a = number(a); b = number(b);
      if (op === '+') return a.plus(b);
      if (op === '-') return a.minus(b);
      if (op === '*') return a.times(b);
      if (op === '/') { if (b.isZero()) throw new FormulaError('#DIV/0!'); return a.div(b); }
      if (op === '^') {
        if (!b.isInteger() || b.abs().gt(100)) throw new FormulaError('#NUM!');
        return a.pow(b.toNumber());
      }
    }
    if (kind !== 'call') throw new FormulaError('#VALUE!');
    const name: string = n[1], args: AST[] = n[2];
    if (name === 'IF') { arity(args, 3, 3); const v = run(args[0]); return run(args[truth(v) ? 1 : 2]); }
    if (name === 'IFERROR') {
      arity(args, 2, 2);
      try { return run(args[0]); } catch (error) {
        if (!(error instanceof FormulaError) || error.code === '#LIMIT!') throw error;
        return run(args[1]);
      }
    }
    if (name === 'COALESCE' || name === 'IFNULL') {
      arity(args, 2, name === 'IFNULL' ? 2 : Infinity);
      for (const arg of args) { const v = run(arg); if (v !== null) return v; }
      return null;
    }
    if (name.startsWith('Q')) {
      arity(args, 1, 1);
      if (!context.query || args[0][0] !== 'field') throw new FormulaError('#REF!');
      const values = context.query(args[0][1]); tick(values.length);
      return aggregate(name.slice(1), values);
    }
    const values = args.map(run);
    if (['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'].includes(name)) {
      arity(args, 1); const flat = values.flat(); tick(flat.length); return aggregate(name, flat);
    }
    if (name === 'TODAY') { arity(args, 0, 0); return context.today ?? new Date().toISOString().slice(0, 10); }
    if (['YEAR', 'MONTH', 'DAY'].includes(name)) {
      arity(args, 1, 1);
      const date = String(values[0]).slice(0, 10), parsed = new Date(date + 'T00:00:00Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new FormulaError('#VALUE!');
      return new Decimal(name === 'YEAR' ? parsed.getUTCFullYear() : name === 'MONTH' ? parsed.getUTCMonth() + 1 : parsed.getUTCDate());
    }
    if (name === 'ISNULL') { arity(args, 1, 1); return values[0] === null; }
    if (name === 'UPPER' || name === 'LOWER') { arity(args, 1, 1); return name === 'UPPER' ? text(values[0]).toUpperCase() : text(values[0]).toLowerCase(); }
    if (name === 'CONCAT') { arity(args, 1); return values.map(text).join(''); }
    if (name === 'ABS') { arity(args, 1, 1); return number(values[0]).abs(); }
    if (name === 'ROUND') {
      arity(args, 1, 2); const places = args.length === 2 ? number(values[1]) : new Decimal(0);
      if (!places.isInteger() || places.abs().gt(20)) throw new FormulaError('#NUM!');
      const factor = new Decimal(10).pow(places);
      return number(values[0]).times(factor).toDecimalPlaces(0).div(factor);
    }
    throw new FormulaError('#NAME?');
  };
  try {
    const result = run(node);
    if (Decimal.isDecimal(result) && (!result.isFinite() || Math.abs(result.e) > 1000)) throw new FormulaError('#NUM!');
    return result;
  } catch (error) {
    if (error instanceof FormulaError) throw error;
    throw new FormulaError('#VALUE!');
  }
}
function truth(value: any) { return Decimal.isDecimal(value) ? !value.isZero() : Boolean(value); }

export function coordinates(address: string): [number, number] {
  const match = /^\$?([A-Z]+)\$?([1-9][0-9]*)$/i.exec(address);
  if (!match) throw new FormulaError('#REF!');
  let column = 0;
  for (const char of match[1].toUpperCase()) column = column * 26 + char.charCodeAt(0) - 64;
  return [Number(match[2]) - 1, column - 1];
}
export function columnName(index: number): string {
  let result = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result;
  return result;
}
export function translateFormula(formula: string, rows: number, columns: number): string {
  if (!formula.startsWith('=')) return formula;
  return formula.replace(/"(?:[^"]|"")*"|\[[^\]]*\]|(\$?)([A-Za-z]+)(\$?)([1-9][0-9]*)/g,
    (whole, absCol, letters, absRow, digits) => {
      if (letters === undefined) return whole;
      const [row, col] = coordinates(letters + digits);
      const nextRow = row + (absRow ? 0 : rows), nextCol = col + (absCol ? 0 : columns);
      if (nextRow < 0 || nextCol < 0) throw new FormulaError('#REF!');
      return absCol + columnName(nextCol) + absRow + String(nextRow + 1);
    });
}
