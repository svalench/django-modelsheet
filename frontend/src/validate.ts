export type CellField = {
  type: string;
  nullable?: boolean;
  blank?: boolean;
  max_length?: number | null;
};

/** Локальная проверка до сухого прогона. Формулы проверяет сервер. */
export function validateCell(field: CellField, value: unknown): string | null {
  if (typeof value === 'string' && value.startsWith('=')) return null;
  const empty = value === null || value === undefined || value === '';
  if (empty) {
    if (field.type === 'BooleanField') return null;
    if (field.nullable || field.blank) return null;
    if (field.type === 'CharField' || field.type === 'TextField') return field.blank ? null : 'Required';
    return 'Required';
  }
  const text = String(value);
  if (typeof field.max_length === 'number' && text.length > field.max_length) return 'Too long';
  if (field.type === 'IntegerField' && !/^-?\d+$/.test(text)) return 'Invalid integer';
  if (field.type === 'DecimalField' || field.type === 'FloatField') {
    const normalized = text.replace(/\s/g, '').replace(',', '.');
    if (!/^-?\d+(\.\d+)?$/.test(normalized)) return 'Invalid number';
  }
  if (field.type === 'DateField') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return 'Invalid date';
    const parsed = new Date(`${text}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) return 'Invalid date';
  }
  if (field.type === 'TimeField' && !/^\d{2}:\d{2}(:\d{2})?$/.test(text)) return 'Invalid time';
  if (field.type === 'BooleanField' && typeof value !== 'boolean' && !/^(true|false|1|0)$/i.test(text)) return 'Invalid value';
  return null;
}
