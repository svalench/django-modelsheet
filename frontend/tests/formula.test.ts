import {describe, it, expect} from 'vitest';
import Decimal from 'decimal.js';
import cases from '../../tests/formula_cases.json';
import {evaluate, FormulaError, parse, translateFormula} from '../src/formula';

describe('shared server/client formula contract', () => {
  for (const item of cases) it(item.formula, () => {
    const calculate = () => evaluate(parse(item.formula), {fields:{price:'10.00',stock:3},
      cell:(start, end) => end ? [new Decimal(10),new Decimal(20)] : ({B1:new Decimal(10),'$B$2':new Decimal(20)} as any)[start],
      column:() => [10,20,null], query:() => [10,20,null], today:'2026-10-24'});
    if ('error' in item) {
      try { calculate(); throw new Error('Expected formula error'); }
      catch (error) { expect(error).toBeInstanceOf(FormulaError); expect((error as FormulaError).code).toBe(item.error); }
    } else {
      const result = calculate(); expect(Decimal.isDecimal(result) ? result.toFixed() : result).toBe(item.value);
    }
  });
});
it('translates relative references without changing strings, fields or absolute coordinates', () => {
  expect(translateFormula('=A1+$B$2+C$3+$D4+CONCAT("A1",[price])',2,1)).toBe('=B3+$B$2+D$3+$D6+CONCAT("A1",[price])');
});
it('rejects translations outside the view', () => expect(() => translateFormula('=A1',-1,0)).toThrow(FormulaError));
