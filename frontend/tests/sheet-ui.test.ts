import {expect, it} from 'vitest';
import {EditBuffer} from '../src/buffer';
import {fillRightEdits, findReplaceEdits} from '../src/edits';
import {describeFilter} from '../src/filters';
import {translator} from '../src/i18n';
import {validateCell} from '../src/validate';

it('validates types, length and required values without rejecting formulas', () => {
  expect(validateCell({type: 'CharField', max_length: 3, blank: false}, 'toolong')).toBe('Too long');
  expect(validateCell({type: 'DecimalField'}, '1,25')).toBeNull();
  expect(validateCell({type: 'IntegerField'}, '1,2')).toBe('Invalid integer');
  expect(validateCell({type: 'DateField', nullable: true}, '')).toBeNull();
  expect(validateCell({type: 'DateField'}, '2026-13-01')).toBe('Invalid date');
  expect(validateCell({type: 'CharField', blank: false}, '')).toBe('Required');
  expect(validateCell({type: 'IntegerField'}, '=1+2')).toBeNull();
});

it('describes filters without dumping JSON', () => {
  const t = translator('ru');
  const chips = describeFilter({and: [{field: 'price', op: 'gte', value: '10'}]}, name => name, t);
  expect(chips).toEqual(['price Больше или равно 10']);
  expect(JSON.stringify(chips)).not.toContain('"op"');
});

it('translates previously hardcoded UI strings for ru, be and zh', () => {
  expect(translator('ru')('Formula')).toBe('Формула');
  expect(translator('be')('AND')).toBe('І');
  expect(translator('zh')('Paste exceeds configured limits')).toContain('粘贴');
  expect(translator('en')('Formula')).toBe('Formula');
});

it('finds and replaces on the current page and fills right through the buffer', () => {
  const buffer = new EditBuffer([
    {pk: '1', version: 'v1', values: {name: 'Alpha', note: 'cat'}},
    {pk: '2', version: 'v2', values: {name: 'beta', note: ''}},
  ], ['name', 'note'], new Set(['name', 'note']), '2026-11-13');
  buffer.apply(findReplaceEdits(buffer, ['name', 'note'], 'a', 'o', false));
  expect(buffer.raw('1', 'name')).toBe('olpho');
  expect(buffer.raw('1', 'note')).toBe('cot');
  expect(buffer.raw('2', 'name')).toBe('beto');
  buffer.undo();
  expect(buffer.raw('1', 'name')).toBe('Alpha');
  const right = new EditBuffer([
    {pk: '1', version: 'v', values: {a: '1', b: '', c: ''}},
  ], ['a', 'b', 'c'], new Set(['a', 'b', 'c']), '2026-11-13');
  right.apply(fillRightEdits(right, ['a', 'b', 'c'], {top: 0, bottom: 0, left: 0, right: 2}));
  expect(right.raw('1', 'b')).toBe('1');
  expect(right.raw('1', 'c')).toBe('1');
  right.undo();
  expect(right.dirty).toBe(false);
});

it('tracks created and deleted rows in one undoable save payload', () => {
  const buffer = new EditBuffer([{pk: '1', version: 'v1', values: {name: 'A'}}], ['name'], new Set(['name']), '2026-11-13');
  const pk = buffer.addRow({name: 'B'});
  buffer.removeRows(['1']);
  const parts = buffer.saveParts();
  expect(parts.deletes).toEqual([{pk: '1', version: 'v1'}]);
  expect(parts.creates).toEqual([{temp_id: pk, values: {name: 'B'}}]);
  buffer.undo();
  buffer.undo();
  expect(buffer.dirty).toBe(false);
  expect(buffer.rows.map(row => row.pk)).toEqual(['1']);
});
