/** Bridge Tabulator's selection events to an external formula bar.
 * Tabulator owns keyboard movement, range extension, scrolling and editor focus.
 */
export function watchActiveCell(table: any, changed: (cell: any) => void) {
  let scheduled = false;
  let current: any;
  const notify = (cell: any) => {
    // Layout/range refreshes for the same cell must not overwrite text currently
    // being typed in the external formula input.
    if (cell === current) return;
    current = cell;
    changed(cell);
  };
  const sync = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      // Navigation changes start/end in separate events. Read the final bounds;
      // extending a range keeps the anchor cell shown in the formula bar.
      const cells = table.getRanges().flatMap((range: any) => range.getCells().flat())
        .filter((cell: any) => typeof cell.getField() === 'string');
      if (cells.length === 1) notify(cells[0]);
    });
  };
  table.on('rangeAdded', sync);
  table.on('rangeChanged', sync);
  table.on('cellClick', (event: MouseEvent, cell: any) => {
    if (!event.shiftKey && typeof cell.getField() === 'string') notify(cell);
  });
  table.on('cellEditing', notify);
}
