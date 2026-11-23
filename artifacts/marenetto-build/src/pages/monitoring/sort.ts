import type { KpiRow } from '@workspace/api-client-react';

export type SortState = { col: string; dir: 'asc' | 'desc' } | null;
export const LABEL_COL = '__label';

/** Stable sort; missing values (null) always last, never treated as zero. */
export function sortRows(rows: KpiRow[], s: SortState): KpiRow[] {
  if (!s) return rows;
  const sign = s.dir === 'asc' ? 1 : -1;
  return rows.map((r, i) => ({ r, i })).sort((a, b) => {
    if (s.col === LABEL_COL) return sign * a.r.label.localeCompare(b.r.label, 'it', { numeric: true }) || a.i - b.i;
    const x = a.r.values[s.col] ?? null, y = b.r.values[s.col] ?? null;
    const xn = x === null || Number.isNaN(x), yn = y === null || Number.isNaN(y);
    if (xn && yn) return a.i - b.i;
    if (xn) return 1;
    if (yn) return -1;
    return sign * ((x as number) - (y as number)) || a.i - b.i;
  }).map(x => x.r);
}

export function nextSort(cur: SortState, col: string): SortState {
  if (!cur || cur.col !== col) return { col, dir: col === LABEL_COL ? 'asc' : 'desc' };
  return { col, dir: cur.dir === 'asc' ? 'desc' : 'asc' };
}
