import React from 'react';
import { metricChange } from '../utils/periodComparison';
import { formatCurrency } from '../utils/excelHelpers';

export interface ComparisonValue { current: number; previous: number | null; label: string; lowerIsBetter?: boolean; unit?: 'currency' | 'count' | 'percent' }
export function PeriodChange({ comparison }: { comparison?: ComparisonValue }) {
  if (!comparison) return null;
  const { delta, percent } = metricChange(comparison.current, comparison.previous ?? 0);
  const formatValue = (value: number) => comparison.unit === 'count' ? value.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' adet' : comparison.unit === 'percent' ? '%' + value.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) : formatCurrency(value);
  const formatDifference = (value: number) => comparison.unit === 'percent' ? value.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' yüzde puan' : formatValue(value);
  const good = comparison.lowerIsBetter ? delta < 0 : delta > 0;
  return <details key={comparison.label} className="group mt-1.5 text-left text-[11px] font-normal leading-relaxed">
    <summary className="inline-flex cursor-pointer list-none select-none items-center gap-1 rounded-md px-1.5 py-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 [&::-webkit-details-marker]:hidden">
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="transition-transform group-open:rotate-90"><path d="m9 5 7 7-7 7" /></svg>
      <span className="group-open:hidden">Değişimi gör</span>
      <span className="hidden group-open:inline">Değişimi gizle</span>
    </summary>
    <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
    {comparison.previous === null ? <div className="text-slate-500">{comparison.label}: dönem verisi yok.</div> : <>
    <div className="text-slate-500">{comparison.label} dönemine göre</div>
    <div className={`flex flex-wrap gap-x-2 gap-y-1 font-semibold ${delta === 0 ? 'text-slate-500' : good ? 'text-emerald-600' : 'text-red-600'}`}>
      <span>{delta > 0 ? '↑' : delta < 0 ? '↓' : '—'} {percent === null ? (delta === 0 ? 'Değişim yok' : 'Yüzde hesaplanamaz') : `%${Math.abs(percent).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ${delta > 0 ? 'artış' : delta < 0 ? 'azalış' : 'değişim'}`}</span>
      <span>{delta > 0 ? '+' : delta < 0 ? '−' : ''}{formatDifference(Math.abs(delta))}</span>
    </div>
    <div className="text-slate-400">Önceki: {formatValue(comparison.previous)}{comparison.previous === 0 && ' · Önceki değer sıfır'}</div>
    </>}
    </div>
  </details>;
}
