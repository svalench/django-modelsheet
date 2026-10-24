import {describe, expect, it} from 'vitest';
import {DemoSession, DemoValidationError} from '../src/demo-session';
import {FormulaError} from '../src/formula';

const session = () => new DemoSession(['Cup', 'Bag', 'Lamp', 'Notebook', 'Vase', 'Bottle']);
describe('browser-only demo save boundary', () => {
  it('uses the package formula engine and commits values instead of formulas', () => {
    const demo = session(); demo.preset('markup');
    expect(String(demo.value('1', 'price'))).toBe('1284');
    demo.save();
    expect(demo.buffer.raw('1', 'price')).toBe('1284.00');
    expect(demo.buffer.dirty).toBe(false);
    demo.preset('markup');
    expect(String(demo.value('1', 'price'))).toBe('1373.88');
  });
  it('keeps every pending edit on failed validation without partially committing', () => {
    const demo = session();
    demo.buffer.apply([{pk:'1',field:'price',value:'1250'}, {pk:'2',field:'stock',value:'-1'}]);
    expect(() => demo.save()).toThrow(DemoValidationError);
    expect(demo.buffer.rows[0].values.price).toBe('1200.00');
    expect(demo.changedCells).toBe(2);
    demo.buffer.undo(); expect(demo.changedCells).toBe(0);
    demo.buffer.redo(); expect(demo.changedCells).toBe(2);
  });
  it('recalculates dependent cells and rejects cycles and division by zero', () => {
    const demo = session();
    demo.buffer.apply([{pk:'1',field:'price',value:'=B2+1'}]);
    expect(String(demo.value('1','price'))).toBe('851');
    demo.buffer.apply([{pk:'2',field:'price',value:'=B1'}]);
    expect(() => demo.save()).toThrow(FormulaError);
    demo.reset(); demo.buffer.apply([{pk:'1',field:'price',value:'=1/0'}]);
    expect(() => demo.save()).toThrow(FormulaError);
    expect(demo.buffer.dirty).toBe(true);
  });
  it('validates integer stock, choices, names and uniqueness', () => {
    for (const [field,value] of [['stock','1.5'],['status','invalid'],['name',''],['name','Bag']]) {
      const demo=session(); demo.buffer.apply([{pk:'1',field,value}]);
      expect(() => demo.save()).toThrow(DemoValidationError);
    }
  });
  it('calculates a range aggregate and resets after a save', () => {
    const demo=session(); demo.preset('average');
    expect(String(demo.value('1','price'))).toBe('1490');
    demo.save(); demo.reset();
    expect(demo.buffer.raw('1','price')).toBe('1200.00');
    expect(demo.changedCells).toBe(0);
    expect(String(demo.total())).toBe('56250');
  });
  it('keeps user-provided markup as text and prevents invalid field edits', () => {
    const demo=session(); demo.buffer.apply([{pk:'1',field:'name',value:'<img src=x onerror=alert(1)>'}, {pk:'1',field:'unknown',value:1}]);
    demo.save();
    expect(demo.value('1','name')).toBe('<img src=x onerror=alert(1)>');
    expect(demo.buffer.rows[0].values).not.toHaveProperty('unknown');
  });
});
