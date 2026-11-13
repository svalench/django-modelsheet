import {TabulatorFull as Tabulator} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import './style.css';
import './grid-editors.css';
import {watchActiveCell} from './grid-selection';
import {EditBuffer, encodeTSV, parseTSV} from './buffer';
import {fillRightEdits, findReplaceEdits} from './edits';
import {FILTER_OPERATORS, describeFilter} from './filters';
import {columnName, evaluate, FormulaError, parse, translateFormula} from './formula';
import {translator} from './i18n';
import {validateCell} from './validate';

type Field = {name: string; label: string; type: string; editable: boolean; nullable?: boolean; blank?: boolean; max_length?: number | null; related?: boolean; choices: [any, string][]; formula?: string};
type State = {q: string; filter: any; sort: {field: string; dir: string}[]; offset: number; limit: number; columns: string[] | null; pagination?: string; cursor?: string | null};
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
  const labels = new Map<string, string>();
  let pendingKey = '';
  let nextCursor: string | null = null;
  const cursorStack: (string | null)[] = [state.cursor ?? null];
  let validateTimer = 0;
  const element = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') => {
    const node = document.createElement(tag); node.textContent = text; node.className = className; return node;
  };
  const button = (label: string, action: () => any, parent: HTMLElement, className = '') => {
    const node = element('button', t(label), className); node.type = 'button';
    node.addEventListener('click', () => { Promise.resolve().then(() => { if (!busy) return action(); }).catch(showError); }); parent.append(node); return node;
  };
  const toolbar = element('div', '', 'ms-toolbar'); root.append(toolbar);
  const saveButton = button('Save', save, toolbar, 'ms-primary');
  button('Undo', () => { buffer.undo(); render(); }, toolbar);
  button('Redo', () => { buffer.redo(); render(); }, toolbar);
  button('Fill down', fillDown, toolbar);
  button('Fill right', fillRight, toolbar);
  button('Find', findDialog, toolbar);
  const search = element('input'); search.type = 'search'; search.placeholder = t('Search'); search.value = state.q; search.setAttribute('aria-label', t('Search')); toolbar.append(search);
  const runSearch = () => safe(async () => { state.q = search.value; resetPaging(); await load(); });
  search.addEventListener('keydown', event => { if (event.key === 'Enter') void runSearch(); });
  button('Search', runSearch, toolbar);
  button('Filters', filterDialog, toolbar);
  button('Sort', sortDialog, toolbar);
  button('Columns', columnsDialog, toolbar);
  if (schema.can_add) button('Add row', () => { if (busy) return; buffer.addRow(blankValues()); render(); }, toolbar);
  if (schema.can_delete) button('Delete rows', deleteSelected, toolbar);
  if (schema.can_undo) button('Revert save', () => safe(revertSave), toolbar);
  button('Export', () => safe(() => download('csv')), toolbar);
  if (schema.xlsx) button('XLSX', () => safe(() => download('xlsx')), toolbar);
  if (schema.can_import) button('Import', () => safe(importDialog), toolbar);
  button('Views', () => safe(viewsDialog), toolbar);
  if (schema.can_bulk) button('Bulk change', () => safe(bulkDialog), toolbar);
  if (schema.can_history) button('History', historyDialog, toolbar);
  button('Ordinary Admin', () => safe(async () => {
    const data = await request('admin-state/?' + params(state)); location.href = data.url;
  }), toolbar);
  const formulaBar = element('div', '', 'ms-formula-bar'); root.append(formulaBar);
  const address = element('output', 'A1', 'ms-address'); formulaBar.append(address);
  formulaBar.append(element('span', 'ƒx', 'ms-fx'));
  const formulaInput = element('input'); formulaInput.setAttribute('aria-label', t('Formula')); formulaBar.append(formulaInput);
  formulaInput.addEventListener('keydown', event => {
    if (busy) return;
    if (event.key === 'Enter' && active) { edit(active.getRow().getData().__modelsheet_pk, active.getField(), formulaInput.value); active.getElement().tabIndex=0; active.getElement().focus(); }
    if (event.key === 'Escape') updateFormulaBar();
  });
  const grid = element('div', '', 'ms-grid'); root.append(grid);
  const footer = element('div', '', 'ms-footer'); root.append(footer);
  const status = element('span', t('Loading')); status.setAttribute('role', 'status'); footer.append(status);
  const selectionInfo = element('span', '', 'ms-selection'); selectionInfo.title = t('Select all matching results in Bulk change'); footer.append(selectionInfo);
  const pageInfo = element('span'); footer.append(pageInfo);
  const previous = button('Previous', () => safe(async () => {
    if (state.pagination === 'keyset') { cursorStack.pop(); state.cursor = cursorStack.at(-1) ?? null; }
    else state.offset = Math.max(0, state.offset - state.limit);
    await load();
  }), footer);
  const next = button('Next', () => safe(async () => {
    if (state.pagination === 'keyset') { cursorStack.push(nextCursor); state.cursor = nextCursor; }
    else state.offset += state.limit;
    await load();
  }), footer);
  const filterInfo = element('div', '', 'ms-filter-info'); root.append(filterInfo);

  function setBusy(value: boolean) {
    busy = value;
    toolbar.querySelectorAll('button').forEach(button => { button.disabled = value; });
    saveButton.disabled = value || !buffer.dirty;
    search.disabled = value;
    formulaInput.disabled = value || !active || !editable.has(active.getField());
    previous.disabled = value || (state.pagination === 'keyset' ? cursorStack.length <= 1 : state.offset === 0);
    next.disabled = value || !hasNext;
  }

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
    if (busy) return;
    try {
      if (buffer.dirty) {
        const decision = await new Promise<string>(resolve => {
          const {dialog, body, actions} = modal('Unsaved edits');
          body.append(element('p', t('Unsaved changes')));
          button('Save', () => { resolve('save'); dialog.close(); }, actions, 'ms-primary');
          button('Discard', () => { resolve('discard'); dialog.close(); }, actions);
          dialog.addEventListener('close', () => resolve('keep'), {once:true});
        });
        if (decision === 'keep' || busy) return;
        if (decision === 'save') { await save(); if (buffer.dirty) return; }
        else { buffer.clear(); render(); }
      }
      await action();
    } catch (error) { showError(error); }
  }
  async function load() {
    setBusy(true); status.textContent = t('Loading');
    try {
      const data = await request('rows/?' + params(state));
      snapshot = data.snapshot; state = data.state; loadedState = structuredClone(state);
      buffer = new EditBuffer(data.rows, state.columns!, editable, data.today);
      labels.clear();
      for (const row of data.rows) for (const [name, label] of Object.entries(row.labels ?? {})) labels.set(`${row.pk}:${name}`, Array.isArray(label) ? label.join(', ') : label === null ? '' : String(label));
      count = data.count; hasNext = data.has_next; nextCursor = data.next_cursor ?? null; active = null; errors.clear(); conflicts.clear(); savedCells.clear();
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
            state.sort = sort; resetPaging(); await load();
          }),
        };
        if (field.editable) {
          definition.editor = editorFor(field);
          if (field.choices.length && !field.related) definition.editorParams = {values: Object.fromEntries(field.choices)};
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
      previous.disabled = state.pagination === 'keyset' ? cursorStack.length <= 1 : state.offset === 0; next.disabled = !hasNext;
      renderFilterChips();
      status.className = ''; status.textContent = t('Ready');
    } finally { setBusy(false); }
  }
  function textNode(value: any) { return element('span', value === null || value === undefined ? '' : String(value)); }
  function tableData() { return buffer.rows.filter(row => !buffer.deleted[row.pk]).map(row => ({__modelsheet_pk:row.pk, __modelsheet_original:row.values, ...row.values, ...buffer.changes[row.pk], ...Object.fromEntries(computed.map(field => [field.name,renderVersion]))})); }
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
      node.textContent = displayValue(pk, field, value);
    } catch (error) { node.textContent = error instanceof FormulaError ? error.code : '#VALUE!'; node.className = 'ms-error'; }
    if (errors.has(`${pk}:${name}`)) node.title = errors.get(`${pk}:${name}`)!;
    return node;
  }
  function updateFormulaBar() {
    if (!active) return;
    const pk = active.getRow().getData().__modelsheet_pk, name = active.getField();
    const virtual = computed.find(field => field.name === name);
    address.textContent = virtual ? `ƒx · ${virtual.label}` : `${columnName(state.columns!.indexOf(name))}${buffer.rows.findIndex(row => row.pk === pk) + 1}`;
    formulaInput.value = virtual?.formula ?? String(buffer.raw(pk, name) ?? ''); formulaInput.disabled = busy || !editable.has(name);
  }
  function edit(pk: string, field: string, value: any) {
    if (busy) return;
    buffer.apply([{pk, field, value}]); errors.delete(`${pk}:${field}`); conflicts.delete(`${pk}:${field}`); savedCells.delete(`${pk}:${field}`); savingKey = null;
    const metaField = meta.get(field);
    const message = metaField ? validateCell(metaField, value) : null;
    if (message) errors.set(`${pk}:${field}`, t(message));
    else scheduleValidate(pk);
    render();
  }
  function render() {
    if (busy) return;
    // Update rows directly: table.updateData reprocesses all data and resets ranges/focus.
    const current = table;
    renderVersion++;
    if (current) {
      const data = tableData();
      const existing = new Set<string>(current.getData().map((row: any) => row.__modelsheet_pk));
      const next = new Set<string>(data.map(row => row.__modelsheet_pk));
      void Promise.all(data.map(row => existing.has(row.__modelsheet_pk) ? current.getRow(row.__modelsheet_pk).update(row) : current.addRow(row)))
        .then(() => { for (const pk of existing) if (!next.has(pk)) current.getRow(pk)?.delete(); })
        .catch(showError);
    }
    saveButton.disabled = !buffer.dirty;
    status.className = ''; status.textContent = buffer.dirty ? `${t('Changed rows')}: ${Object.keys(buffer.changes).length}` : t('Ready');
    updateFormulaBar();
  }
  async function save() {
    if (!buffer.dirty || busy) return;
    setBusy(true); status.textContent = t('Saving');
    const parts = buffer.saveParts();
    const body = {snapshot, view_state:loadedState, ...parts};
    table?.redraw(true);
    const serialized = JSON.stringify(body);
    if (serialized !== savingBody || !savingKey) { savingBody = serialized; savingKey = crypto.randomUUID(); }
    try {
      await request('save/', {...body, idempotency_key:savingKey});
      buffer.clear(); savingKey = null; await load(); status.textContent = '✓ ' + t('Saved');
      for (const change of body.changes) for (const field of Object.keys(change.values)) savedCells.add(`${change.pk}:${field}`);
      table?.redraw(true);
    } catch (error) { showError(error); throw error; }
    finally { setBusy(false); }
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
    if (busy) return;
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
    if (busy) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    if (event.ctrlKey || event.metaKey) {
      if (['z','y','d','s'].includes(event.key.toLowerCase())) event.stopImmediatePropagation();
      if (event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? buffer.redo() : buffer.undo(); render(); }
      if (event.key.toLowerCase() === 'y') { event.preventDefault(); buffer.redo(); render(); }
      if (event.key.toLowerCase() === 'd') { event.preventDefault(); try { fillDown(); } catch (error) { showError(error); } }
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); try { fillRight(); } catch (error) { showError(error); } }
      if (event.key.toLowerCase() === 's') { event.preventDefault(); void save().catch(showError); }
    }
    const inGrid = Boolean(target.closest('.tabulator'));
    if (inGrid && event.key === 'F2' && active && editable.has(active.getField())) {
      event.preventDefault(); pendingKey = ''; active.edit();
    } else if (inGrid && event.key.length === 1 && event.key !== '\t' && !event.ctrlKey && !event.metaKey && !event.altKey && active && editable.has(active.getField())) {
      event.preventDefault(); pendingKey = event.key; active.edit();
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault(); buffer.apply(selected().map(cell => ({pk:cell.getRow().getData().__modelsheet_pk, field:cell.getField(), value:null}))); render();
    }
  },true);
  root.addEventListener('copy', event => copyRange(event, false));
  root.addEventListener('cut', event => copyRange(event, true));
  function copyRange(event: ClipboardEvent, cut: boolean) {
    if (busy && cut) { event.preventDefault(); return; }
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
    if (busy) { event.preventDefault(); return; }
    if ((event.target as HTMLElement).matches('input,textarea') || (event.target as HTMLElement).closest('dialog')) return;
    event.preventDefault();
    try {
      const text = event.clipboardData?.getData('text/plain') ?? '', values = parseTSV(text), bounds = selectionBounds(), edits = [];
      if (values.length > schema.max_save_rows || text.length > 1000000) throw new Error(t('Paste exceeds configured limits'));
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
  function filterGroup(value: any = {}, onChange: () => void = () => {}): {node: HTMLElement; read: () => any} {
    const node = element('fieldset', '', 'ms-filter-group');
    const mode = select([['and', t('AND')],['or', t('OR')]], value.or ? 'or' : 'and'); node.append(mode);
    const children: {node: HTMLElement; read: () => any}[] = [];
    function attach(child: {node: HTMLElement; read: () => any}) {
      children.push(child); node.append(child.node); button('Remove', () => { children.splice(children.indexOf(child),1); child.node.remove(); onChange(); }, child.node);
    }
    const condition = (item: any = {}) => {
      const row = element('div', '', 'ms-condition');
      const field = select(fields.map(f => [f.name, f.label]), item.field ?? fields[0]?.name ?? '');
      const op = select(FILTER_OPERATORS.map(([key, label]) => [key, t(label)]), item.op ?? 'eq');
      let input = valueInput(field.value, op.value, item.value);
      const mount = element('span'); mount.append(input); row.append(field, op, mount);
      const refresh = () => { input = valueInput(field.value, op.value, readValue()); mount.replaceChildren(input); };
      field.addEventListener('change', refresh); op.addEventListener('change', refresh);
      const readValue = () => op.value === 'isnull' ? ['true','1'].includes(input.value.toLowerCase()) : ['in','not_in'].includes(op.value) ? input.value.split(',').map(x => x.trim()).filter(Boolean) : input.value;
      return {node:row, read:() => ({field:field.value, op:op.value, value:readValue()})};
    };
    button('Add condition', () => { attach(condition()); onChange(); }, node);
    button('Add group', () => { attach(filterGroup({}, onChange)); onChange(); }, node);
    for (const item of value.and ?? value.or ?? (Object.keys(value).length ? [value] : [])) attach(item.and || item.or ? filterGroup(item, onChange) : condition(item));
    return {node, read:() => children.length ? {[mode.value]: children.map(child => child.read())} : {}};
  }
  function filterDialog() {
    const {dialog, body, actions} = modal('Filters'), builder = filterGroup(state.filter); body.append(builder.node);
    button('Apply', () => safe(async () => { state.filter = builder.read(); resetPaging(); await load(); dialog.close(); }), actions, 'ms-primary');
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
    button('Apply',() => safe(async () => { state.sort=sorts.map(item => ({field:item.field.value,dir:item.direction.value})); resetPaging(); await load(); dialog.close(); }),actions,'ms-primary');
  }
  const preferenceKey = 'modelsheet:' + options.base;
  let preferences: any = {};
  try { preferences = JSON.parse(localStorage.getItem(preferenceKey) ?? '{}'); } catch { /* Optional local preferences. */ }
  const widths: Record<string, number> = preferences.widths ?? {};
  let frozen: number = preferences.frozen ?? 0;
  function storePreferences() { try { localStorage.setItem(preferenceKey, JSON.stringify({widths, frozen, views: preferences.views ?? []})); } catch { /* Storage may be disabled. */ } }
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
    const builder = filterGroup(state.filter, invalidatePreview); body.append(builder.node);
    const assignmentBox = element('div'); body.append(assignmentBox);
    const assignments: {field: HTMLSelectElement; input: HTMLInputElement; node: HTMLElement}[] = [];
    function addAssignment() {
      const node = element('div', '', 'ms-condition'), field = select(fields.filter(f => f.editable).map(f => [f.name,f.label]), fields.find(f => f.editable)?.name ?? '');
      const input = element('input'); input.placeholder = t('Value or formula'); node.append(field, input); assignmentBox.append(node);
      const item = {field,input,node}; assignments.push(item); button('Remove', () => { assignments.splice(assignments.indexOf(item),1); node.remove(); invalidatePreview(); }, node);
    }
    addAssignment(); button('Add assignment', () => { addAssignment(); invalidatePreview(); }, body);
    const output = element('div', '', 'ms-report'); body.append(output);
    let operation: any = null, timer: ReturnType<typeof setTimeout> | null = null, revision = 0;
    const confirmButton = button('Confirm', async () => {
      if (!operation || !window.confirm(`${t('Confirm')}: ${operation.total} records?`)) return;
      try { await updateOperation('bulk/run/', {operation:operation.id}); } catch (error: any) { output.textContent = `${error.details?.code}: ${error.message}`; }
    }, actions, 'ms-primary'); confirmButton.disabled = true;
    const previewButton = button('Preview', async () => {
      invalidatePreview();
      const requestedRevision = revision;
      previewButton.disabled = true;
      try {
        const values: Record<string, string> = {};
        for (const item of assignments) { if (Object.hasOwn(values,item.field.value)) throw new Error('Duplicate assignment'); values[item.field.value] = item.input.value; }
        const selection = scope.value === 'selected' ? [...new Set(selected().map(cell => cell.getRow().getData().__modelsheet_pk))] : null;
        const result = await request('bulk/preview/', {state:{...state, filter:builder.read()}, assignments:values, selection, snapshot,
          idempotency_key:crypto.randomUUID()});
        if (requestedRevision !== revision || !dialog.open) return;
        operation = result; display();
      } catch (error: any) {
        if (requestedRevision === revision && dialog.open) output.textContent = `${error.details?.code ?? 'Error'}: ${error.message}`;
      } finally {
        if (requestedRevision === revision && dialog.open) previewButton.disabled = ['preparing','queued','running'].includes(operation?.status);
      }
    }, actions);
    const cancelButton = button('Cancel', async () => { if (operation) await updateOperation(`operations/${operation.id}/cancel/`, {}); }, actions);
    const resumeButton = button('Resume', async () => { if (operation) await updateOperation(`operations/${operation.id}/resume/`, {}); }, actions);
    async function updateOperation(route: string, body: any) {
      const requestedRevision = ++revision;
      if (timer) clearTimeout(timer);
      try {
        const result = await request(route, body);
        if (requestedRevision !== revision || !dialog.open) return;
        operation = result; display();
      } catch (error) {
        if (requestedRevision !== revision || !dialog.open) return;
        display(); throw error;
      }
    }
    function display() {
      output.replaceChildren(); if (operation) operationReport(output,operation);
      confirmButton.disabled = !operation || operation.status !== 'preview' || operation.errors > 0;
      previewButton.disabled = ['preparing','queued','running'].includes(operation?.status);
      cancelButton.disabled = !operation || ['done','partial','failed','cancelled'].includes(operation.status);
      const expiredWorker = operation && ['running','preparing','queued'].includes(operation.status) && operation.lease_until && new Date(operation.lease_until).getTime() < Date.now();
      resumeButton.disabled = !operation || (!['cancelled','dispatch_failed','failed'].includes(operation.status) && !expiredWorker);
      if (timer) clearTimeout(timer);
      const polledRevision = revision, operationId = operation?.id;
      if (['preparing','queued','running'].includes(operation?.status)) timer = setTimeout(async () => {
        if (!dialog.open) return;
        try {
          const result = await request(`operations/${operationId}/`);
          if (polledRevision !== revision || !dialog.open) return;
          operation = result; display();
        } catch (error: any) { if (polledRevision === revision && dialog.open) output.textContent = error.message; }
      }, 1500);
    }
    function invalidatePreview() {
      revision++; operation = null; display();
    }
    body.addEventListener('input', invalidatePreview);
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
  function resetPaging() {
    state.offset = 0; state.cursor = null; cursorStack.splice(0, cursorStack.length, null);
  }
  function blankValues() {
    const values: Record<string, unknown> = {};
    for (const field of fields) if (field.editable) values[field.name] = field.type === 'BooleanField' ? false : null;
    return values;
  }
  function deleteSelected() {
    if (busy) return;
    const pks = [...new Set(selected().map(cell => cell.getRow().getData().__modelsheet_pk))];
    if (!pks.length && active) pks.push(active.getRow().getData().__modelsheet_pk);
    if (!pks.length) return;
    buffer.removeRows(pks); render();
  }
  async function revertSave() {
    await request('undo/', {idempotency_key: crypto.randomUUID()});
    await load(); status.textContent = t('Reverted');
  }
  async function download(format: string) {
    const response = await fetch(options.base + 'export/?' + params(state) + '&format=' + format, {credentials: 'same-origin'});
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error?.message ?? `HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = `sheet.${format}`; link.click();
    URL.revokeObjectURL(link.href);
  }
  function fillRight() {
    if (busy) return;
    const skipped = buffer.apply(fillRightEdits(buffer, state.columns!, selectionBounds()));
    render(); if (skipped) status.textContent = `${t('Readonly cells skipped')}: ${skipped}`;
  }
  function findDialog() {
    const {dialog, body, actions} = modal('Find');
    const query = element('input'); query.placeholder = t('Find'); query.setAttribute('aria-label', t('Find'));
    const replacement = element('input'); replacement.placeholder = t('Replace'); replacement.setAttribute('aria-label', t('Replace'));
    const match = element('input'); match.type = 'checkbox';
    const matchLabel = element('label', t('Match case')); matchLabel.prepend(match);
    body.append(query, replacement, matchLabel);
    button('Replace all', () => {
      const edits = findReplaceEdits(buffer, state.columns!, query.value, replacement.value, match.checked);
      const skipped = buffer.apply(edits); render();
      status.textContent = `${t('Changed rows')}: ${edits.length - skipped}`;
      dialog.close();
    }, actions, 'ms-primary');
  }
  function renderFilterChips() {
    filterInfo.replaceChildren();
    const sortText = state.sort.map(item => `${meta.get(item.field)?.label ?? 'PK'} ${item.dir === 'asc' ? '↑' : '↓'}`).join(' · ');
    if (sortText) filterInfo.append(element('span', sortText));
    for (const chip of describeFilter(state.filter, name => meta.get(name)?.label ?? name, t)) {
      const node = element('button', chip, 'ms-chip'); node.type = 'button';
      node.addEventListener('click', () => { if (!busy) filterDialog(); });
      filterInfo.append(node);
    }
  }
  function valueInput(fieldName: string, op: string, current: unknown) {
    const field = meta.get(fieldName);
    const text = Array.isArray(current) ? current.join(',') : current === undefined || current === null ? '' : String(current);
    if (op === 'isnull') return select([['false', t('No')], ['true', t('Yes')]], text === 'true' ? 'true' : 'false');
    if (field?.type === 'BooleanField' && op !== 'in' && op !== 'not_in') return select([['true', t('Yes')], ['false', t('No')]], text || 'true');
    if (field?.choices?.length && op !== 'in' && op !== 'not_in' && op !== 'contains') {
      return select(field.choices.map(([key, label]) => [String(key), label] as [string, string]), text);
    }
    const input = element('input');
    input.placeholder = t('Value / comma-separated list');
    input.value = text;
    if (op !== 'in' && op !== 'not_in' && op !== 'contains') {
      if (field?.type === 'DateField') input.type = 'date';
      if (field?.type === 'DateTimeField') input.type = 'datetime-local';
      if (field?.type === 'TimeField') input.type = 'time';
    }
    if (field?.related && op !== 'in' && op !== 'not_in') input.title = t('Search');
    return input;
  }
  function displayValue(pk: string, field: Field, value: unknown) {
    if (field.related) {
      const label = labels.get(`${pk}:${field.name}`);
      if (label) return label;
      if (Array.isArray(value)) return value.join(', ');
    }
    const choice = field.choices.find(([key]) => key === value)?.[1];
    if (choice) return choice;
    if (value === null || value === undefined || value === '') return value === null ? '∅' : '';
    if (field.type === 'BooleanField') return value ? t('Yes') : t('No');
    if (field.type === 'DateField') return new Intl.DateTimeFormat(options.language, {dateStyle: 'short', timeZone: 'UTC'}).format(new Date(`${String(value).slice(0, 10)}T00:00:00Z`));
    if (field.type === 'DateTimeField') return new Intl.DateTimeFormat(options.language, {dateStyle: 'short', timeStyle: 'medium', timeZone: schema.timezone ?? 'UTC'}).format(new Date(String(value)));
    return String(value);
  }
  function editorFor(field: Field) {
    if (field.type === 'BooleanField') return booleanEditor;
    if (field.related) return relationEditor(field);
    if (field.choices.length) return 'list';
    if (field.type === 'DateField') return typedEditor('date', field);
    if (field.type === 'DateTimeField') return typedEditor('datetime-local', field);
    if (field.type === 'TimeField') return typedEditor('time', field);
    return typedEditor('text', field);
  }
  function typedEditor(kind: string, field: Field) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const input = document.createElement('input');
      input.type = kind;
      const typed = pendingKey; pendingKey = '';
      const current = cell.getValue();
      const shown = current === null || current === undefined ? '' : String(current).slice(0, kind === 'date' ? 10 : kind === 'datetime-local' ? 16 : 99);
      input.value = kind === 'text' && typed ? typed : shown;
      if (field.max_length && kind === 'text') input.maxLength = field.max_length;
      if (kind === 'text' && (field.type === 'DecimalField' || field.type === 'FloatField' || field.type === 'IntegerField')) input.inputMode = 'decimal';
      onRendered(() => { input.focus(); if (kind === 'text' && typed) input.setSelectionRange(input.value.length, input.value.length); else input.select?.(); });
      let done = false;
      const commit = () => { if (done) return; done = true; success(kind === 'text' ? input.value : (input.value || null)); };
      input.addEventListener('keydown', event => { if (event.key === 'Enter') commit(); if (event.key === 'Escape') cancel(cell.getValue()); });
      input.addEventListener('blur', commit);
      return input;
    };
  }
  function booleanEditor(cell: any, onRendered: any, success: any) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = cell.getValue() === true || cell.getValue() === 'true' || cell.getValue() === 1;
    onRendered(() => input.focus());
    let done = false;
    const commit = () => { if (done) return; done = true; success(input.checked); };
    input.addEventListener('change', commit);
    input.addEventListener('blur', commit);
    return input;
  }
  function relationEditor(field: Field) {
    return (cell: any, onRendered: any, success: any, cancel: any) => {
      const pk = cell.getRow().getData().__modelsheet_pk;
      const wrap = document.createElement('div'); wrap.className = 'ms-lookup';
      const input = document.createElement('input');
      const typed = pendingKey; pendingKey = '';
      input.value = typed || labels.get(`${pk}:${field.name}`) || (cell.getValue() ?? '');
      const list = document.createElement('div'); list.className = 'ms-lookup-list';
      let picked: {id: string; label: string} | null = null;
      let done = false;
      const commit = () => {
        if (done) return;
        done = true;
        if (!input.value) { labels.set(`${pk}:${field.name}`, ''); success(null); return; }
        if (picked) { labels.set(`${pk}:${field.name}`, picked.label); success(picked.id); return; }
        success(input.value);
      };
      input.addEventListener('input', () => {
        picked = null;
        void request(`lookup/?field=${encodeURIComponent(field.name)}&q=${encodeURIComponent(input.value)}`).then(data => {
          list.replaceChildren();
          for (const item of data.results as {id: string; label: string}[]) {
            const option = element('button', item.label); option.type = 'button';
            option.addEventListener('mousedown', event => { event.preventDefault(); picked = item; input.value = item.label; commit(); });
            list.append(option);
          }
        }).catch(() => list.replaceChildren());
      });
      input.addEventListener('keydown', event => { if (event.key === 'Enter') commit(); if (event.key === 'Escape') cancel(cell.getValue()); });
      input.addEventListener('blur', () => window.setTimeout(commit, 0));
      if (typed) input.dispatchEvent(new Event('input'));
      onRendered(() => input.focus());
      wrap.append(input, list); return wrap;
    };
  }
  function scheduleValidate(pk: string) {
    window.clearTimeout(validateTimer);
    validateTimer = window.setTimeout(() => { void dryRun(pk); }, 400);
  }
  async function dryRun(pk: string) {
    const values = buffer.changes[pk];
    if (!values || busy) return;
    try {
      const data = await request('validate/', {changes: [{pk, values}]});
      const result = data.results?.[0];
      if (!result || result.ok) return;
      const details = result.error?.details;
      if (details && typeof details === 'object') {
        for (const [field, message] of Object.entries(details)) errors.set(`${pk}:${field}`, String(message));
      } else if (result.error?.field) errors.set(`${pk}:${result.error.field}`, String(result.error.message));
      table?.redraw(true);
    } catch { /* Сухой прогон необязателен: локальная проверка уже показана. */ }
  }
  async function importDialog() {
    const {dialog, body, actions} = modal('Import');
    const file = element('input'); file.type = 'file'; file.accept = '.csv,.xlsx,text/csv';
    body.append(file);
    const mapping = element('div'); body.append(mapping);
    const output = element('div', '', 'ms-report'); body.append(output);
    let headers: string[] = [], operation: any = null;
    file.addEventListener('change', async () => {
      if (!file.files?.[0]) return;
      const form = new FormData(); form.set('phase', 'inspect'); form.set('file', file.files[0]);
      const response = await fetch(options.base + 'import/', {method: 'POST', credentials: 'same-origin', headers: {'X-CSRFToken': csrf}, body: form});
      const data = await response.json();
      if (!response.ok) { output.textContent = data.error?.message ?? ''; return; }
      headers = data.headers; mapping.replaceChildren(element('p', t('Map columns')));
      for (const header of headers) {
        const row = element('div', '', 'ms-condition');
        const target = select([['', '—'], ['pk', 'PK'], ...fields.filter(item => item.editable).map(item => [item.name, item.label] as [string, string])], header === 'pk' ? 'pk' : (fields.find(item => item.name === header)?.name ?? ''));
        target.dataset.header = header; row.append(element('span', header), target); mapping.append(row);
      }
    });
    button('Preview import', async () => {
      if (!file.files?.[0]) return;
      const form = new FormData();
      const columns: Record<string, string> = {};
      mapping.querySelectorAll('select').forEach(node => { const header = (node as HTMLSelectElement).dataset.header; if (header && node.value) columns[header] = node.value; });
      form.set('phase', 'preview'); form.set('mapping', JSON.stringify(columns)); form.set('idempotency_key', crypto.randomUUID()); form.set('file', file.files[0]);
      const response = await fetch(options.base + 'import/', {method: 'POST', credentials: 'same-origin', headers: {'X-CSRFToken': csrf}, body: form});
      const data = await response.json();
      if (!response.ok) { output.textContent = data.error?.message ?? ''; return; }
      operation = data; output.replaceChildren(); operationReport(output, data);
    }, actions);
    button('Confirm', async () => {
      if (!operation || operation.errors) return;
      const result = await request('bulk/run/', {operation: operation.id});
      output.replaceChildren(); operationReport(output, result);
      if (!buffer.dirty) void load();
    }, actions, 'ms-primary');
  }
  async function viewsDialog() {
    const {dialog, body, actions} = modal('Views');
    const remote = await request('views/').catch(() => ({views: []}));
    body.append(element('h3', t('Local views')));
    for (const view of preferences.views ?? []) body.append(viewRow(view.name, () => applyView(view), () => {
      preferences.views = (preferences.views ?? []).filter((item: any) => item.name !== view.name); storePreferences(); dialog.close();
    }));
    body.append(element('h3', t('Shared views')));
    for (const view of remote.views ?? []) body.append(viewRow(view.name + (view.shared ? ' · ' + t('Shared') : ''), () => applyView(view.state), () => {
      if (view.own) void request('views/delete/', {id: view.id}).then(() => dialog.close());
    }));
    const name = element('input'); name.placeholder = t('View name'); name.setAttribute('aria-label', t('View name'));
    const shared = element('input'); shared.type = 'checkbox';
    const sharedLabel = element('label', t('Shared')); sharedLabel.prepend(shared);
    body.append(name, sharedLabel);
    button('Save view', async () => {
      const view = currentView(name.value || t('Views'));
      preferences.views = [...(preferences.views ?? []).filter((item: any) => item.name !== view.name), view];
      storePreferences();
      await request('views/save/', {name: view.name, state: view, shared: shared.checked});
      dialog.close();
    }, actions, 'ms-primary');
    function applyView(view: any) {
      state.q = view.q ?? ''; state.filter = view.filter ?? {}; state.sort = view.sort ?? [];
      if (view.columns) state.columns = view.columns;
      frozen = view.frozen ?? frozen; Object.assign(widths, view.widths ?? {});
      search.value = state.q; storePreferences(); resetPaging();
      void load().then(() => dialog.close());
    }
  }
  function viewRow(title: string, apply: () => void, remove: () => void) {
    const row = element('div', '', 'ms-condition');
    button('Apply view', apply, row);
    row.append(element('span', title));
    button('Delete view', remove, row);
    return row;
  }
  function currentView(name: string) {
    return {name, q: state.q, filter: state.filter, sort: state.sort, columns: state.columns, frozen, widths, pagination: state.pagination ?? 'offset'};
  }

  await load();
}
