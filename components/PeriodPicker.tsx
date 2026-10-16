import { parsePeriod, PeriodSelection, periodLabel } from '../utils/periodComparison';
import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const names = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export function PeriodPicker({ months, value, onChange, onSelectPeriod }: { months: string[]; value: string[]; onChange: (value: string[]) => void; onSelectPeriod: (selection: PeriodSelection | null) => void }) {
  const [chosen, setChosen] = useState<{ keys: string[]; label: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'quarter' | 'month' | 'year'>('quarter');
  const entries = months.map(key => ({ key, ...parsePeriod(key) }));
  const years = [...new Set(entries.filter(e => e.year && e.month >= 0 && e.month < 12).map(e => e.year))].sort((a, b) => a - b);
  const [pageYear, setPageYear] = useState<number | null>(null);
  const year = pageYear ?? years[years.length - 1] ?? new Date().getFullYear();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const selected = entries.filter(e => value.includes(e.key));
  let label = value[0] === 'all' ? 'Tüm Zamanlar' : `${value.length} Ay Seçildi`;
  if (chosen && value.length === chosen.keys.length && value.every(k => chosen.keys.includes(k))) label = chosen.label;
  else if (selected.length === 1) label = `${names[selected[0].month]} ${selected[0].year}`;
  const choose = (keys: string[], start?: number, length?: number) => { setChosen(start !== undefined && length ? { keys, label: periodLabel(start, length) } : null); onSelectPeriod(start !== undefined && length ? { start, length, label: periodLabel(start, length), keys } : null); onChange(keys); setOpen(false); trigger.current?.focus(); };
  return <div className="relative" ref={root}>
    <button ref={trigger} type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(!open)} className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-orange-400 focus-visible:outline-orange-500">
      <CalendarDays size={16} className="text-slate-400" />{label}<ChevronDown size={16} />
    </button>
    {open && <div role="dialog" aria-label="Dönem seçimi" className="period-panel absolute right-0 top-full z-50 mt-3 flex w-[720px] max-w-[calc(100vw-32px)] flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:flex-row">
      <button type="button" aria-label="Dönem seçimini kapat" onClick={() => { setOpen(false); trigger.current?.focus(); }} className="mb-2 self-end rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 sm:hidden">Kapat ×</button>
      <nav aria-label="Dönem türü" className="flex shrink-0 gap-1 border-b border-slate-200 pb-3 sm:w-40 sm:flex-col sm:border-b-0 sm:border-r sm:pb-0 sm:pr-3">
        <button type="button" onClick={() => choose(['all'])} className={`rounded px-4 py-3 text-left text-sm font-semibold text-slate-700 ${value[0] === 'all' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>Tüm Zamanlar</button>
        <div className="my-2 hidden border-t border-slate-300 sm:block" />
        {([['quarter', 'Çeyrek'], ['month', 'Ay'], ['year', 'Yıl']] as const).map(([key, title]) => <button key={key} type="button" aria-pressed={mode === key} onClick={() => setMode(key)} className={`rounded px-4 py-3 text-left text-sm font-semibold text-slate-700 ${mode === key ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>{title}</button>)}
      </nav>
      <div className="min-w-0 flex-1 p-3 sm:pl-5">
        <div className="mb-5 flex items-center justify-between">
          <button type="button" aria-label="Önceki yıl" onClick={() => setPageYear(year - 1)} className="rounded p-2 hover:bg-slate-100"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-slate-900">{year}</span>
          <button type="button" aria-label="Sonraki yıl" onClick={() => setPageYear(year + 1)} className="rounded p-2 hover:bg-slate-100"><ChevronRight size={18} /></button>
        </div>
        <div className={`grid gap-3 ${mode === 'quarter' ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {Array.from({ length: mode === 'quarter' ? 4 : mode === 'month' ? 12 : 9 }, (_, i) => {
            const itemYear = mode === 'year' ? year - 4 + i : year;
            const keys = entries.filter(e => e.year === itemYear && e.month >= 0 && e.month < 12 && (mode === 'year' || (mode === 'quarter' ? Math.floor(e.month / 3) === i : e.month === i))).map(e => e.key);
            const active = keys.length > 0 && value.length === keys.length && keys.every(k => value.includes(k));
            return <button type="button" key={i} disabled={!keys.length} aria-pressed={active} onClick={() => choose(keys, itemYear * 12 + (mode === 'quarter' ? i * 3 : mode === 'month' ? i : 0), mode === 'quarter' ? 3 : mode === 'month' ? 1 : 12)} className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-2 py-4 text-sm transition-colors disabled:cursor-not-allowed disabled:text-slate-300 ${active ? 'bg-orange-500 text-white' : 'text-slate-700 enabled:hover:bg-orange-50'}`}>
              <span className={mode === 'quarter' ? 'text-xl font-semibold' : 'font-medium'}>{mode === 'quarter' ? `Q${i + 1}` : mode === 'month' ? names[i] : itemYear}</span>
              {mode === 'quarter' && <span className="text-xs">{names[i * 3]} – {names[i * 3 + 2]}</span>}
            </button>;
          })}
        </div>
        <p className="mt-5 text-center text-xs text-slate-400">Yalnızca veri bulunan dönemler seçilebilir.</p>
      </div>
    </div>}
  </div>;
}
