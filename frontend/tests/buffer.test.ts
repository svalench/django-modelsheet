import {it, expect} from 'vitest';
import {EditBuffer, parseTSV, encodeTSV} from '../src/buffer';
import {FormulaError} from '../src/formula';

const rows = [
  {pk:'1',version:'v1',values:{name:'One',price:'10',stock:1}},
  {pk:'2',version:'v2',values:{name:'Two',price:'20',stock:2}},
];
function buffer() { return new EditBuffer(rows,['name','price','stock'],new Set(['price','stock']),'2026-10-24'); }
it('does not dirty unchanged numeric, boolean or null values returned by input editors', () => {
  const edits = new EditBuffer([{pk:'1',version:'v',values:{stock:25,zero:0,active:false,date:null}}],
    ['stock','zero','active','date'],new Set(['stock','zero','active','date']),'2026-10-24');
  edits.apply([{pk:'1',field:'stock',value:'25'},{pk:'1',field:'zero',value:'0'},
    {pk:'1',field:'active',value:'false'},{pk:'1',field:'date',value:''}]);
  expect(edits.dirty).toBe(false); expect(edits.payload()).toEqual([]);
});
it('does not create an undo step or clear redo for a no-op editor blur', () => {
  const edits=buffer(); edits.apply([{pk:'1',field:'price',value:'11'}]);
  edits.undo(); edits.apply([{pk:'2',field:'stock',value:'2'}]); edits.redo();
  expect(edits.raw('1','price')).toBe('11');
  expect(edits.payload()).toEqual([{pk:'1',version:'v1',values:{price:'11'}}]);
  edits.apply([{pk:'1',field:'stock',value:'4'}]);
  edits.apply([{pk:'1',field:'stock',value:'1'}]);
  expect(edits.changes['1']).not.toHaveProperty('stock');
});
it('preserves meaningful string identifiers, cleared numbers and formula assignments', () => {
  const edits=new EditBuffer([{pk:'1',version:'v',values:{code:'025',stock:25,note:''}}],
    ['code','stock','note'],new Set(['code','stock','note']),'2026-10-24');
  edits.apply([{pk:'1',field:'code',value:'25'},{pk:'1',field:'stock',value:''},{pk:'1',field:'note',value:null}]);
  expect(edits.changes['1']).toEqual({code:'25',stock:'',note:null});
  edits.apply([{pk:'1',field:'stock',value:'=25'}]);
  expect(edits.changes['1'].stock).toBe('=25');
});
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

it.each(['__proto__','constructor','prototype','toString','hasOwnProperty'])('edits, reverts and restores arbitrary PK %s without changing prototypes', pk => {
  const before = Object.getOwnPropertyDescriptors(Object.prototype);
  const edits = new EditBuffer([{pk,version:'v',values:{price:'10'}}], ['price'], new Set(['price']), '2026-10-25');
  expect(edits.raw(pk,'price')).toBe('10');
  edits.apply([{pk,field:'price',value:'20'}]);
  expect(edits.dirty).toBe(true);
  expect(edits.payload()).toEqual([{pk,version:'v',values:{price:'20'}}]);
  edits.apply([{pk,field:'price',value:'=[price]+12'}]);
  expect(String(edits.value(pk,'price'))).toBe('22');
  edits.undo(); expect(edits.raw(pk,'price')).toBe('20');
  edits.undo(); expect(edits.dirty).toBe(false);
  edits.redo(); edits.redo(); expect(String(edits.value(pk,'price'))).toBe('22');
  expect(JSON.parse(JSON.stringify(edits.payload()))[0].pk).toBe(pk);
  edits.apply([{pk,field:'price',value:'10'}]); expect(edits.dirty).toBe(false);
  edits.undo(); expect(edits.dirty).toBe(true);
  edits.clear(); expect(edits.raw(pk,'price')).toBe('10');
  edits.redo(); expect(edits.dirty).toBe(false);
  edits.apply([{pk,field:'price',value:'30'}]); expect(edits.raw(pk,'price')).toBe('30');
  expect(Object.getPrototypeOf(edits.changes)).toBeNull();
  expect(Object.getOwnPropertyDescriptors(Object.prototype)).toEqual(before);
});

it('keeps inherited-looking field names and multiple special PKs separate through snapshots', () => {
  const values = JSON.parse('{"__proto__":"original","constructor":"old"}');
  const edits = new EditBuffer(['__proto__','constructor'].map(pk => ({pk,version:pk,values})),
    ['__proto__','constructor'],new Set(['__proto__','constructor']),'2026-10-25');
  edits.apply([{pk:'__proto__',field:'__proto__',value:'new'}, {pk:'constructor',field:'constructor',value:'changed'}]);
  edits.apply([{pk:'__proto__',field:'constructor',value:'extra'}]);
  edits.undo(); edits.redo();
  expect(edits.payload()).toHaveLength(2);
  expect(edits.raw('__proto__','__proto__')).toBe('new');
  expect(edits.raw('constructor','__proto__')).toBe('original');
  expect(edits.raw('__proto__','constructor')).toBe('extra');
  expect(edits.raw('constructor','constructor')).toBe('changed');
  expect(Object.getPrototypeOf(edits.changes.__proto__)).toBeNull();
});
