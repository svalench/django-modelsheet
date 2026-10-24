import Decimal from 'decimal.js';
import {EditBuffer, Row} from './buffer';
import {FormulaError, number} from './formula';

export const demoColumns = ['name', 'price', 'stock', 'status'];
export type DemoField = 'name' | 'price' | 'stock' | 'status';
export class DemoValidationError extends Error {
  constructor(public pk: string, public field: string, public code: string) { super(code); }
}

/** Browser-only save boundary. It deliberately makes no server guarantees. */
export class DemoSession {
  buffer: EditBuffer;
  private initial: Row[];
  constructor(names: string[], today = new Date().toISOString().slice(0, 10)) {
    const prices = ['1200.00', '850.00', '3400.00', '450.00', '2100.00', '650.00'];
    const stocks = [12, 4, 0, 25, 8, 16];
    this.initial = names.map((name, i) => ({pk: String(i + 1), version: 'demo',
      values: {name, price: prices[i], stock: stocks[i], status: stocks[i] ? 'ready' : 'order'}}));
    this.buffer = new EditBuffer(structuredClone(this.initial), demoColumns, new Set(demoColumns), today);
  }
  get changedCells() { return Object.values(this.buffer.changes).reduce((n, row) => n + Object.keys(row).length, 0); }
  reset() { this.buffer.rows = structuredClone(this.initial); this.buffer.clear(); }
  value(pk: string, field: string): any {
    const value = this.buffer.value(pk, field);
    if (field === 'price' || field === 'stock') {
      let numeric: Decimal;
      try { numeric = number(value); }
      catch { throw new DemoValidationError(pk, field, 'number'); }
      if (numeric.lt(0) || numeric.gt(field === 'price' ? '9999999999.99' : 1000000)) {
        throw new DemoValidationError(pk, field, 'bounds');
      }
      if (field === 'stock' && !numeric.isInteger()) throw new DemoValidationError(pk, field, 'integer');
      return field === 'price' ? numeric.toDecimalPlaces(2) : numeric.toNumber();
    }
    if (field === 'status' && !['ready', 'order'].includes(value)) throw new DemoValidationError(pk, field, 'status');
    if (field === 'name' && (typeof value !== 'string' || !value.trim() || value.length > 100)) {
      throw new DemoValidationError(pk, field, 'name');
    }
    return value;
  }
  save() {
    // Evaluate and validate every row before committing anything, preserving the
    // full edit buffer on formula/type errors, including dependency cycles.
    const names = new Set<string>();
    const rows = this.buffer.rows.map(row => {
      const values = Object.fromEntries(demoColumns.map(field => [field, this.value(row.pk, field)]));
      if (names.has(values.name)) throw new DemoValidationError(row.pk, 'name', 'unique');
      names.add(values.name);
      values.price = values.price.toFixed(2);
      return {...row, values};
    });
    this.buffer.rows = rows;
    this.buffer.clear();
  }
  preset(kind: string) {
    if (!['markup', 'status', 'average'].includes(kind)) throw new FormulaError('#NAME?');
    const rows = kind === 'average' ? this.buffer.rows.slice(0, 1) : this.buffer.rows;
    this.buffer.apply(rows.map(row => ({pk: row.pk, field: kind === 'status' ? 'status' : 'price',
      value: kind === 'markup' ? '=ROUND([price]*1.07,2)' : kind === 'status'
        ? '=IF([stock]>0,"ready","order")' : '=ROUND(AVG(B2:B6),2)'})));
  }
  total() {
    return this.buffer.rows.reduce((sum, row) => sum.plus(number(this.value(row.pk, 'price')).times(this.value(row.pk, 'stock'))), new Decimal(0));
  }
}
