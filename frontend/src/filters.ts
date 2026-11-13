export const FILTER_OPERATORS: [string, string][] = [
  ['eq', 'Equals'],
  ['ne', 'Does not equal'],
  ['lt', 'Less than'],
  ['lte', 'Less or equal'],
  ['gt', 'Greater than'],
  ['gte', 'Greater or equal'],
  ['in', 'In list'],
  ['not_in', 'Not in list'],
  ['isnull', 'Is empty'],
  ['contains', 'Contains'],
];

type Condition = {field?: string; op?: string; value?: unknown; and?: Condition[]; or?: Condition[]};

export function describeFilter(node: Condition | undefined, label: (name: string) => string, t: (message: string) => string): string[] {
  if (!node || !Object.keys(node).length) return [];
  const operator = FILTER_OPERATORS.find(([key]) => key === node.op)?.[1];
  if (node.field && operator) {
    const value = node.op === 'isnull' ? '' : Array.isArray(node.value) ? node.value.join(', ') : String(node.value ?? '');
    return [`${label(node.field)} ${t(operator)}${value ? ' ' + value : ''}`];
  }
  const key = node.and ? 'and' : node.or ? 'or' : '';
  const children = (key === 'and' ? node.and : node.or) ?? [];
  return children.flatMap(child => describeFilter(child, label, t));
}
