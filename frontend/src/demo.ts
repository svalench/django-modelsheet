import {TabulatorFull as Tabulator} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import './demo.css';
import {DemoSession, DemoValidationError, demoColumns} from './demo-session';
import {encodeTSV, parseTSV} from './buffer';
import {columnName, FormulaError, translateFormula} from './formula';

const messages = {
  en: {
    title:'Product workspace', badge:'BROWSER-ONLY DEMO', name:'Product', price:'Price', stock:'Stock', status:'Status',
    names:['Ceramic cup','Linen tote bag','Desk lamp','Notebook','Glass vase','Water bottle'],
    ready:'In stock', order:'On order', save:'Save in demo', undo:'Undo', redo:'Redo', reset:'Reset data', fill:'Fill down',
    formula:'Value or formula for the selected cell', apply:'Apply', inventory:'Inventory value', changed:'Changed cells',
    hint:'Double-click a cell to edit. Or select it and enter a value or formula above.',
    local:'Everything stays in this tab. Refreshing resets the demo. No Django server or database is connected.',
    clean:'Ready to edit', dirty:'Pending changes', saved:'Saved in this tab. Formulas became values; Undo starts fresh.',
    presets:'Try a scenario', markup:'Prices +7%', statusPreset:'Status from stock', average:'Average of B2:B6 → B1',
    failed:'Nothing saved. Fix the highlighted cells and try again.', resetDone:'Original sample data restored.',
    number:'Enter a number or a numeric formula.', bounds:'Use a nonnegative value within the demo limit.',
    integer:'Stock must be a whole number.', statusError:'Status must be ready or order.',
    nameError:'Use a nonempty name, at most 100 characters.', unique:'Product names must be unique.',
    select:'Select at least two rows in one or more columns to fill down.', paste:'Paste must fit inside the six-row table (maximum 10,000 characters).',
    error:'Error', loading:'Loading the live table…', loadError:'Unable to load the demo. Please reload.',
  },
  zh: {
    title:'商品工作区', badge:'纯浏览器演示', name:'商品', price:'价格', stock:'库存', status:'状态',
    names:['陶瓷杯','亚麻购物袋','台灯','笔记本','玻璃花瓶','水瓶'], ready:'有货', order:'待订货',
    save:'在演示中保存', undo:'撤销', redo:'重做', reset:'重置数据', fill:'向下填充',
    formula:'所选单元格的值或公式', apply:'应用', inventory:'库存金额', changed:'已改单元格',
    hint:'双击单元格进行编辑，或选中后在上方输入值或公式。',
    local:'所有更改仅在此标签页内生效，刷新会重置演示。未连接 Django 服务器或数据库。',
    clean:'可以开始编辑', dirty:'有待保存更改', saved:'已保存在此标签页。公式已转为值，撤销历史已重置。',
    presets:'试用场景', markup:'涨价 7%', statusPreset:'按库存设状态', average:'B2:B6 平均值 → B1',
    failed:'未保存任何更改。请修正高亮单元格后重试。', resetDone:'已恢复初始示例数据。',
    number:'请输入数字或数值公式。', bounds:'请输入演示范围内的非负值。', integer:'库存必须是整数。',
    statusError:'状态值必须为 ready 或 order。', nameError:'名称不能为空，最多 100 个字符。', unique:'商品名称不能重复。',
    select:'请选择至少两行，再执行向下填充。', paste:'粘贴内容不得超出六行表格，最多 10,000 个字符。',
    error:'错误', loading:'正在加载交互式表格…', loadError:'无法加载演示，请刷新页面。',
  },
  be: {
    title:'Працоўная табліца тавараў', badge:'ДЭМА Ў БРАЎЗЕРЫ', name:'Тавар', price:'Цана', stock:'Запас', status:'Статус',
    names:['Керамічны кубак','Ільняная торба','Настольная лямпа','Нататнік','Шкляная ваза','Бутэлька для вады'],
    ready:'У наяўнасці', order:'Пад заказ', save:'Захаваць у дэма', undo:'Адмяніць', redo:'Паўтарыць', reset:'Скінуць даныя', fill:'Запоўніць уніз',
    formula:'Значэнне або формула выбранай ячэйкі', apply:'Ужыць', inventory:'Кошт запасаў', changed:'Змененыя ячэйкі',
    hint:'Двойчы націсніце ячэйку або выберыце яе і ўвядзіце значэнне ці формулу вышэй.',
    local:'Усё застаецца ў гэтай укладцы. Перазагрузка скідае дэма. Злучэння з Django або базай даных няма.',
    clean:'Можна рэдагаваць', dirty:'Незахаваныя змены', saved:'Захавана ў гэтай укладцы. Формулы сталі значэннямі; гісторыя адмены пачынаецца нанова.',
    presets:'Паспрабуйце сцэнар', markup:'Цэны +7%', statusPreset:'Статус паводле запасу', average:'Сярэдняе B2:B6 → B1',
    failed:'Нічога не захавана. Выпраўце вылучаныя ячэйкі і паўтарыце.', resetDone:'Зыходныя даныя адноўленыя.',
    number:'Увядзіце лік або лікавую формулу.', bounds:'Значэнне мусіць быць неадмоўным і ў межах дэма.',
    integer:'Запас мусіць быць цэлым лікам.', statusError:'Статус мусіць быць ready або order.',
    nameError:'Назва не можа быць пустой або даўжэйшай за 100 знакаў.', unique:'Назвы тавараў мусяць быць унікальнымі.',
    select:'Вылучыце прынамсі два радкі для запаўнення ўніз.', paste:'Устаўка мусіць змяшчацца ў шэсць радкоў, да 10 000 знакаў.',
    error:'Памылка', loading:'Загрузка жывой табліцы…', loadError:'Не ўдалося загрузіць дэма. Перазагрузіце старонку.',
  },
};

