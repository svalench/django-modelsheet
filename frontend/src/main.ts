import {TabulatorFull as Tabulator} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import './style.css';
import './grid-editors.css';
import {watchActiveCell} from './grid-selection';
import {EditBuffer, encodeTSV, parseTSV, Row} from './buffer';
import {columnName, evaluate, FormulaError, parse, translateFormula} from './formula';
import {translator} from './i18n';

type Field = {name: string; label: string; type: string; editable: boolean; choices: [any, string][]; formula?: string};
type State = {q: string; filter: any; sort: {field: string; dir: string}[]; offset: number; limit: number; columns: string[] | null};
const initial = document.getElementById('modelsheet-state');
if (initial) void start().catch(error => {
  const app = document.getElementById('modelsheet-app');
  if (app) app.textContent = String(error);
});

async function start() {
  const options = JSON.parse(document.getElementById('modelsheet-config')!.textContent!);
  const t = translator(options.language);
  const root = document.getElementById('modelsheet-app')!;
  let state: State = JSON.parse(initial!.textContent!);
  const url = new URL(location.href);
  if (url.searchParams.has('offset') || url.searchParams.has('filter')) {
    for (const key of ['filter', 'sort', 'columns']) if (url.searchParams.has(key)) (state as any)[key] = JSON.parse(url.searchParams.get(key)!);
    for (const key of ['offset', 'limit']) if (url.searchParams.has(key)) (state as any)[key] = Number(url.searchParams.get(key));
    state.q = url.searchParams.get('q') ?? '';
  }
  const csrf = (document.querySelector('[name=csrfmiddlewaretoken]') as HTMLInputElement).value;
  const request = async (route: string, body?: any) => {
    const response = await fetch(options.base + route, {credentials: 'same-origin', headers: body === undefined ? {} : {'Content-Type':'application/json', 'X-CSRFToken':csrf},
      method: body === undefined ? 'GET' : 'POST', body: body === undefined ? undefined : JSON.stringify(body)});
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error?.message ?? `HTTP ${response.status}`) as any;
      error.details = data.error; throw error;
    }
    return data;
  };
  const schema = await request('schema/');
  const fields: Field[] = schema.fields, computed: Field[] = schema.computed;
  const meta = new Map(fields.map(field => [field.name, field]));
  const editable = new Set(fields.filter(field => field.editable).map(field => field.name));
  let buffer = new EditBuffer([], [], editable, ''), snapshot = '', loadedState: State;
  let table: any, active: any, busy = false, count: number | null = null, hasNext = false;
  let savingKey: string | null = null, savingBody = '';
  let renderVersion=0;
  let copied: {text: string; row: number; col: number; snapshot: string} | null = null;
  const errors = new Map<string, string>();
  const conflicts = new Set<string>(), savedCells = new Set<string>();
  const element = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') => {
    const node = document.createElement(tag); node.textContent = text; node.className = className; return node;
  };
  const button = (label: string, action: () => any, parent: HTMLElement, className = '') => {
    const node = element('button', t(label), className); node.type = 'button';
    node.addEventListener('click', () => { Promise.resolve().then(action).catch(showError); }); parent.append(node); return node;
  };
  const toolbar = element('div', '', 'ms-toolbar'); root.append(toolbar);
  const saveButton = button('Save', save, toolbar, 'ms-primary');
  button('Undo', () => { buffer.undo(); render(); }, toolbar);
  button('Redo', () => { buffer.redo(); render(); }, toolbar);
  button('Fill down', fillDown, toolbar);
  const search = element('input'); search.type = 'search'; search.placeholder = t('Search'); search.value = state.q; search.setAttribute('aria-label', t('Search')); toolbar.append(search);
  search.addEventListener('keydown', event => { if (event.key === 'Enter') void safe(async () => { state.q = search.value; state.offset = 0; await load(); }); });
  button('Filters', filterDialog, toolbar);
  button('Sort', sortDialog, toolbar);
  button('Columns', columnsDialog, toolbar);
  if (schema.can_bulk) button('Bulk change', () => safe(bulkDialog), toolbar);
  if (schema.can_history) button('History', historyDialog, toolbar);
  button('Ordinary Admin', () => safe(async () => {
    const data = await request('admin-state/?' + params(state)); location.href = data.url;
  }), toolbar);
  const formulaBar = element('div', '', 'ms-formula-bar'); root.append(formulaBar);
  const address = element('output', 'A1', 'ms-address'); formulaBar.append(address);
  formulaBar.append(element('span', 'ƒx', 'ms-fx'));
  const formulaInput = element('input'); formulaInput.setAttribute('aria-label', 'Formula'); formulaBar.append(formulaInput);
  formulaInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && active) { edit(active.getRow().getData().__modelsheet_pk, active.getField(), formulaInput.value); active.getElement().tabIndex=0; active.getElement().focus(); }
    if (event.key === 'Escape') updateFormulaBar();
  });
  const grid = element('div', '', 'ms-grid'); root.append(grid);
  const footer = element('div', '', 'ms-footer'); root.append(footer);
  const status = element('span', t('Loading')); status.setAttribute('role', 'status'); footer.append(status);
  const selectionInfo = element('span', '', 'ms-selection'); selectionInfo.title = t('Select all matching results in Bulk change'); footer.append(selectionInfo);
  const pageInfo = element('span'); footer.append(pageInfo);
  const previous = button('Previous', () => safe(async () => { state.offset = Math.max(0, state.offset - state.limit); await load(); }), footer);
  const next = button('Next', () => safe(async () => { state.offset += state.limit; await load(); }), footer);
  const filterInfo = element('div', '', 'ms-filter-info'); root.append(filterInfo);

  function params(view: State) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(view)) if (value !== null) query.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    return query.toString();
  }
  function showError(error: any) {
    const messages = error.details?.details;
    const detail = messages && typeof messages === 'object' ? Object.entries(messages).map(([key, value]) => `${meta.get(key)?.label ?? key}: ${String(value)}`).join(' · ') : '';
    status.textContent = `${error.details?.code ?? error.code ?? 'Error'}: ${error.message}${detail ? ' ' + detail : ''}`;
    status.className = 'ms-error';
    if (error.details?.pk) {
      const field = error.details.field;
      const names = field ? [field] : Object.keys(messages && typeof messages === 'object' && Object.keys(messages).length ? messages : buffer.changes[error.details.pk] ?? {});
      for (const name of names) {
        const key = `${error.details.pk}:${name}`;
        errors.set(key, String(messages?.[name] ?? error.message));
        if (error.details.code.includes('conflict')) conflicts.add(key);
      }
      table?.redraw(true);
    }
  }
  function modal(title: string) {
    const dialog = element('dialog', '', 'ms-dialog'); dialog.append(element('h2', t(title)));
    const body = element('div'); dialog.append(body);
    const actions = element('div', '', 'ms-dialog-actions'); dialog.append(actions);
    button('Close', () => dialog.close(), actions);
    dialog.addEventListener('close', () => dialog.remove()); root.append(dialog); dialog.showModal();
    return {dialog, body, actions};
  }
  async function safe(action: () => Promise<any>) {
    try {
      if (buffer.dirty) {
        const decision = await new Promise<string>(resolve => {
          const {dialog, body, actions} = modal('Unsaved edits');
          body.append(element('p', t('Unsaved changes')));
          button('Save', () => { resolve('save'); dialog.close(); }, actions, 'ms-primary');
          button('Discard', () => { resolve('discard'); dialog.close(); }, actions);
          dialog.addEventListener('close', () => resolve('keep'), {once:true});
        });
        if (decision === 'keep') return;
        if (decision === 'save') { await save(); if (buffer.dirty) return; }
        else { buffer.clear(); render(); }
      }
      await action();
    } catch (error) { showError(error); }
  }
  async function load() {
    busy = true; saveButton.disabled = true; status.textContent = t('Loading');
    try {
      const data = await request('rows/?' + params(state));
      snapshot = data.snapshot; state = data.state; loadedState = structuredClone(state);
      buffer = new EditBuffer(data.rows, state.columns!, editable, data.today);
      count = data.count; hasNext = data.has_next; active = null; errors.clear(); conflicts.clear(); savedCells.clear();
      // Keep the copied snapshot identity so pasting positional formulas after a view change fails explicitly.
      history.replaceState({}, '', options.base + '?' + params(state));
      table?.destroy();
      const columns = state.columns!.map((name, index) => {
        const field = meta.get(name)!;
        const definition: any = {title: `${columnName(index)} · ${field.label}`, field: name,
          headerSort: false, width: widths[name] ?? 150, frozen: index < frozen,
          formatter: (cell: any) => formatCell(cell, field),
          headerClick: (event: MouseEvent) => event.altKey && safe(async () => {
            const current = state.sort.find(item => item.field === name);
            const direction = current?.dir === 'asc' ? 'desc' : current?.dir === 'desc' ? null : 'asc';
            const sort = event.shiftKey ? state.sort.filter(item => item.field !== name) : [];
            if (direction) sort.push({field:name, dir:direction});
            state.sort = sort; state.offset = 0; await load();
          }),
        };
        if (field.editable) {
          definition.editor = field.choices.length ? 'list' : 'input';
          if (field.choices.length) definition.editorParams = {values: Object.fromEntries(field.choices)};
          definition.editable = () => !busy;
          definition.mutatorEdit = (value: any) => value;
        }
        return definition;
      });
      for (const field of computed) columns.push({title:`ƒx · ${field.label}`, field:field.name,
        headerSort:false, width:160, formatter:(cell: any) => {
          try {
            const pk = cell.getRow().getData().__modelsheet_pk;
            const current = Object.fromEntries(Object.keys(cell.getRow().getData().__modelsheet_original).map(name => [name, buffer.value(pk, name)]));
            return textNode(evaluate(parse(field.formula!), {fields:current, today:buffer.today,
              column:name => buffer.rows.map(row => buffer.value(row.pk,name))}));
          }
          catch (error) { return textNode(error instanceof FormulaError ? error.code : '#VALUE!'); }
        }} as any);
      table = new Tabulator(grid, {
        data: tableData(), index: '__modelsheet_pk', columns, height: 'min(64vh, 660px)', layout:'fitDataStretch',
        placeholder: t('No matching records'), selectableRange:1, selectableRangeColumns:true,
        selectableRangeRows:true, selectableRangeClearCells:false, editTriggerEvent:'dblclick',
        rowHeader:{field:'_rownum', formatter:'rownum', width:55, frozen:true, headerSort:false, hozAlign:'center'},
        clipboard:false,
      } as any);
      watchActiveCell(table, cell => { active = cell; updateFormulaBar(); });
      table.on('cellEditing', (cell: any) => { cell.setValue(buffer.raw(cell.getRow().getData().__modelsheet_pk, cell.getField()), false); });
      table.on('cellEdited', (cell: any) => { active = cell; edit(cell.getRow().getData().__modelsheet_pk, cell.getField(), cell.getValue()); });
      table.on('rangeChanged', () => { const cells = selected(); selectionInfo.textContent = `${new Set(cells.map(c => c.getRow().getData().__modelsheet_pk)).size} ${t('Selected rows on this page')}`; });
      table.on('columnResized', (column: any) => { widths[column.getField()] = column.getWidth(); storePreferences(); });
      await new Promise<void>(resolve => table.on('tableBuilt', () => resolve()));
      pageInfo.textContent = `${state.offset + (data.rows.length ? 1 : 0)}–${state.offset + data.rows.length}${count === null ? '' : ' / ' + count}`;
      previous.disabled = state.offset === 0; next.disabled = !hasNext;
      filterInfo.textContent = `${state.sort.map(item => `${meta.get(item.field)?.label ?? 'PK'} ${item.dir === 'asc' ? '↑' : '↓'}`).join(' · ')}${Object.keys(state.filter).length ? ' · ' + JSON.stringify(state.filter) : ''}`;
      status.className = ''; status.textContent = t('Ready');
    } finally { busy = false; saveButton.disabled = !buffer.dirty; }
  }
  function textNode(value: any) { return element('span', value === null || value === undefined ? '' : String(value)); }
  function tableData() { return buffer.rows.map(row => ({__modelsheet_pk:row.pk, __modelsheet_original:row.values, ...row.values, ...buffer.changes[row.pk], ...Object.fromEntries(computed.map(field => [field.name,renderVersion]))})); }
  function formatCell(cell: any, field: Field) {
    const pk = cell.getRow().getData().__modelsheet_pk, name = field.name, node = textNode('');
    cell.getElement().classList.toggle('ms-readonly', !field.editable);
    cell.getElement().classList.toggle('ms-dirty', Object.hasOwn(buffer.changes[pk] ?? {}, name));
    cell.getElement().classList.toggle('ms-cell-error', errors.has(`${pk}:${name}`));
    cell.getElement().classList.toggle('ms-cell-conflict', conflicts.has(`${pk}:${name}`));
    cell.getElement().classList.toggle('ms-cell-saving', busy && Object.hasOwn(buffer.changes[pk] ?? {}, name));
    cell.getElement().classList.toggle('ms-cell-saved', savedCells.has(`${pk}:${name}`));
    try {
      const value = buffer.value(pk, name);
      node.textContent = field.choices.find(([key]) => key === value)?.[1] ?? (value === null ? '∅' : String(value));
      if (field.type === 'DateTimeField' && value) node.textContent = new Intl.DateTimeFormat(options.language,{dateStyle:'short',timeStyle:'medium',timeZone:schema.timezone ?? 'UTC'}).format(new Date(String(value)));
    } catch (error) { node.textContent = error instanceof FormulaError ? error.code : '#VALUE!'; node.className = 'ms-error'; }
    if (errors.has(`${pk}:${name}`)) node.title = errors.get(`${pk}:${name}`)!;
    return node;
  }
  function updateFormulaBar() {
    if (!active) return;
    const pk = active.getRow().getData().__modelsheet_pk, name = active.getField();
    const virtual = computed.find(field => field.name === name);
    address.textContent = virtual ? `ƒx · ${virtual.label}` : `${columnName(state.columns!.indexOf(name))}${buffer.rows.findIndex(row => row.pk === pk) + 1}`;
    formulaInput.value = virtual?.formula ?? String(buffer.raw(pk, name) ?? ''); formulaInput.disabled = !editable.has(name);
  }
  function edit(pk: string, field: string, value: any) {
    buffer.apply([{pk, field, value}]); errors.delete(`${pk}:${field}`); conflicts.delete(`${pk}:${field}`); savedCells.delete(`${pk}:${field}`); savingKey = null; render();
  }
  function render() {
    if (busy) return;
    // Update rows directly: table.updateData reprocesses all data and resets ranges/focus.
    const current = table;
    renderVersion++;
    if (current) void Promise.all(tableData().map(row => current.getRow(row.__modelsheet_pk).update(row))).catch(showError);
    saveButton.disabled = !buffer.dirty;
    status.className = ''; status.textContent = buffer.dirty ? `${t('Changed rows')}: ${Object.keys(buffer.changes).length}` : t('Ready');
    updateFormulaBar();
  }
  async function save() {
    if (!buffer.dirty || busy) return;
    busy = true; saveButton.disabled = true; status.textContent = t('Saving');
    const body = {snapshot, view_state:loadedState, changes:buffer.payload()};
    table?.redraw(true);
    const serialized = JSON.stringify(body);
    if (serialized !== savingBody || !savingKey) { savingBody = serialized; savingKey = crypto.randomUUID(); }
    try {
      await request('save/', {...body, idempotency_key:savingKey});
      buffer.clear(); savingKey = null; await load(); status.textContent = '✓ ' + t('Saved');
      for (const change of body.changes) for (const field of Object.keys(change.values)) savedCells.add(`${change.pk}:${field}`);
      table?.redraw(true);
    } catch (error) { showError(error); throw error; }
    finally { busy = false; saveButton.disabled = !buffer.dirty; }
  }
  function selected(): any[] { return table?.getRanges()?.flatMap((range: any) => range.getCells().flat())?.filter((cell: any) => meta.has(cell.getField())) ?? []; }
  function selectionBounds() {
    const cells = selected();
    if (!cells.length && active) cells.push(active);
    if (!cells.length) throw new Error(t('No rows selected'));
    const points = cells.map(cell => [buffer.rows.findIndex(row => row.pk === cell.getRow().getData().__modelsheet_pk), state.columns!.indexOf(cell.getField())]);
    return {top:Math.min(...points.map(p => p[0])), bottom:Math.max(...points.map(p => p[0])), left:Math.min(...points.map(p => p[1])), right:Math.max(...points.map(p => p[1]))};
  }
  function fillDown() {
    const bounds = selectionBounds(), edits = [];
    for (let row = bounds.top + 1; row <= bounds.bottom; row++) for (let col = bounds.left; col <= bounds.right; col++) {
      const raw = buffer.transferValue(buffer.rows[bounds.top].pk, state.columns![col]);
      edits.push({pk:buffer.rows[row].pk, field:state.columns![col], value:typeof raw === 'string' ? translateFormula(raw, row - bounds.top, 0) : raw});
    }
    const skipped = buffer.apply(edits); render(); if (skipped) status.textContent = `${t('Readonly cells skipped')}: ${skipped}`;
  }
  root.addEventListener('keydown', event => {
    const target = event.target as HTMLElement;
    if (target.matches('input, textarea, select') || target.closest('dialog')) return;
    if (event.ctrlKey || event.metaKey) {
      if (['z','y','d','s'].includes(event.key.toLowerCase())) event.stopImmediatePropagation();
      if (event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? buffer.redo() : buffer.undo(); render(); }
      if (event.key.toLowerCase() === 'y') { event.preventDefault(); buffer.redo(); render(); }
      if (event.key.toLowerCase() === 'd') { event.preventDefault(); try { fillDown(); } catch (error) { showError(error); } }
      if (event.key.toLowerCase() === 's') { event.preventDefault(); void save().catch(showError); }
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault(); buffer.apply(selected().map(cell => ({pk:cell.getRow().getData().__modelsheet_pk, field:cell.getField(), value:null}))); render();
    }
  },true);
  root.addEventListener('copy', event => copyRange(event, false));
  root.addEventListener('cut', event => copyRange(event, true));
  function copyRange(event: ClipboardEvent, cut: boolean) {
    if ((event.target as HTMLElement).matches('input,textarea') || (event.target as HTMLElement).closest('dialog')) return;
    try {
      const bounds = selectionBounds(), values = [];
      for (let row = bounds.top; row <= bounds.bottom; row++) {
        const cells = []; for (let col = bounds.left; col <= bounds.right; col++) {
          cells.push(buffer.transferValue(buffer.rows[row].pk,state.columns![col]));
        }
        values.push(cells);
      }
      const text = encodeTSV(values); event.clipboardData?.setData('text/plain', text); event.preventDefault();
      copied = {text, row:bounds.top, col:bounds.left, snapshot};
      if (cut) { buffer.apply(selected().map(cell => ({pk:cell.getRow().getData().__modelsheet_pk, field:cell.getField(), value:null}))); render(); }
    } catch (error) { showError(error); }
  }
  root.addEventListener('paste', event => {
    if ((event.target as HTMLElement).matches('input,textarea') || (event.target as HTMLElement).closest('dialog')) return;
    event.preventDefault();
    try {
      const text = event.clipboardData?.getData('text/plain') ?? '', values = parseTSV(text), bounds = selectionBounds(), edits = [];
      if (values.length > schema.max_save_rows || text.length > 1000000) throw new Error('Paste exceeds configured limits');
      for (let r = 0; r < values.length; r++) for (let c = 0; c < values[r].length; c++) {
        if (!buffer.rows[bounds.top + r] || !state.columns![bounds.left + c]) throw new FormulaError('#REF!', 'Paste extends beyond the loaded page');
        let value: string | null = values[r][c] === '' ? null : values[r][c];
        if (value?.startsWith('=') && editable.has(state.columns![bounds.left+c])) {
          const refs = referencesForPaste(value);
          if (copied && copied.text === text && refs) {
            if (copied.snapshot !== snapshot) throw new FormulaError('#REF!', 'Copied positional formulas belong to an older view');
            value = translateFormula(value, bounds.top - copied.row, bounds.left - copied.col);
          }
        }
        edits.push({pk:buffer.rows[bounds.top + r].pk, field:state.columns![bounds.left + c], value});
      }
      const skipped = buffer.apply(edits); render(); if (skipped) status.textContent = `${t('Readonly cells skipped')}: ${skipped}`;
    } catch (error) { showError(error); }
  });
  function referencesForPaste(value: string) { return /\$?[A-Za-z]+\$?[1-9][0-9]*/.test(value.replace(/"(?:[^"]|"")*"|\[[^\]]*\]/g, '')); }
  window.addEventListener('beforeunload', event => { if (buffer.dirty) { event.preventDefault(); event.returnValue = ''; } });

  function select(items: [string, string][], value: string) {
    const node = element('select'); for (const [key, label] of items) { const option = element('option', label); option.value = key; node.append(option); }
    node.value = value; return node;
  }
  function filterGroup(value: any = {}): {node: HTMLElement; read: () => any} {
    const node = element('fieldset', '', 'ms-filter-group');
    const mode = select([['and','AND'],['or','OR']], value.or ? 'or' : 'and'); node.append(mode);
    const children: {node: HTMLElement; read: () => any}[] = [];
    function attach(child: {node: HTMLElement; read: () => any}) {
      children.push(child); node.append(child.node); button('Remove', () => { children.splice(children.indexOf(child),1); child.node.remove(); }, child.node);
    }
    const condition = (item: any = {}) => {
      const row = element('div', '', 'ms-condition');
      const field = select(fields.map(f => [f.name, f.label]), item.field ?? fields[0]?.name ?? '');
      const op = select(['eq','ne','lt','lte','gt','gte','in','not_in','isnull','contains'].map(x => [x,x]), item.op ?? 'eq');
      const input = element('input'); input.placeholder = 'Value / comma-separated list'; input.value = Array.isArray(item.value) ? item.value.join(',') : String(item.value ?? '');
      row.append(field, op, input);
      return {node:row, read:() => ({field:field.value, op:op.value,
        value:op.value === 'isnull' ? ['true','1'].includes(input.value.toLowerCase()) : ['in','not_in'].includes(op.value) ? input.value.split(',').map(x => x.trim()) : input.value})};
    };
    button('Add condition', () => attach(condition()), node);
    button('Add group', () => attach(filterGroup()), node);
    for (const item of value.and ?? value.or ?? (Object.keys(value).length ? [value] : [])) attach(item.and || item.or ? filterGroup(item) : condition(item));
    return {node, read:() => children.length ? {[mode.value]: children.map(child => child.read())} : {}};
  }
  function filterDialog() {
    const {dialog, body, actions} = modal('Filters'), builder = filterGroup(state.filter); body.append(builder.node);
    button('Apply', () => safe(async () => { state.filter = builder.read(); state.offset = 0; await load(); dialog.close(); }), actions, 'ms-primary');
  }
  function sortDialog() {
    const {dialog,body,actions} = modal('Sort');
    const sorts: {node:HTMLElement; field:HTMLSelectElement; direction:HTMLSelectElement}[] = [];
    function add(item = {field:fields[0]?.name ?? '',dir:'asc'}) {
      if (sorts.length >= 10) return;
      const node = element('div','','ms-condition'), field = select([['pk','PK'],...fields.map(f => [f.name,f.label] as [string,string])],item.field);
      const direction = select([['asc',t('Ascending')],['desc',t('Descending')]],item.dir);
      node.append(field,direction); body.append(node); const entry={node,field,direction}; sorts.push(entry);
      button('Remove',() => { sorts.splice(sorts.indexOf(entry),1); node.remove(); },node);
    }
    state.sort.forEach(add); if (!sorts.length) add();
    button('Add sort',() => add(),body);
    button('Apply',() => safe(async () => { state.sort=sorts.map(item => ({field:item.field.value,dir:item.direction.value})); state.offset=0; await load(); dialog.close(); }),actions,'ms-primary');
  }
  const preferenceKey = 'modelsheet:' + options.base;
  let preferences: any = {};
  try { preferences = JSON.parse(localStorage.getItem(preferenceKey) ?? '{}'); } catch { /* Optional local preferences. */ }
  const widths: Record<string, number> = preferences.widths ?? {};
  let frozen: number = preferences.frozen ?? 0;
  function storePreferences() { try { localStorage.setItem(preferenceKey, JSON.stringify({widths, frozen})); } catch { /* Storage may be disabled. */ } }
  function columnsDialog() {
    const {dialog, body, actions} = modal('Columns');
    const order = [...state.columns!, ...fields.map(f => f.name).filter(name => !state.columns!.includes(name))];
    const checks = new Map<string, HTMLInputElement>();
    for (const name of order) {
      const row = element('div', '', 'ms-condition'), label = element('label', meta.get(name)!.label), check = element('input');
      check.type = 'checkbox'; check.checked = state.columns!.includes(name); checks.set(name, check); label.prepend(check); row.append(label); body.append(row);
      button('↑', () => { const index = order.indexOf(name); if (index > 0) { [order[index-1], order[index]] = [name, order[index-1]]; row.previousElementSibling?.before(row); } }, row);
    }
    const freeze = element('input'); freeze.type = 'number'; freeze.min = '0'; freeze.max = String(fields.length); freeze.value = String(frozen);
    body.append(element('label', t('Frozen columns')), freeze);
    button('Apply', () => safe(async () => {
      state.columns = order.filter(name => checks.get(name)!.checked); frozen = Math.max(0, Math.min(state.columns.length, Number(freeze.value))); storePreferences();
      await load(); dialog.close();
    }), actions, 'ms-primary');
  }
  async function bulkDialog() {
    const {dialog, body, actions} = modal('Bulk change');
    const scope = select([['all',t('All filtered rows')],['selected',t('Selected rows on this page')]], 'all'); body.append(scope);
    const builder = filterGroup(state.filter); body.append(builder.node);
    const assignmentBox = element('div'); body.append(assignmentBox);
    const assignments: {field: HTMLSelectElement; input: HTMLInputElement; node: HTMLElement}[] = [];
    function addAssignment() {
      const node = element('div', '', 'ms-condition'), field = select(fields.filter(f => f.editable).map(f => [f.name,f.label]), fields.find(f => f.editable)?.name ?? '');
      const input = element('input'); input.placeholder = t('Value or formula'); node.append(field, input); assignmentBox.append(node);
      const item = {field,input,node}; assignments.push(item); button('Remove', () => { assignments.splice(assignments.indexOf(item),1); node.remove(); }, node);
    }
    addAssignment(); button('Add assignment', addAssignment, body);
    const output = element('div', '', 'ms-report'); body.append(output);
    let operation: any = null, timer: ReturnType<typeof setTimeout> | null = null;
    const confirmButton = button('Confirm', async () => {
      if (!operation || !window.confirm(`${t('Confirm')}: ${operation.total} records?`)) return;
      try { operation = await request('bulk/run/', {operation:operation.id}); display(); } catch (error: any) { output.textContent = `${error.details?.code}: ${error.message}`; }
    }, actions, 'ms-primary'); confirmButton.disabled = true;
    const previewButton = button('Preview', async () => {
      try {
        const values: Record<string, string> = {};
        for (const item of assignments) { if (Object.hasOwn(values,item.field.value)) throw new Error('Duplicate assignment'); values[item.field.value] = item.input.value; }
        const selection = scope.value === 'selected' ? [...new Set(selected().map(cell => cell.getRow().getData().__modelsheet_pk))] : null;
        operation = await request('bulk/preview/', {state:{...state, filter:builder.read()}, assignments:values, selection, snapshot,
          idempotency_key:crypto.randomUUID()}); display();
      } catch (error: any) { output.textContent = `${error.details?.code ?? 'Error'}: ${error.message}`; }
    }, actions);
    const cancelButton = button('Cancel', async () => { if (operation) { operation = await request(`operations/${operation.id}/cancel/`, {}); display(); } }, actions);
    const resumeButton = button('Resume', async () => { if (operation) { operation = await request(`operations/${operation.id}/resume/`, {}); display(); } }, actions);
    function display() {
      output.replaceChildren(); if (operation) operationReport(output,operation);
      confirmButton.disabled = !operation || operation.status !== 'preview' || operation.errors > 0;
      previewButton.disabled = ['preparing','queued','running'].includes(operation?.status);
      cancelButton.disabled = !operation || ['done','partial','failed','cancelled'].includes(operation.status);
      const expiredWorker = operation && ['running','preparing','queued'].includes(operation.status) && operation.lease_until && new Date(operation.lease_until).getTime() < Date.now();
      resumeButton.disabled = !operation || (!['cancelled','dispatch_failed','failed'].includes(operation.status) && !expiredWorker);
      if (timer) clearTimeout(timer);
      if (['preparing','queued','running'].includes(operation?.status)) timer = setTimeout(async () => {
        if (!dialog.open) return;
        try { operation = await request(`operations/${operation.id}/`); display(); } catch (error: any) { output.textContent = error.message; }
      }, 1500);
    }
    body.addEventListener('input', () => { operation = null; confirmButton.disabled = true; output.textContent = ''; });
    dialog.addEventListener('close', () => { if (timer) clearTimeout(timer); if (operation?.changed && !buffer.dirty) void load().catch(showError); });
    display();
  }
  async function historyDialog() {
    const {body} = modal('History');
    async function historyPage(offset=0) {
      const data = await request('history/?offset='+offset);
      for (const op of data.operations) {
        const card = element('div','','ms-history-entry'); body.append(card);
        card.append(element('p',`${new Date(op.created_at).toLocaleString(options.language)} · ${t(op.status)} · ${op.changed}/${op.total}`));
        button('Details',async () => {
          const data=await request(`operations/${op.id}/`), container=element('div','','ms-report');
          card.append(container); operationReport(container,data);
        },card);
      }
      if (data.has_next) {
        const nextPage=button('Next',async () => { nextPage.remove(); await historyPage(offset+20); },body);
      }
    }
    await historyPage();
  }
  function operationReport(container: HTMLElement, operation: any) {
    container.append(element('p',`${t(operation.status)} · ${t('Matched')}: ${operation.total} · ${t('Changed rows')}: ${operation.changed} · ${t('Errors')}: ${operation.errors}`));
    const resultTable=element('table'), head=element('thead'), labels=element('tr');
    for (const name of ['PK','Status','Before','After','Error']) labels.append(element('th',t(name)));
    head.append(labels); resultTable.append(head); const body=element('tbody'); resultTable.append(body);
    function appendItems(items: any[]) {
      for (const item of items) {
        const row=element('tr');
        const values=(data:Record<string,any>) => Object.entries(data).map(([key,value]) => `${meta.get(key)?.label ?? key}: ${value === null ? '∅' : String(value)}`).join('\n');
        const detail=item.error?.details ? values(item.error.details) : item.error?.message ?? '';
        for (const value of [item.pk,t(item.status),values(item.before),values(item.after),detail]) row.append(element('td',value));
        body.append(row);
      }
    }
    appendItems(operation.items); container.append(resultTable);
    if (operation.has_next) {
      const more=button('Next',async () => {
        const data=await request(`operations/${operation.id}/?offset=${operation.next_offset}`);
        more.remove(); const extra=element('div'); container.append(extra); operationReport(extra,data);
      },container);
    }
  }
  await load();
}
