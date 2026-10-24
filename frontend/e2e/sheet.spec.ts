import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.goto('/admin/login/');
  await page.getByLabel('Username:').fill('admin');
  await page.getByLabel('Password:').fill('admin');
  await page.getByRole('button', {name:'Log in'}).click();
  await page.goto('/admin/shop/product/sheet/');
  await expect(page.locator('.tabulator-row').first()).toBeVisible();
});

test('edit with formula, undo, save and reload', async ({page}) => {
  const price = page.locator('.tabulator-row').first().locator('[tabulator-field=price]');
  await price.click();
  await page.getByLabel('Formula', {exact:true}).fill('=ROUND([price]*1.07,2)');
  await page.getByLabel('Formula', {exact:true}).press('Enter');
  await expect(page.getByRole('button', {name:'Save', exact:true})).toBeEnabled();
  await page.getByRole('button', {name:'Undo', exact:true}).click();
  await expect(page.getByRole('button', {name:'Save', exact:true})).toBeDisabled();
  await page.getByRole('button', {name:'Redo', exact:true}).click();
  const saved = page.waitForResponse(response => response.url().endsWith('/sheet/save/'));
  await page.getByRole('button', {name:'Save', exact:true}).click();
  expect((await saved).status()).toBe(200);
  await expect(page.locator('span[role=status]')).toContainText('Saved');
  await page.reload();
  await expect(page.locator('.tabulator-row').first()).toBeVisible();
  await expect(page.getByRole('button', {name:'Save', exact:true})).toBeDisabled();
});

test('clipboard paste skips readonly FK and undo preserves originals', async ({page}) => {
  const category = page.locator('.tabulator-row').first().locator('[tabulator-field=category]');
  const initial = await category.textContent();
  await category.click();
  // Dispatch the real clipboard event in the test browser, with two adjacent cells.
  await page.evaluate(() => {
    const data = new DataTransfer(); data.setData('text/plain', '999\tfalse');
    document.querySelector('.tabulator-row [tabulator-field=category]')!.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));
  });
  await expect(page.locator('span[role=status]')).toContainText('Readonly cells skipped');
  await expect(category).toHaveText(initial!);
  await page.getByRole('button', {name:'Undo', exact:true}).click();
  await expect(page.getByRole('button', {name:'Save', exact:true})).toBeDisabled();
});

test('preview and confirm bulk operation without touching excluded rows', async ({page}) => {
  await page.getByRole('button', {name:'Bulk change', exact:true}).click();
  const dialog = page.locator('dialog');
  await dialog.getByRole('button', {name:'Add condition', exact:true}).first().click();
  const condition = dialog.locator('.ms-filter-group .ms-condition').first();
  await condition.locator('select').first().selectOption('name');
  await condition.locator('input').fill('Product 0000000');
  const assignment = dialog.locator('.ms-condition').last();
  await assignment.locator('select').selectOption('price');
  await assignment.locator('input').fill('=[price]+1');
  await dialog.getByRole('button', {name:'Preview', exact:true}).click();
  await expect(dialog.locator('.ms-report')).toContainText('Matched: 1');
  page.once('dialog', prompt => prompt.accept());
  await dialog.getByRole('button', {name:'Confirm', exact:true}).click();
  await expect(dialog.locator('.ms-report')).toContainText('done');
});

test('server validation preserves unsaved values and marks the cell', async ({page}) => {
  await page.locator('.tabulator-row').first().locator('[tabulator-field=stock]').click();
  await page.getByLabel('Formula', {exact:true}).fill('-1');
  await page.getByLabel('Formula', {exact:true}).press('Enter');
  await page.getByRole('button', {name:'Save', exact:true}).click();
  await expect(page.locator('span[role=status]')).toContainText('validation');
  await expect(page.getByRole('button', {name:'Save', exact:true})).toBeEnabled();
  await expect(page.locator('.ms-cell-error').first()).toBeVisible();
});

test('Admin roundtrip preserves page and search', async ({page}) => {
  await page.getByPlaceholder('Search', {exact:true}).fill('Product');
  await page.getByPlaceholder('Search', {exact:true}).press('Enter');
  await page.getByRole('button', {name:'Next', exact:true}).click();
  await expect(page).toHaveURL(/offset=200/);
  await page.getByRole('button', {name:'Ordinary Admin', exact:true}).click();
  await expect(page).toHaveURL(/p=1/);
  await page.getByRole('link', {name:'Spreadsheet', exact:true}).click();
  await expect(page).toHaveURL(/offset=200/);
  await expect(page.getByPlaceholder('Search')).toHaveValue('Product');
});