const root = document.getElementById('modelsheet-live-demo');
if (root) void start(root).catch(() => {
  const locale = document.documentElement.lang;
  root.textContent = messages[locale === 'be' ? 'be' : locale === 'zh' ? 'zh' : 'en'].loadError;
});

async function start(root: HTMLElement) {
  const locale = document.documentElement.lang;
  const t = messages[locale === 'be' ? 'be' : locale === 'zh' ? 'zh' : 'en'];
  const session = new DemoSession(t.names);
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', css = '') => {
    const node = document.createElement(tag); node.textContent = text; node.className = css; return node;
  };
  root.replaceChildren();
  const heading = el('div', '', 'demo-heading');
  heading.append(el('strong', t.title), el('span', t.badge, 'demo-badge')); root.append(heading);
  const toolbar = el('div', '', 'demo-toolbar'); root.append(toolbar);
  let active = {pk:'1', field:'price'};
  let table: any;
  const errors = new Map<string, string>();
  const act = (fn: () => void) => { try { fn(); } catch (error) { report(error); } };
  const button = (label: string, fn: () => void, parent: HTMLElement, css = '') => {
    const node = el('button', label, css); node.type = 'button'; node.addEventListener('click', () => act(fn)); parent.append(node); return node;
  };
  const saveButton = button(t.save, () => {
    try { session.save(); render(t.saved); }
    catch (error) { render(t.failed); report(error, t.failed); }
  }, toolbar, 'demo-primary');
  button('↶ ' + t.undo, () => { session.buffer.undo(); render(); }, toolbar);
  button('↷ ' + t.redo, () => { session.buffer.redo(); render(); }, toolbar);
  button(t.fill, fillDown, toolbar);
  button(t.reset, () => { session.reset(); render(t.resetDone); }, toolbar, 'demo-reset');
  const bar = el('form', '', 'demo-formula-bar');
  const address = el('span', 'B1', 'demo-address');
  const formula = el('input'); formula.type = 'text'; formula.maxLength = 500;
  formula.setAttribute('aria-label', t.formula); formula.spellcheck = false; formula.autocomplete = 'off';
  const apply = el('button', t.apply); apply.type = 'submit';
  bar.append(address, el('span', 'fx', 'demo-fx'), formula, apply); root.append(bar);
  bar.addEventListener('submit', event => {
    event.preventDefault(); act(() => { session.buffer.apply([{...active, value:formula.value}]); render(); });
  });
  root.append(el('p', t.hint, 'demo-hint'));
  const grid = el('div', '', 'demo-grid'); grid.setAttribute('aria-label', t.title); root.append(grid);
  const stats = el('div', '', 'demo-stats');
  const total = el('strong'); const count = el('strong');
  const inventory = el('div', t.inventory + ' '); inventory.append(total);
  const changes = el('div', t.changed + ' '); changes.append(count); stats.append(inventory, changes); root.append(stats);
  const presets = el('div', '', 'demo-presets'); presets.append(el('span', t.presets));
  for (const [label, kind] of [[t.markup,'markup'],[t.statusPreset,'status'],[t.average,'average']]) {
    button(label, () => { session.preset(kind); active = {pk:'1', field:kind === 'status' ? 'status' : 'price'}; render(); selectActive(); }, presets);
  }
  root.append(presets);
  const status = el('div', t.loading, 'demo-status'); status.setAttribute('role', 'status'); root.append(status);
  root.append(el('p', t.local, 'demo-local'));

  function message(error: unknown): string {
    if (error instanceof FormulaError) return error.code;
    if (error instanceof DemoValidationError) {
      return ({number:t.number,bounds:t.bounds,integer:t.integer,status:t.statusError,name:t.nameError,unique:t.unique} as Record<string,string>)[error.code];
    }
    return error instanceof Error ? error.message : t.error;
  }
  function report(error: unknown, prefix = '') {
    const cell = error instanceof DemoValidationError ? `${columnName(demoColumns.indexOf(error.field))}${error.pk}: ` : '';
    status.textContent = [prefix,cell + message(error)].filter(Boolean).join(' ');
    status.classList.add('demo-error-text');
    if (error instanceof DemoValidationError) {
      errors.set(`${error.pk}:${error.field}`, message(error));
      table.getRow(error.pk).reformat();
    }
  }
  function updateBar() {
    address.textContent = `${columnName(demoColumns.indexOf(active.field))}${active.pk}`;
    formula.value = String(session.buffer.raw(active.pk, active.field) ?? '');
  }
  function render(text?: string) {
    errors.clear();
    for (const row of session.buffer.rows) {
      table.getRow(row.pk).update({...row.values, ...session.buffer.changes[row.pk]});
      table.getRow(row.pk).reformat();
    }
    let problem = false;
    for (const row of session.buffer.rows) for (const field of demoColumns) {
      try { session.value(row.pk, field); } catch { problem = true; }
    }
    saveButton.disabled = !session.buffer.dirty;
    count.textContent = String(session.changedCells);
    try { total.textContent = session.total().toFixed(2); } catch { total.textContent = '—'; }
    status.textContent = text ?? (session.buffer.dirty ? t.dirty : t.clean);
    status.classList.toggle('demo-error-text', problem);
    updateBar();
  }
  function selected(): any[] { return table.getRanges().flatMap((range: any) => range.getCells().flat()).filter((cell: any) => demoColumns.includes(cell.getField())); }
  function bounds() {
    const cells = selected();
    const positions = cells.length ? cells.map(cell => [Number(cell.getRow().getIndex()) - 1, demoColumns.indexOf(cell.getField())])
      : [[Number(active.pk) - 1, demoColumns.indexOf(active.field)]];
    return {top:Math.min(...positions.map(p=>p[0])),bottom:Math.max(...positions.map(p=>p[0])),
      left:Math.min(...positions.map(p=>p[1])),right:Math.max(...positions.map(p=>p[1]))};
  }
  function fillDown() {
    const b = bounds(), edits = [];
    if (b.top === b.bottom) throw new Error(t.select);
    for (let r = b.top + 1; r <= b.bottom; r++) for (let c = b.left; c <= b.right; c++) {
      let value = session.buffer.transferValue(String(b.top + 1), demoColumns[c]);
      if (typeof value === 'string' && value.startsWith('=')) value = translateFormula(value, r - b.top, 0);
      edits.push({pk:String(r+1),field:demoColumns[c],value});
    }
    session.buffer.apply(edits); render();
  }
  function selectActive() {
    const cell = table.getRow(active.pk).getCell(active.field);
    const range = table.getRanges()[0];
    if (range) range.setBounds(cell, cell); else table.addRange(cell, cell);
  }
  table = new Tabulator(grid, {
    data:session.buffer.rows.map(row => ({pk:row.pk,...row.values})), index:'pk',
    height:300, layout:'fitDataStretch', editTriggerEvent:'dblclick',
    selectableRange:1, selectableRangeRows:true, selectableRangeColumns:true,
    selectableRangeClearCells:false, clipboard:false,
    rowHeader:{formatter:'rownum', width:44, frozen:true, headerSort:false, hozAlign:'center'},
    columns:demoColumns.map((field, i) => ({title:`${columnName(i)} · ${t[field as keyof typeof t]}`,
      field, width:field === 'name' ? 225 : 155, headerSort:false, editor:'input',
      editorParams:{elementAttributes:{maxlength:'500','aria-label':`${columnName(i)} · ${t[field as keyof typeof t]}`}},
      formatter:(cell: any) => {
        const pk = cell.getRow().getIndex(), node = el('span');
        cell.getElement().classList.toggle('demo-dirty', Object.hasOwn(session.buffer.changes[pk] ?? {},field));
        cell.getElement().classList.remove('demo-cell-error');
        try {
          const value = session.value(pk,field);
          node.textContent = field === 'price' ? value.toFixed(2) : field === 'status' ? (value === 'ready' ? t.ready : t.order) : String(value);
          if (errors.has(`${pk}:${field}`)) throw new Error(errors.get(`${pk}:${field}`));
        } catch (error) {
          node.textContent = error instanceof FormulaError ? error.code : String(session.buffer.raw(pk,field));
          node.title = message(error); cell.getElement().classList.add('demo-cell-error');
        }
        return node;
      },
    })),
  } as any);
  table.on('cellClick', (_event: unknown, cell: any) => { active={pk:cell.getRow().getIndex(),field:cell.getField()}; updateBar(); });
  table.on('cellEditing', (cell: any) => { cell.setValue(session.buffer.raw(cell.getRow().getIndex(),cell.getField()), false); });
  table.on('cellEdited', (cell: any) => {
    active={pk:cell.getRow().getIndex(),field:cell.getField()};
    act(() => { session.buffer.apply([{...active,value:cell.getValue()}]); render(); });
  });
  root.addEventListener('keydown', event => {
    if ((event.target as HTMLElement).matches('input,textarea,select')) return;
    if (!event.ctrlKey && !event.metaKey) return;
    const key = event.key.toLowerCase();
    if (!['z','y','d','s'].includes(key)) return;
    event.preventDefault(); event.stopPropagation();
    act(() => {
      if (key === 's') { saveButton.click(); return; }
      if (key === 'd') { fillDown(); return; }
      if (key === 'y' || event.shiftKey) session.buffer.redo(); else session.buffer.undo();
      render();
    });
  });
  root.addEventListener('paste', event => {
    if ((event.target as HTMLElement).matches('input,textarea')) return;
    event.preventDefault(); act(() => {
      const source = event.clipboardData?.getData('text/plain') ?? '';
      if (source.length > 10000) throw new Error(t.paste);
      const rows = parseTSV(source), b = bounds(), edits = [];
      if (rows.length + b.top > 6 || rows.some(row => row.length + b.left > 4)) throw new Error(t.paste);
      for (let r=0;r<rows.length;r++) for (let c=0;c<rows[r].length;c++) edits.push({pk:String(b.top+r+1),field:demoColumns[b.left+c],value:rows[r][c]});
      session.buffer.apply(edits); render();
    });
  });
  root.addEventListener('copy', event => {
    if ((event.target as HTMLElement).matches('input,textarea')) return;
    act(() => {
      const b = bounds(), rows = [];
      for (let r=b.top;r<=b.bottom;r++) rows.push(demoColumns.slice(b.left,b.right+1).map(field => session.value(String(r+1),field)));
      event.clipboardData?.setData('text/plain',encodeTSV(rows)); event.preventDefault();
    });
  });
  await new Promise<void>(resolve => table.on('tableBuilt',resolve));
  render(); selectActive();
}
