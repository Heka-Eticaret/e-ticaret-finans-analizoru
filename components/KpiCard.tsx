import { metricChange } from '../utils/periodComparison';
import { formatCurrency } from '../utils/excelHelpers';
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColorClass?: string;
  valueColorClass?: string;
  subLabel?: string;
  comparison?: { current: number; previous: number | null; label: string; lowerIsBetter?: boolean };
}

export const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  iconColorClass = "text-indigo-600 bg-indigo-50", 
  valueColorClass = "text-slate-800",
  subLabel, comparison
}) => {
  const change = comparison && comparison.previous !== null ? metricChange(comparison.current, comparison.previous) : null;
  const positive = change && (comparison?.lowerIsBetter ? change.delta < 0 : change.delta > 0);
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-6 border border-slate-100 flex flex-col justify-between h-full transition hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
        </div>
        <div className={`p-2 rounded-lg ${iconColorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <h3 className={`text-2xl font-bold ${valueColorClass} mb-1`}>{value}</h3>
        {subLabel && (
          <p className="text-xs text-slate-400">
            {subLabel}
          </p>
        )}
        {comparison && <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs text-slate-500">{comparison.label} dönemine göre</p>
          {change ? <>
            <div className={`flex flex-wrap items-center gap-2 text-xs font-semibold ${change.delta === 0 ? 'text-slate-500' : positive ? 'text-emerald-600' : 'text-red-600'}`}>
              <span className="rounded-md bg-slate-50 px-2 py-1">{change.delta > 0 ? '↑' : change.delta < 0 ? '↓' : '—'} {change.percent === null ? (change.delta === 0 ? 'Değişim yok' : 'Yüzde hesaplanamaz') : `%${Math.abs(change.percent).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ${change.delta > 0 ? 'artış' : change.delta < 0 ? 'azalış' : 'değişim'}`}</span>
              <span>{change.delta > 0 ? '+' : change.delta < 0 ? '−' : ''}{formatCurrency(Math.abs(change.delta))}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">Önceki: {formatCurrency(comparison.previous!)}{comparison.previous === 0 && ' · Önceki tutar sıfır'}</p>
          </> : <p className="text-xs text-slate-400">Önceki dönem verisi yok.</p>}
        </div>}
      </div>
    </div>
  );
};
