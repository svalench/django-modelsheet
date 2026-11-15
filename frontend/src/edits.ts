import {EditBuffer} from './buffer';
import {translateFormula} from './formula';

export function fillRightEdits(buffer: EditBuffer, columns: string[], bounds: {top: number; bottom: number; left: number; right: number}) {
  const edits: {pk: string; field: string; value: unknown}[] = [];
  for (let row = bounds.top; row <= bounds.bottom; row++) {
    const current = buffer.rows[row];
    if (!current || buffer.deleted[current.pk]) continue;
    for (let col = bounds.left + 1; col <= bounds.right; col++) {
      const raw = buffer.transferValue(current.pk, columns[bounds.left]);
      edits.push({
        pk: current.pk,
        field: columns[col],
        value: typeof raw === 'string' ? translateFormula(raw, 0, col - bounds.left) : raw,
      });
    }
  }
  return edits;
}

export function findReplaceEdits(buffer: EditBuffer, columns: string[], query: string, replacement: string, matchCase: boolean) {
  if (!query) return [];
  const edits: {pk: string; field: string; value: string}[] = [];
  const needle = matchCase ? query : query.toLowerCase();
  for (const row of buffer.rows) {
    if (buffer.deleted[row.pk]) continue;
    for (const field of columns) {
      const raw = buffer.raw(row.pk, field);
      const text = raw === null || raw === undefined ? '' : String(raw);
      const haystack = matchCase ? text : text.toLowerCase();
      if (!haystack.includes(needle)) continue;
      edits.push({pk: row.pk, field, value: replaceAll(text, query, replacement, matchCase)});
    }
  }
  return edits;
}

function replaceAll(text: string, query: string, replacement: string, matchCase: boolean) {
  if (matchCase) return text.split(query).join(replacement);
  const lower = text.toLowerCase();
  const needle = query.toLowerCase();
  let cursor = 0, result = '';
  while (cursor < text.length) {
    const found = lower.indexOf(needle, cursor);
    if (found < 0) return result + text.slice(cursor);
    result += text.slice(cursor, found) + replacement;
    cursor = found + needle.length;
  }
  return result;
}
