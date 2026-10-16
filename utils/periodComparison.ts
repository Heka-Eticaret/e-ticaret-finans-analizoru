export type PeriodSelection = { start: number; length: number; label: string; keys: string[] };
export const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export function parsePeriod(value: string) {
  const year = Number(value.match(/\d{4}/)?.[0]);
  const textMonth = monthNames.findIndex(name => value.toLocaleLowerCase('tr-TR').includes(name.toLocaleLowerCase('tr-TR')));
  const numeric = value.match(/^\s*\d{4}[-/.](\d{1,2})(?:\D|$)/);
  const month = textMonth >= 0 ? textMonth : numeric ? Number(numeric[1]) - 1 : -1;
  return { year, month };
}
export function monthIndex(value: string) {
  const { year, month } = parsePeriod(value);
  return year && month >= 0 && month < 12 ? year * 12 + month : NaN;
}
export function periodLabel(start: number, length: number): string {
  const year = Math.floor(start / 12), month = start % 12;
  if (length === 12 && month === 0) return `${year}`;
  if (length === 3 && month % 3 === 0) return `${year} Q${month / 3 + 1}`;
  if (length === 1) return `${monthNames[month]} ${year}`;
  return `${periodLabel(start, 1)} – ${periodLabel(start + length - 1, 1)}`;
}
export function comparisonPeriod(keys: string[], selection: PeriodSelection | null) {
  if (!keys.length || keys.includes('all')) return null;
  if (selection && keys.length === selection.keys.length && keys.every(k => selection.keys.includes(k))) return selection;
  const indices = [...new Set(keys.map(monthIndex))].sort((a, b) => a - b);
  if (indices.some(n => !Number.isFinite(n)) || indices.some((n, i) => i > 0 && n !== indices[i - 1] + 1)) return null;
  return { start: indices[0], length: indices.length, label: periodLabel(indices[0], indices.length), keys };
}
export function metricChange(current: number, previous: number) {
  const delta = Math.abs(current - previous) < 0.005 ? 0 : current - previous;
  return { delta, percent: previous === 0 ? null : delta / Math.abs(previous) * 100 };
}
