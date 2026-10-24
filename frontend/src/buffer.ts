import {coordinates, evaluate, FormulaError, parse, references} from './formula';

export interface Row {pk: string; version: string; values: Record<string, any>}
type Changes = Record<string, Record<string, any>>;
const copy = <T>(value: T): T => structuredClone(value);

export class EditBuffer {
  changes: Changes = {};
  private past: Changes[] = [];
  private future: Changes[] = [];
  constructor(public rows: Row[], public columns: string[], public editable: Set<string>, public today: string) {}
  get dirty() { return Object.keys(this.changes).length > 0; }
  raw(pk: string, field: string) {
    return Object.hasOwn(this.changes[pk] ?? {}, field) ? this.changes[pk][field] : this.rows.find(row => row.pk === pk)?.values[field];
  }
  transferValue(pk: string, field: string) {
    const raw=this.raw(pk,field);
    return typeof raw === 'string' && raw.startsWith('=') && !Object.hasOwn(this.changes[pk] ?? {},field) ? "'"+raw : raw;
  }
  apply(edits: {pk: string; field: string; value: any}[]) {
    const next = copy(this.changes);
    let skipped = 0;
    for (const edit of edits) {
      const row = this.rows.find(row => row.pk === edit.pk);
      if (!row || !this.editable.has(edit.field)) { skipped++; continue; }
      next[edit.pk] ??= {};
      if (edit.value === row.values[edit.field]) delete next[edit.pk][edit.field];
      else next[edit.pk][edit.field] = edit.value;
      if (!Object.keys(next[edit.pk]).length) delete next[edit.pk];
    }
    if (JSON.stringify(next) !== JSON.stringify(this.changes)) {
      this.past.push(copy(this.changes)); this.future = []; this.changes = next;
    }
    return skipped;
  }
  undo() { if (this.past.length) { this.future.push(copy(this.changes)); this.changes = this.past.pop()!; } }
  redo() { if (this.future.length) { this.past.push(copy(this.changes)); this.changes = this.future.pop()!; } }
  clear() { this.changes = {}; this.past = []; this.future = []; }
  payload() { return Object.entries(this.changes).map(([pk, values]) => ({pk, values, version: this.rows.find(row => row.pk === pk)!.version})); }
  value(pk: string, field: string): any {
    const visiting = new Set<string>(), cache = new Map<string, any>();
    const calculate = (id: string, name: string): any => {
      const key = JSON.stringify([id, name]);
      if (cache.has(key)) return cache.get(key);
      if (visiting.has(key)) throw new FormulaError('#CYCLE!');
      if (visiting.size > 100) throw new FormulaError('#LIMIT!');
      const row = this.rows.find(item => item.pk === id);
      if (!row || !Object.hasOwn(row.values, name)) throw new FormulaError('#REF!');
      visiting.add(key);
      try {
        const raw = this.raw(id, name);
        let value = raw;
        const changed = Object.hasOwn(this.changes[id] ?? {},name);
        if (changed && typeof raw === 'string' && raw.startsWith("'=")) value = raw.slice(1);
        else if (changed && typeof raw === 'string' && raw.startsWith('=')) {
          const node = parse(raw), refs = references(node);
          if ([...refs.fields, ...refs.columns].some(n => !Object.hasOwn(row.values, n))) throw new FormulaError('#REF!');
          value = evaluate(node, {fields: row.values, today: this.today,
            cell: (start, end) => {
              const a = coordinates(start), b = coordinates(end ?? start), values = [];
              if (Math.max(a[0], b[0]) >= this.rows.length || Math.max(a[1], b[1]) >= this.columns.length) throw new FormulaError('#REF!');
              for (let r = Math.min(a[0], b[0]); r <= Math.max(a[0], b[0]); r++) {
                for (let c = Math.min(a[1], b[1]); c <= Math.max(a[1], b[1]); c++) values.push(calculate(this.rows[r].pk, this.columns[c]));
              }
              return end ? values : values[0];
            },
            column: name => this.rows.map(row => calculate(row.pk, name)),
          });
        }
        cache.set(key, value); return value;
      } finally { visiting.delete(key); }
    };
    return calculate(pk, field);
  }
}

/** Excel TSV supports quoted cells with tabs, newlines and doubled quotes. */
export function parseTSV(source: string): string[][] {
  const rows: string[][] = [], row: string[] = [];
  let value = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"' && (quoted || value === '')) {
      if (quoted && source[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (char === '\t' || char === '\n' || char === '\r')) {
      row.push(value); value = '';
      if (char !== '\t') {
        rows.push([...row]); row.length = 0;
        if (char === '\r' && source[i + 1] === '\n') i++;
      }
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}
export function encodeTSV(rows: any[][]): string {
  return rows.map(row => row.map(value => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[\t\r\n"]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
  }).join('\t')).join('\n');
}