test('100k results with 50 columns renders a bounded 200-row window', async ({page}) => {
  const names = Array.from({length:50}, (_,i) => `value_${i}`);
  await page.route('**/sheet/schema/', route => route.fulfill({json:{
    fields:names.map(name => ({name,label:name,type:'IntegerField',editable:true,choices:[]})),
    computed:[], page_size:200, max_save_rows:500, can_bulk:false, can_history:false,
  }}));
  await page.route('**/sheet/rows/?**', route => route.fulfill({json:{
    rows:Array.from({length:200},(_,i) => ({pk:String(i+1), version:'fixture', values:Object.fromEntries(names.map(name => [name,i]))})),
    snapshot:'fixture', state:{q:'',filter:{},sort:[],offset:0,limit:200,columns:names},
    today:'2026-10-24', count:100000, has_next:true,
  }}));
  await page.reload();
  await expect(page.locator('.tabulator-row').first()).toBeVisible();
  const measurements = await page.evaluate(async () => {
    const holder = document.querySelector('.tabulator-tableholder')!;
    const frames: number[] = [];
    let previous = performance.now();
    for (let i=0;i<30;i++) {
      holder.scrollTop = i*180; holder.scrollLeft = i*120;
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const now = performance.now(); frames.push(now-previous); previous=now;
    }
    frames.sort((a,b) => a-b);
    return {p95_frame_ms:frames[Math.floor(frames.length*.95)], dom_rows:document.querySelectorAll('.tabulator-row').length,
      total_results:100000, loaded_rows:200, columns:50, user_agent:navigator.userAgent};
  });
  expect(measurements.dom_rows).toBeLessThan(200);
  await test.info().attach('scroll-benchmark.json',{body:JSON.stringify(measurements,null,2), contentType:'application/json'});
});

test('keyboard moves the formula address and Shift extends a range', async ({page}) => {
  await page.locator('.tabulator-row').first().locator('[tabulator-field=price]').click();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.ms-address')).toHaveText('B2');
  await page.keyboard.press('Tab');
  await expect(page.locator('.ms-address')).toHaveText('C2');
  await page.keyboard.press('Enter');
  await expect(page.locator('.tabulator-cell.tabulator-editing input')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.ms-address')).toHaveText('C3');
  await page.keyboard.press('Shift+ArrowDown');
  await expect(page.locator('.ms-selection')).toContainText('2');
});

test('opening and leaving a numeric editor keeps the buffer clean and editor inside the cell', async ({page}) => {
  const stock=page.locator('.tabulator-row').nth(3).locator('[tabulator-field=stock]');
  const original=await stock.textContent();
  await stock.dblclick();
  const input=stock.locator('input');
  await expect(input).toHaveValue(original!);
  const cellBox=await stock.boundingBox(), inputBox=await input.boundingBox();
  expect(inputBox!.x).toBeGreaterThanOrEqual(cellBox!.x);
  expect(inputBox!.y).toBeGreaterThanOrEqual(cellBox!.y);
  expect(inputBox!.x+inputBox!.width).toBeLessThanOrEqual(cellBox!.x+cellBox!.width+1);
  expect(inputBox!.y+inputBox!.height).toBeLessThanOrEqual(cellBox!.y+cellBox!.height+1);
  await page.getByLabel('Formula',{exact:true}).click();
  await expect(stock).not.toHaveClass(/ms-dirty/);
  await expect(page.getByRole('button',{name:'Save',exact:true})).toBeDisabled();
  await stock.click(); await page.keyboard.press('ArrowDown');
  const next=page.locator('.tabulator-row').nth(4).locator('[tabulator-field=stock]');
  await expect(page.getByLabel('Formula',{exact:true})).toHaveValue((await next.textContent())!);
});

test('sorting dialog applies server ordering', async ({page}) => {
  await page.getByRole('button',{name:'Sort',exact:true}).click();
  const dialog=page.locator('dialog');
  await dialog.locator('.ms-condition select').first().selectOption('stock');
  await dialog.locator('.ms-condition select').nth(1).selectOption('desc');
  await dialog.getByRole('button',{name:'Apply',exact:true}).click();
  await expect(page.locator('.tabulator-row').first().locator('[tabulator-field=stock]')).toHaveText('29');
});

test('Ctrl+D fills a selected range and undo restores the batch', async ({page}) => {
  const source=page.locator('.tabulator-row').first().locator('[tabulator-field=price]');
  await source.click();
  await page.getByLabel('Formula',{exact:true}).fill('123.45');
  await page.getByLabel('Formula',{exact:true}).press('Enter');
  await page.keyboard.press('Shift+ArrowDown');
  await expect(page.locator('.ms-selection')).toContainText('2');
  await page.keyboard.press('Control+d');
  await expect(page.locator('.tabulator-row').nth(1).locator('[tabulator-field=price]')).toHaveText('123.45');
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(page.locator('.tabulator-row').nth(1).locator('[tabulator-field=price]')).not.toHaveText('123.45');
});

test('copied positional formulas fail explicitly after changing pages', async ({page}) => {
  await page.locator('.tabulator-row').first().locator('[tabulator-field=price]').click();
  await page.getByLabel('Formula',{exact:true}).fill('=B2+1');
  await page.getByLabel('Formula',{exact:true}).press('Enter');
  const text=await page.evaluate(() => {
    const data=new DataTransfer();
    document.querySelector('.tabulator-row [tabulator-field=price]')!.dispatchEvent(new ClipboardEvent('copy',{bubbles:true,clipboardData:data}));
    return data.getData('text/plain');
  });
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.locator('dialog').getByRole('button',{name:'Discard',exact:true}).click();
  await expect(page).toHaveURL(/offset=200/);
  await page.locator('.tabulator-row').first().locator('[tabulator-field=price]').click();
  await page.evaluate(text => {
    const data=new DataTransfer(); data.setData('text/plain',text);
    document.querySelector('.tabulator-row [tabulator-field=price]')!.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));
  },text);
  await expect(page.locator('span[role=status]')).toContainText('older view');
  await expect(page.getByRole('button',{name:'Save',exact:true})).toBeDisabled();
});
