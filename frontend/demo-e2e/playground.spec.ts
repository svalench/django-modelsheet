import {test, expect} from '@playwright/test';

test('no-op blur, Enter and Tab retain clean cells and working library navigation', async ({page}) => {
  const errors: string[]=[]; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/playground/');
  const stock=page.locator('.tabulator-row').nth(3).locator('[tabulator-field=stock]');
  await stock.dblclick();
  const input=stock.locator('input'); await expect(input).toHaveValue('25');
  const {cellBox,inputBox}=await input.evaluate(element => {
    const cell=element.parentElement!.getBoundingClientRect(), editor=element.getBoundingClientRect();
    return {cellBox:{x:cell.x,y:cell.y,width:cell.width,height:cell.height},
      inputBox:{x:editor.x,y:editor.y,width:editor.width,height:editor.height}};
  });
  expect(inputBox!.x).toBeGreaterThanOrEqual(cellBox!.x);
  expect(inputBox!.y).toBeGreaterThanOrEqual(cellBox!.y);
  expect(inputBox!.x+inputBox!.width).toBeLessThanOrEqual(cellBox!.x+cellBox!.width+1);
  expect(inputBox!.y+inputBox!.height).toBeLessThanOrEqual(cellBox!.y+cellBox!.height+1);
  await input.press('Tab');
  await page.getByRole('textbox',{name:'Value or formula for the selected cell'}).click();
  await expect(page.locator('.demo-dirty')).toHaveCount(0);
  await stock.click();
  const holder=page.locator('.tabulator-tableholder');
  await holder.press('ArrowUp');
  await expect(page.locator('.demo-address')).toHaveText('C3');
  await expect(page.getByRole('textbox',{name:'Value or formula for the selected cell'})).toHaveValue('0');
  await holder.press('ArrowLeft');
  await expect(page.locator('.demo-address')).toHaveText('B3');
  await expect(page.getByRole('textbox',{name:'Value or formula for the selected cell'})).toHaveValue('3400.00');
  await holder.press('Shift+ArrowUp');
  await expect(page.locator('.demo-address')).toHaveText('B3');
  await expect(page.getByRole('button',{name:'Save in demo',exact:true})).toBeDisabled();
  expect(errors).toEqual([]);
});

test('real edits, no-op editors, undo and redo keep the grid components usable', async ({page}) => {
  const errors: string[]=[]; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/playground/');
  const price=page.locator('.tabulator-row').first().locator('[tabulator-field=price]');
  await price.dblclick(); await price.locator('input').fill('1500'); await price.locator('input').press('Enter');
  await expect(price).toHaveText('1500.00');
  const stock=page.locator('.tabulator-row').nth(3).locator('[tabulator-field=stock]');
  await stock.dblclick(); await stock.locator('input').press('Enter');
  await expect(stock).not.toHaveClass(/demo-dirty/);
  await expect(page.locator('.demo-dirty')).toHaveCount(1);
  await page.getByRole('button',{name:'↶ Undo',exact:true}).click();
  await expect(price).toHaveText('1200.00');
  await page.getByRole('button',{name:'↷ Redo',exact:true}).click();
  await expect(price).toHaveText('1500.00');
  await stock.click(); await page.locator('.tabulator-tableholder').press('ArrowUp');
  await expect(page.locator('.demo-address')).toHaveText('C3');
  expect(errors).toEqual([]);
});

test('a formula is applied to the keyboard-selected cell and errors retain pending edits', async ({page}) => {
  const errors: string[]=[]; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/playground/');
  await page.locator('.tabulator-row').nth(3).locator('[tabulator-field=stock]').click();
  const holder=page.locator('.tabulator-tableholder');
  await holder.press('ArrowUp'); await holder.press('ArrowLeft');
  await expect(page.locator('.demo-address')).toHaveText('B3');
  const formula=page.getByRole('textbox',{name:'Value or formula for the selected cell'});
  await formula.fill('=[price]+100'); await page.getByRole('button',{name:'Apply',exact:true}).click();
  await expect(page.locator('.tabulator-row').nth(2).locator('[tabulator-field=price]')).toHaveText('3500.00');
  await page.getByRole('button',{name:'Save in demo',exact:true}).click();
  await expect(page.locator('.demo-dirty')).toHaveCount(0);
  await formula.fill('=1/0'); await page.getByRole('button',{name:'Apply',exact:true}).click();
  await page.getByRole('button',{name:'Save in demo',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Nothing saved');
  await expect(page.locator('.demo-dirty')).toHaveCount(1);
  expect(errors).toEqual([]);
});
