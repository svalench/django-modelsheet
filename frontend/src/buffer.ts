import {coordinates, evaluate, FormulaError, parse, references} from './formula';

export interface Row {pk: string; version: string; values: Record<string, any>; labels?: Record<string, any>}
type Changes = Record<string, Record<string, any>>;
const emptyChanges = (): Changes => Object.create(null);
// structuredClone does not retain null prototypes. Rebuild both dictionaries so
// arbitrary model PKs/field names stay data through every undo/redo snapshot.
const copy = (value: Changes): Changes => {
  const result = emptyChanges();
  for (const [pk, fields] of Object.entries(value)) {
    result[pk] = Object.assign(Object.create(null), structuredClone(fields));
  }
  return result;
};

type Memory = {changes: Changes; rows: Row[]; deleted: Record<string, true>};
const cloneRow = (row: Row): Row => ({
  pk: row.pk, version: row.version, values: {...row.values},
  labels: row.labels ? structuredClone(row.labels) : undefined,
});
const copyFlags = (flags: Record<string, true>) => {
  const result: Record<string, true> = Object.create(null);
  for (const key of Object.keys(flags)) result[key] = true;
  return result;
};

export class EditBuffer {
  changes: Changes = emptyChanges();
  deleted: Record<string, true> = Object.create(null);
  private past: Memory[] = [];
  private future: Memory[] = [];
  private initialRows: Row[];
  constructor(public rows: Row[], public columns: string[], public editable: Set<string>, public today: string) {
    this.initialRows = rows.map(cloneRow);
    this.rows = rows.map(cloneRow);
  }
  get dirty() {
    return Object.keys(this.changes).length > 0 || Object.keys(this.deleted).length > 0 || this.rows.some(row => row.pk.startsWith('new:'));
  }
  private memory(): Memory {
    return {changes: copy(this.changes), rows: this.rows.map(cloneRow), deleted: copyFlags(this.deleted)};
  }
  private remember() { this.past.push(this.memory()); this.future = []; }
  private restore(memory: Memory) {
    this.changes = memory.changes; this.rows = memory.rows; this.deleted = memory.deleted;
  }
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
      if (!row || !this.editable.has(edit.field) || this.deleted[edit.pk]) { skipped++; continue; }
      next[edit.pk] ??= Object.create(null);
      const original = row.values[edit.field];
      // Input editors return strings even when JSON supplied a number/bool/null.
      // Recognize only their unchanged editor representation, without coercing
      // text identifiers, empty numeric input or formulas into equality.
      const unchanged = edit.value === original
        || ((typeof original === 'number' || typeof original === 'boolean') && edit.value === String(original))
        || (original === null && edit.value === '');
      if (unchanged) delete next[edit.pk][edit.field];
      else next[edit.pk][edit.field] = edit.value;
      if (!Object.keys(next[edit.pk]).length) delete next[edit.pk];
    }
    if (JSON.stringify(next) !== JSON.stringify(this.changes)) {
      this.remember(); this.changes = next;
    }
    return skipped;
  }
  addRow(values: Record<string, any>) {
    const pk = `new:${crypto.randomUUID()}`;
    this.remember();
    this.rows = [...this.rows, {pk, version: '', values: {...values}}];
    return pk;
  }
  removeRows(pks: string[]) {
    this.remember();
    for (const pk of pks) {
      if (String(pk).startsWith('new:')) {
        this.rows = this.rows.filter(row => row.pk !== pk);
        delete this.changes[pk];
      } else if (this.rows.some(row => row.pk === pk)) this.deleted[pk] = true;
    }
  }
  undo() { if (this.past.length) { this.future.push(this.memory()); this.restore(this.past.pop()!); } }
  redo() { if (this.future.length) { this.past.push(this.memory()); this.restore(this.future.pop()!); } }
  clear() {
    this.changes = emptyChanges(); this.past = []; this.future = [];
    this.rows = this.initialRows.map(cloneRow); this.deleted = Object.create(null);
  }
  /** Зафиксировать строки как новую базу: clear() больше не откатит их. */
  commit(rows: Row[]) {
    this.rows = rows.map(cloneRow);
    this.initialRows = this.rows.map(cloneRow);
    this.clear();
  }
  payload() {
    return Object.entries(this.changes)
      .filter(([pk]) => !String(pk).startsWith('new:') && !this.deleted[pk])
      .map(([pk, values]) => ({pk, values, version: this.rows.find(row => row.pk === pk)!.version}));
  }
  saveParts() {
    const creates = this.rows.filter(row => row.pk.startsWith('new:')).map(row => ({
      temp_id: row.pk,
      values: {...row.values, ...(this.changes[row.pk] ?? {})},
    }));
    const deletes = Object.keys(this.deleted).map(pk => ({pk, version: this.rows.find(row => row.pk === pk)!.version}));
    return {changes: this.payload(), creates, deletes};
  }
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
