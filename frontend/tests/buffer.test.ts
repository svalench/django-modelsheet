import {it, expect} from 'vitest';
import {EditBuffer, parseTSV, encodeTSV} from '../src/buffer';
import {FormulaError} from '../src/formula';

const rows = [
  {pk:'1',version:'v1',values:{name:'One',price:'10',stock:1}},
  {pk:'2',version:'v2',values:{name:'Two',price:'20',stock:2}},
];
function buffer() { return new EditBuffer(rows,['name','price','stock'],new Set(['price','stock']),'2026-10-24'); }
it('undoes and redoes an entire paste while skipping readonly cells', () => {
  const edits = buffer();
  expect(edits.apply([{pk:'1',field:'name',value:'Changed'}, {pk:'1',field:'price',value:'12'}, {pk:'2',field:'price',value:'13'}])).toBe(1);
  expect(edits.payload()).toHaveLength(2); expect(edits.raw('1','name')).toBe('One');
  edits.undo(); expect(edits.dirty).toBe(false);
  edits.redo(); expect(edits.raw('2','price')).toBe('13');
});
it('uses original values for named references and edited dependencies for cell references', () => {
  const edits = buffer();
  edits.apply([{pk:'1',field:'price',value:'=[price]*1.07'}, {pk:'2',field:'price',value:'=B1+1'}]);
  expect(String(edits.value('1','price'))).toBe('10.7');
  expect(String(edits.value('2','price'))).toBe('11.7');
});
it('reports cycles explicitly', () => {
  const edits = buffer(); edits.apply([{pk:'1',field:'price',value:'=B2'}, {pk:'2',field:'price',value:'=B1'}]);
  expect(() => edits.value('1','price')).toThrow(FormulaError);
});
it('parses and writes Excel quoted TSV', () => {
  const text = 'one\t"a\tb"\r\n"a\nb"\t"say ""hi"""\r\n';
  const values = [['one','a\tb'],['a\nb','say "hi"']];
  expect(parseTSV(text)).toEqual(values);
  expect(parseTSV(encodeTSV(values))).toEqual(values);
});
it('never executes existing model text as a formula', () => {
  const edits = new EditBuffer([{pk:'1',version:'v',values:{note:'=eval(1)'}}],['note'],new Set(['note']),'2026-10-24');
  expect(edits.value('1','note')).toBe('=eval(1)');
  edits.apply([{pk:'1',field:'note',value:"'=eval(2)"}]);
  expect(edits.value('1','note')).toBe('=eval(2)');
});
it('preserves literal formula-looking text when copying or filling', () => {
  const edits=new EditBuffer([{pk:'1',version:'v1',values:{note:'=eval(1)'}},{pk:'2',version:'v2',values:{note:''}}],['note'],new Set(['note']),'2026-10-24');
  edits.apply([{pk:'2',field:'note',value:edits.transferValue('1','note')}]);
  expect(edits.value('2','note')).toBe('=eval(1)');
});
