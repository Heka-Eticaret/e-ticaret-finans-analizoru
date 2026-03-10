import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColorClass?: string;
  valueColorClass?: string;
  subLabel?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  iconColorClass = "text-indigo-600 bg-indigo-50", 
  valueColorClass = "text-slate-800",
  subLabel 
}) => {
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
      </div>
    </div>
  );
};