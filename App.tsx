import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  UploadCloud, TrendingUp, TrendingDown, DollarSign, Package, 
  AlertCircle, LayoutDashboard, ShoppingBag, 
  BarChart2, ChevronDown, ChevronRight, Wallet, CheckCircle, XCircle, LogOut, Trash2, Download, FileJson,
  Tags, AlertTriangle, Search
} from 'lucide-react';
import { parseExcelFile, formatCurrency, formatNumber } from './utils/excelHelpers';
import { SalesDataRow, FixedExpenses, DashboardMetrics } from './types';
import { KpiCard } from './components/KpiCard';
import { Login } from './components/Login';
import { INITIAL_SALES_DATA, INITIAL_EXPENSES } from './initialData';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];
const DONUT_COLORS = [
  '#4f46e5',
  '#d946ef',
  '#a78bfa',
  '#fb7185',
  '#f59e0b',
  '#10b981',
];

// ─── Donut Chart ──────────────────────────────────────────────────────────────
interface DonutItem { name: string; value: number; color: string; }

const DonutChart: React.FC<{ data: DonutItem[]; totalFormatted: string }> = ({ data, totalFormatted }) => {
  const size = 250;
  const strokeWidth = 34;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const gap = 5;
  const total = data.reduce((s, d) => s + d.value, 0);

  let cumulative = 0;

  const segments = data.map((item) => {
    const ratio = total > 0 ? item.value / total : 0;
    const dash = Math.max(0, ratio * circumference - gap);
    const rotation = cumulative * 360 - 90;
    cumulative += ratio;

    return { ...item, dash, rotation };
  });

  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="drop-shadow-sm">
        <defs>
          <filter id="softExpenseShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#eef2f7"
          strokeWidth={strokeWidth}
        />

        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.dash} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            filter="url(#softExpenseShadow)"
            style={{
              transform: `rotate(${seg.rotation}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'all 0.35s ease',
            }}
          />
        ))}

        <circle
          cx={cx}
          cy={cy}
          r={r - strokeWidth / 2 - 8}
          fill="#ffffff"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <div className="text-[10px] tracking-[0.28em] uppercase text-slate-400 font-semibold">
          Toplam Gider
        </div>
        <div className="mt-2 text-2xl font-bold text-slate-900 leading-none">
          {totalFormatted}
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          Gider dağılımı
        </div>
      </div>
    </div>
  );
};

// ─── Expense Breakdown Card ───────────────────────────────────────────────────
interface ExpenseItem { name: string; value: number; }

const ExpenseBreakdownCard: React.FC<{
  expenseData: ExpenseItem[];
  cogsValue: number;
  formatNumber: (n: number) => string;
  formatCurrency: (n: number) => string;
}> = ({ expenseData, cogsValue, formatNumber, formatCurrency }) => {
  const total = expenseData.reduce((s, i) => s + i.value, 0);
  const donutData: DonutItem[] = expenseData.map((item, idx) => ({
    name: item.name,
    value: item.value,
    color: DONUT_COLORS[idx % DONUT_COLORS.length],
  }));

  const totalFormatted = total >= 1_000_000 ? `₺${(total / 1_000_000).toFixed(2)}M` : formatCurrency(total);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col gap-5 overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-rose-600">
            <TrendingDown size={16} />
            <span className="text-sm font-semibold">Gider Dağılımı</span>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Komisyon, kargo, reklam ve operasyonel giderlerin toplam içindeki payı.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2 text-right shrink-0">
          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
            Toplam
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900">
            {formatCurrency(total)}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {expenseData.map((item, idx) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          const color = DONUT_COLORS[idx % DONUT_COLORS.length];

          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-semibold text-slate-700 truncate">
                    {item.name}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-slate-900">
                    {formatNumber(item.value)} TL
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    %{pct.toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Maliyet / Alış
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Gider dağılımına dahil edilmedi
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-bold text-slate-700">
            {formatNumber(cogsValue)} TL
          </div>
        </div>
      </div>

      <div className="rounded-[28px] bg-gradient-to-b from-slate-50 to-white border border-slate-100 py-7">
        <DonutChart data={donutData} totalFormatted={totalFormatted} />
      </div>
    </div>
  );
};

const calculateMetrics = (data: SalesDataRow[], expenses: FixedExpenses, monthFilter: string | string[] | 'all', platformFilter: string | 'all'): DashboardMetrics => {
    let revenueIncVAT = 0, costOfGoods = 0, commission = 0, shipping = 0, penalty = 0,
        platformExp = 0, returnLoss = 0, deliveredOrderCount = 0, returnedOrderCount = 0,
        deliveredProductQty = 0, returnedProductQty = 0;

    data.forEach(row => {
      const isReturn = row.SiparisStatusu === 'İade Edildi';
      const orderCountVal = row.SiparisSayisi || 1;
      const productQtyVal = row.UrunAdedi || 0;
      commission += row.Komisyon;
      shipping += (row.Kargo + row.IadeKargoBedeli);
      penalty += row.CezaBedeli;
      platformExp += row.PlatformGideri;
      if (isReturn) {
        returnLoss += row.SiparisTutari;
        returnedOrderCount += orderCountVal;
        returnedProductQty += productQtyVal;
      } else {
        revenueIncVAT += row.SiparisTutari;
        costOfGoods += row.AlisFiyati;
        deliveredOrderCount += orderCountVal;
        deliveredProductQty += productQtyVal;
      }
    });

    let marketingExp = 0, operatingExp = 0;
    const selectedMonths = typeof monthFilter === 'string' ? [monthFilter] : monthFilter;
    if (selectedMonths.length > 0 && selectedMonths[0] !== 'all') {
        selectedMonths.forEach(month => {
            if (expenses[month]) { marketingExp += expenses[month].marketing; operatingExp += expenses[month].operations; }
        });
    } else {
        Object.values(expenses).forEach(exp => { marketingExp += exp.marketing; operatingExp += exp.operations; });
    }

    const revenueExVAT = revenueIncVAT / 1.2;
    const grossProfit = revenueExVAT - costOfGoods;
    const netProfit = grossProfit - commission - shipping - penalty - platformExp - marketingExp - operatingExp;

    return {
      totalRevenueIncVAT: revenueIncVAT, totalRevenueExVAT: revenueExVAT,
      totalCostOfGoods: costOfGoods, totalGrossProfit: grossProfit, totalNetProfit: netProfit,
      totalCommission: commission, totalShipping: shipping, totalPenalty: penalty,
      totalPlatformExpense: platformExp, totalMarketingExpense: marketingExp,
      totalOperatingExpense: operatingExp, returnLoss,
      deliveredOrderCount, returnedOrderCount, deliveredProductQty, returnedProductQty
    };
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [salesData, setSalesData] = useState<SalesDataRow[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenses>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'monthly'>('overview');
  const [globalPeriod, setGlobalPeriod] = useState<string[]>(['all']);
  const [globalChannelFilter, setGlobalChannelFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [channelSearchTerm, setChannelSearchTerm] = useState('');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [compareMonth1, setCompareMonth1] = useState<string>('');
  const [compareMonth2, setCompareMonth2] = useState<string>('');

  useEffect(() => {
    const storedSales = localStorage.getItem('ecommerce_sales_data');
    const storedExpenses = localStorage.getItem('ecommerce_expenses');
    if (storedSales) { try { setSalesData(JSON.parse(storedSales)); } catch { setSalesData(INITIAL_SALES_DATA); } }
    else { setSalesData(INITIAL_SALES_DATA); }
    if (storedExpenses) { try { setFixedExpenses(JSON.parse(storedExpenses)); } catch { setFixedExpenses(INITIAL_EXPENSES); } }
    else {
      setFixedExpenses(INITIAL_EXPENSES);
      try { localStorage.setItem('ecommerce_expenses', JSON.stringify(INITIAL_EXPENSES)); } catch {}
    }
  }, []);

  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    salesData.forEach(row => { if (row.Ay) months.add(row.Ay); });
    const trMonths = ['ocak','şubat','mart','nisan','mayıs','haziran','temmuz','ağustos','eylül','ekim','kasım','aralık'];
    return Array.from(months).sort((a, b) => {
      const parse = (str: string) => {
        const l = str.toLowerCase();
        const mi = trMonths.findIndex(m => l.includes(m));
        const ym = str.match(/\d{4}/);
        return { monthIdx: mi, year: ym ? parseInt(ym[0]) : 0 };
      };
      const dA = parse(a), dB = parse(b);
      if (dA.monthIdx !== -1 && dB.monthIdx !== -1) {
        if (dA.year !== dB.year) return dA.year - dB.year;
        return dA.monthIdx - dB.monthIdx;
      }
      return a.localeCompare(b);
    });
  }, [salesData]);

  useEffect(() => {
    if (uniqueMonths.length >= 2 && !compareMonth1 && !compareMonth2) {
      setCompareMonth1(uniqueMonths[uniqueMonths.length - 2]);
      setCompareMonth2(uniqueMonths[uniqueMonths.length - 1]);
    } else if (uniqueMonths.length === 1 && !compareMonth1) {
      setCompareMonth1(uniqueMonths[0]); setCompareMonth2(uniqueMonths[0]);
    }
  }, [uniqueMonths, compareMonth1, compareMonth2]);

  const uniquePlatforms = useMemo(() => {
    const platforms = new Set<string>();
    salesData.forEach(row => { if (row.Platform) platforms.add(row.Platform); });
    return Array.from(platforms).sort();
  }, [salesData]);

  const overviewData = useMemo(() => salesData.filter(row =>
    (globalPeriod[0] === 'all' || globalPeriod.includes(row.Ay)) &&
    (globalChannelFilter === 'all' || row.Platform === globalChannelFilter)
  ), [salesData, globalPeriod, globalChannelFilter]);

  const overviewMetrics = useMemo(() =>
    calculateMetrics(overviewData, fixedExpenses, globalPeriod, globalChannelFilter),
  [overviewData, fixedExpenses, globalPeriod, globalChannelFilter]);

  const grossMarginRate = useMemo(() =>
    overviewMetrics.totalRevenueExVAT <= 0 ? 0 : (overviewMetrics.totalGrossProfit / overviewMetrics.totalRevenueExVAT) * 100,
  [overviewMetrics]);

  const netMarginRate = useMemo(() =>
    overviewMetrics.totalRevenueExVAT <= 0 ? 0 : (overviewMetrics.totalNetProfit / overviewMetrics.totalRevenueExVAT) * 100,
  [overviewMetrics]);

  const channelRevenueData = useMemo(() => {
    const stats: Record<string, number> = {};
    overviewData.forEach(row => {
      if (row.SiparisStatusu !== 'İade Edildi') stats[row.Platform] = (stats[row.Platform] || 0) + row.SiparisTutari;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [overviewData]);

  const expenseBreakdownData = useMemo(() => [
    { name: 'Komisyon', value: Math.abs(overviewMetrics.totalCommission) },
    { name: 'Kargo', value: Math.abs(overviewMetrics.totalShipping) },
    { name: 'Reklam', value: overviewMetrics.totalMarketingExpense },
    { name: 'İşletme', value: overviewMetrics.totalOperatingExpense },
    { name: 'Ceza', value: Math.abs(overviewMetrics.totalPenalty) },
    { name: 'Platform', value: Math.abs(overviewMetrics.totalPlatformExpense) },
  ].filter(item => item.value > 0), [overviewMetrics]);

  const channelViewMetrics = useMemo(() => {
    const filtered = salesData.filter(row =>
      (channelFilter === 'all' || row.Platform === channelFilter) &&
      (globalPeriod[0] === 'all' || globalPeriod.includes(row.Ay))
    );
    return calculateMetrics(filtered, fixedExpenses, globalPeriod, channelFilter);
  }, [salesData, fixedExpenses, channelFilter, globalPeriod]);

  const topOrdersByValue = useMemo(() => {
    const filtered = salesData.filter(row =>
      (channelFilter === 'all' || row.Platform === channelFilter) &&
      (globalPeriod[0] === 'all' || globalPeriod.includes(row.Ay)) &&
      row.SiparisStatusu !== 'İade Edildi'
    );
    const orderTotals: Record<string, { totalValue: number, platform: string, month: string, items: string[] }> = {};
    filtered.forEach(row => {
      const id = row.SiparisNo;
      if (!orderTotals[id]) orderTotals[id] = { totalValue: 0, platform: row.Platform, month: row.Ay, items: [] };
      orderTotals[id].totalValue += row.SiparisTutari;
      if (!orderTotals[id].items.includes(row.UrunAciklamasi)) orderTotals[id].items.push(row.UrunAciklamasi);
    });
    return Object.entries(orderTotals).map(([orderId, data]) => ({ orderId, ...data }))
      .sort((a, b) => b.totalValue - a.totalValue).slice(0, 5);
  }, [salesData, channelFilter, globalPeriod]);

  const categoryStats = useMemo(() => {
    const filtered = salesData.filter(row =>
      (channelFilter === 'all' || row.Platform === channelFilter) &&
      (globalPeriod[0] === 'all' || globalPeriod.includes(row.Ay))
    );
    const stats: Record<string, { revenue: number, qty: number, products: Record<string, {qty: number, revenue: number}> }> = {};
    filtered.forEach(row => {
      if (row.SiparisStatusu !== 'İade Edildi') {
        const group = row.UrunGrubu || 'Diğer';
        if (!stats[group]) stats[group] = { revenue: 0, qty: 0, products: {} };
        stats[group].revenue += row.SiparisTutari;
        stats[group].qty += row.UrunAdedi;
        const pn = row.UrunAciklamasi;
        if (!stats[group].products[pn]) stats[group].products[pn] = { qty: 0, revenue: 0 };
        stats[group].products[pn].qty += row.UrunAdedi;
        stats[group].products[pn].revenue += row.SiparisTutari;
      }
    });
    return Object.entries(stats).map(([name, data]) => ({
      name, revenue: data.revenue, qty: data.qty,
      topProducts: Object.entries(data.products)
        .map(([pName, pData]) => ({ name: pName, qty: pData.qty, revenue: pData.revenue }))
        .sort((a, b) => b.qty - a.qty).slice(0, 5)
    })).sort((a, b) => b.revenue - a.revenue);
  }, [salesData, channelFilter, globalPeriod]);

  const toggleCategory = (catName: string) => {
    const s = new Set(expandedCategories);
    s.has(catName) ? s.delete(catName) : s.add(catName);
    setExpandedCategories(s);
  };

  const channelSearchStats = useMemo(() => {
    if (!channelSearchTerm.trim()) return [];
    const filtered = salesData.filter(row =>
      (channelFilter === 'all' || row.Platform === channelFilter) &&
      (globalPeriod[0] === 'all' || globalPeriod.includes(row.Ay))
    );
    const lt = channelSearchTerm.toLocaleLowerCase('tr-TR');
    const matches = filtered.filter(row =>
      (row.UrunAciklamasi && row.UrunAciklamasi.toLocaleLowerCase('tr-TR').includes(lt)) ||
      (row.UrunKodu && String(row.UrunKodu).toLocaleLowerCase('tr-TR').includes(lt))
    );
    const stats: Record<string, { name: string, sku: string, deliveredQty: number, deliveredRevenue: number, returnedQty: number, returnedRevenue: number }> = {};
    matches.forEach(row => {
      const key = row.UrunAciklamasi;
      if (!stats[key]) stats[key] = { name: row.UrunAciklamasi, sku: row.UrunKodu, deliveredQty: 0, deliveredRevenue: 0, returnedQty: 0, returnedRevenue: 0 };
      if (row.SiparisStatusu === 'İade Edildi') {
        stats[key].returnedQty += (row.UrunAdedi || 0); stats[key].returnedRevenue += (row.SiparisTutari || 0);
      } else {
        stats[key].deliveredQty += (row.UrunAdedi || 0); stats[key].deliveredRevenue += (row.SiparisTutari || 0);
      }
    });
    return Object.values(stats).sort((a, b) => b.deliveredRevenue - a.deliveredRevenue);
  }, [salesData, channelFilter, globalPeriod, channelSearchTerm]);

  const returnStats = useMemo(() => {
    const filtered = salesData.filter(row =>
      (channelFilter === 'all' || row.Platform === channelFilter) &&
      (globalPeriod[0] === 'all' || globalPeriod.includes(row.Ay))
    );
    const stats: Record<string, { qty: number, lostAmount: number }> = {};
    filtered.forEach(row => {
      if (row.SiparisStatusu === 'İade Edildi') {
        const pn = row.UrunAciklamasi;
        if (!stats[pn]) stats[pn] = { qty: 0, lostAmount: 0 };
        stats[pn].qty += (row.UrunAdedi || 1); stats[pn].lostAmount += row.SiparisTutari;
      }
    });
    const arr = Object.entries(stats).map(([name, val]) => ({ name, ...val }));
    return { byQty: [...arr].sort((a, b) => b.qty - a.qty).slice(0, 5), byAmount: [...arr].sort((a, b) => b.lostAmount - a.lostAmount).slice(0, 5) };
  }, [salesData, channelFilter, globalPeriod]);

  const comparisonData = useMemo(() => {
    if (!compareMonth1 || !compareMonth2) return null;
    const m1 = calculateMetrics(salesData.filter(r => r.Ay === compareMonth1), fixedExpenses, compareMonth1, 'all');
    const m2 = calculateMetrics(salesData.filter(r => r.Ay === compareMonth2), fixedExpenses, compareMonth2, 'all');
    return {
      m1, m2,
      diffRevenue: m2.totalRevenueIncVAT - m1.totalRevenueIncVAT,
      diffProfit: m2.totalNetProfit - m1.totalNetProfit,
      diffOrders: (m2.deliveredOrderCount + m2.returnedOrderCount) - (m1.deliveredOrderCount + m1.returnedOrderCount),
      chartData: [
        { name: 'Ciro (TL)', [compareMonth1]: m1.totalRevenueIncVAT, [compareMonth2]: m2.totalRevenueIncVAT },
        { name: 'Net Kâr (TL)', [compareMonth1]: m1.totalNetProfit, [compareMonth2]: m2.totalNetProfit },
        { name: 'Giderler (TL)', [compareMonth1]: m1.totalRevenueIncVAT - m1.totalNetProfit, [compareMonth2]: m2.totalRevenueIncVAT - m2.totalNetProfit }
      ]
    };
  }, [salesData, fixedExpenses, compareMonth1, compareMonth2]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setLoading(true);
      try {
        const { sales, expenses } = await parseExcelFile(e.target.files[0]);
        setSalesData(sales); setFixedExpenses(expenses);
        localStorage.setItem('ecommerce_sales_data', JSON.stringify(sales));
        localStorage.setItem('ecommerce_expenses', JSON.stringify(expenses));
      } catch { alert("Dosya okunamadı."); } finally { setLoading(false); }
    }
  };

  const handleResetData = () => {
    if (window.confirm('Tüm yüklü veriler ve geçmiş silinecek. Emin misiniz?')) {
      setSalesData(INITIAL_SALES_DATA); setFixedExpenses({});
      localStorage.removeItem('ecommerce_sales_data'); localStorage.removeItem('ecommerce_expenses');
    }
  };

  const handleExportData = () => {
    const blob = new Blob([JSON.stringify({ sales: salesData, expenses: fixedExpenses }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `eticaret-yedek-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.sales && Array.isArray(parsed.sales)) {
          setSalesData(parsed.sales); setFixedExpenses(parsed.expenses || {});
          localStorage.setItem('ecommerce_sales_data', JSON.stringify(parsed.sales));
          localStorage.setItem('ecommerce_expenses', JSON.stringify(parsed.expenses || {}));
          alert('Yedek başarıyla yüklendi!');
        } else { alert('Geçersiz yedek dosyası formatı.'); }
      } catch { alert('Dosya okunamadı.'); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  const renderSidebar = () => (
    <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-10 hidden md:flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-indigo-600">Heka E-Ticaret</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {[
          { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
          { id: 'channels', label: 'Kanal Analizi', icon: ShoppingBag },
          { id: 'monthly', label: 'Karşılaştırma', icon: BarChart2 },
        ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}>
            <item.icon className="w-5 h-5" />{item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100 space-y-2">
        <label className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors w-full">
          <UploadCloud className="w-4 h-4" /><span>Yeni Dosya Yükle</span>
          <input type="file" accept=".xlsx" onChange={handleFileUpload} className="hidden" />
        </label>
        <button onClick={handleExportData} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 w-full transition-colors">
          <Download className="w-4 h-4" /><span>Yedeği İndir</span>
        </button>
        <label className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors w-full">
          <FileJson className="w-4 h-4" /><span>Yedekten Yükle</span>
          <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
        </label>
        <button onClick={handleResetData} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 w-full transition-colors">
          <Trash2 className="w-4 h-4" /><span>Verileri Sıfırla</span>
        </button>
        <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 w-full transition-colors">
          <LogOut className="w-4 h-4" /><span>Güvenli Çıkış</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-inter flex text-slate-800">
      {renderSidebar()}
      <div className="flex-1 md:ml-64">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-8 py-5 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === 'overview' && 'Genel Bakış'}
              {activeTab === 'channels' && 'Kanal Analizi'}
              {activeTab === 'monthly' && 'Karşılaştırma'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeTab === 'overview' && 'Tüm satış kanallarınızın anlık finansal durumu.'}
              {activeTab === 'channels' && 'Platform bazlı performans ve kârlılık analizi.'}
              {activeTab === 'monthly' && 'Aylar arası performans farklarını inceleyin.'}
            </p>
          </div>
          {(activeTab === 'overview' || activeTab === 'channels') && (
            <div className="flex items-center gap-2">
              {activeTab === 'overview' && (
                <>
                  <span className="text-sm font-medium text-slate-600">Kanal:</span>
                  <div className="relative">
                    <select value={globalChannelFilter} onChange={(e) => setGlobalChannelFilter(e.target.value)}
                      className="appearance-none bg-white border border-slate-300 hover:border-indigo-500 text-slate-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-[140px]">
                      <option value="all">Tüm Kanallar</option>
                      {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="w-px h-6 bg-slate-200 mx-1" />
                </>
              )}
              <span className="text-sm font-medium text-slate-600">Dönem:</span>
              <div className="relative">
                <button onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                  className="bg-white border border-slate-300 hover:border-indigo-500 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 flex items-center gap-2 w-[160px] whitespace-nowrap">
                  {globalPeriod[0] === 'all' ? 'Tüm Zamanlar' : `${globalPeriod.length} Ay Seçildi`}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isPeriodDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                    <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 cursor-pointer border-b border-slate-100">
                      <input type="checkbox" checked={globalPeriod[0] === 'all'} onChange={() => setGlobalPeriod(['all'])}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-200" />
                      <span className="text-sm font-medium text-slate-700">Tüm Zamanlar</span>
                    </label>
                    {uniqueMonths.map(month => (
                      <label key={month} className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 cursor-pointer">
                        <input type="checkbox"
                          checked={globalPeriod[0] !== 'all' && globalPeriod.includes(month)}
                          onChange={() => {
                            if (globalPeriod[0] === 'all') { setGlobalPeriod([month]); }
                            else if (globalPeriod.includes(month)) {
                              const n = globalPeriod.filter(m => m !== month);
                              setGlobalPeriod(n.length === 0 ? ['all'] : n);
                            } else { setGlobalPeriod([...globalPeriod, month]); }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-200" />
                        <span className="text-sm text-slate-700">{month}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        <main className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Ciro (KDV Dahil)" value={formatCurrency(overviewMetrics.totalRevenueIncVAT)}
                  icon={DollarSign} iconColorClass="bg-indigo-50 text-indigo-600" valueColorClass="text-indigo-600"
                  subLabel="Satışlardan elde edilen toplam tutar" />
                <KpiCard title="Brüt Kar" value={formatCurrency(overviewMetrics.totalGrossProfit)}
                  icon={TrendingUp} iconColorClass="bg-blue-50 text-blue-600" valueColorClass="text-blue-600"
                  subLabel={`%${grossMarginRate.toFixed(1)} Marj (KDV Hariç Cirodan)`} />
                <KpiCard title="Net Kar" value={formatCurrency(overviewMetrics.totalNetProfit)} icon={Wallet}
                  iconColorClass={overviewMetrics.totalNetProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}
                  valueColorClass={overviewMetrics.totalNetProfit >= 0 ? "text-emerald-600" : "text-red-600"}
                  subLabel={`%${netMarginRate.toFixed(1)} Net Marj`} />
                <KpiCard title="Toplam Giderler"
                  value={formatCurrency(Math.abs(overviewMetrics.totalCommission) + Math.abs(overviewMetrics.totalShipping) + Math.abs(overviewMetrics.totalPenalty) + Math.abs(overviewMetrics.totalPlatformExpense) + overviewMetrics.totalMarketingExpense + overviewMetrics.totalOperatingExpense)}
                  icon={TrendingDown} iconColorClass="bg-red-50 text-red-600" valueColorClass="text-red-600"
                  subLabel="Komisyon, Kargo, Reklam, İşletme vb." />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gelir Tablosu */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 rounded text-indigo-600"><LayoutDashboard size={16}/></div>
                    Gelir Tablosu
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-dashed border-slate-100">
                      <span className="text-slate-600 font-medium">Toplam Ciro (KDV Dahil)</span>
                      <span className="font-bold text-slate-800">{formatNumber(overviewMetrics.totalRevenueIncVAT)} TL</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed border-slate-100">
                      <span className="text-red-500">(-) İade Ciro Kaybı</span>
                      <span className="font-semibold text-red-600">{formatNumber(overviewMetrics.returnLoss)} TL</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed border-slate-100">
                      <span className="text-slate-600">Toplam Ciro (KDV Hariç)</span>
                      <span className="font-semibold text-slate-700">{formatNumber(overviewMetrics.totalRevenueExVAT)} TL</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed border-slate-100">
                      <span className="text-red-500">(-) Alış Maliyeti (COGS)</span>
                      <span className="font-semibold text-red-600">{formatNumber(overviewMetrics.totalCostOfGoods)} TL</span>
                    </div>
                    <div className="flex justify-between py-3 bg-blue-50 px-3 rounded-lg my-2 items-center">
                      <span className="text-blue-800 font-bold">BRÜT KAR</span>
                      <div className="text-right">
                        <span className="font-bold text-blue-800 block">{formatNumber(overviewMetrics.totalGrossProfit)} TL</span>
                        <span className="text-xs text-blue-600 font-medium">%{grossMarginRate.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed border-slate-100">
                      <span className="text-red-500">(-) Operasyonel Giderler</span>
                      <span className="font-semibold text-red-500">
                        {formatNumber(Math.abs(overviewMetrics.totalCommission) + Math.abs(overviewMetrics.totalShipping) + Math.abs(overviewMetrics.totalPenalty) + Math.abs(overviewMetrics.totalPlatformExpense))} TL
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed border-slate-100">
                      <span className="text-red-500">(-) Reklam Gideri</span>
                      <span className="font-semibold text-red-500">{formatNumber(overviewMetrics.totalMarketingExpense)} TL</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dashed border-slate-100">
                      <span className="text-red-500">(-) İşletme Gideri</span>
                      <span className="font-semibold text-red-500">{formatNumber(overviewMetrics.totalOperatingExpense)} TL</span>
                    </div>
                    <div className={`flex justify-between py-4 ${overviewMetrics.totalNetProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'} px-3 rounded-lg mt-4 items-center`}>
                      <span className={`${overviewMetrics.totalNetProfit >= 0 ? 'text-emerald-800' : 'text-red-800'} font-bold`}>NET KAR</span>
                      <div className="text-right">
                        <span className={`font-bold ${overviewMetrics.totalNetProfit >= 0 ? 'text-emerald-800' : 'text-red-800'} text-lg block`}>{formatNumber(overviewMetrics.totalNetProfit)} TL</span>
                        <span className={`text-xs ${overviewMetrics.totalNetProfit >= 0 ? 'text-emerald-700' : 'text-red-700'} font-medium`}>%{netMarginRate.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gider Dağılımı — yeni bileşen */}
                <ExpenseBreakdownCard
                  expenseData={expenseBreakdownData}
                  cogsValue={overviewMetrics.totalCostOfGoods}
                  formatNumber={formatNumber}
                  formatCurrency={formatCurrency}
                />

                {/* Kanal Bazlı Ciro */}
                <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm max-w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 text-blue-600">
                        <BarChart2 size={16} /><span className="text-sm font-semibold">Kanal Bazlı Ciro</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 max-w-md">Satış kanallarına göre ciro dağılımını ve paylarını hızlıca gösterir.</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 px-3 py-2 border border-slate-100 text-right">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Toplam Ciro</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(channelRevenueData.reduce((s, i) => s + i.value, 0))} TL</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {channelRevenueData.map((item, idx) => {
                      const total = channelRevenueData.reduce((s, i) => s + i.value, 0);
                      const percent = ((item.value / total) * 100).toFixed(1);
                      return (
                        <div key={item.name} className="rounded-3xl bg-slate-50 p-3 border border-slate-100">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                              <span className="truncate text-sm font-semibold text-slate-800">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-slate-900">{formatCurrency(item.value)} TL</div>
                              <div className="text-[11px] text-slate-500">{percent}%</div>
                            </div>
                          </div>
                          <div className="mt-3 h-2.5 w-full rounded-full bg-white border border-slate-200 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percent}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><TrendingUp size={24} /></div>
                  <h3 className="text-lg font-bold text-slate-900">Kanal Analizi & Kârlılık</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Kanal Seçimi:</span>
                  <div className="relative">
                    <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}
                      className="appearance-none bg-white border border-slate-300 hover:border-indigo-500 text-slate-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-[150px]">
                      <option value="all">Tüm Kanallar</option>
                      {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KpiCard title="Toplam Ciro (Gelir)" value={formatCurrency(channelViewMetrics.totalRevenueIncVAT)}
                  icon={DollarSign} iconColorClass="bg-gray-50 text-gray-300" valueColorClass="text-indigo-600" subLabel="KDV Dahil Satış Tutarı" />
                <KpiCard title="Toplam Gider"
                  value={formatCurrency(Math.abs(channelViewMetrics.totalCommission) + Math.abs(channelViewMetrics.totalShipping) + channelViewMetrics.totalCostOfGoods)}
                  icon={TrendingDown} iconColorClass="bg-gray-50 text-gray-300" valueColorClass="text-red-600" subLabel="Maliyet + Komisyon + Kargo" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mt-1"><Package size={24} /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">SİPARİŞ SAYISI</p>
                    <p className="text-2xl font-bold text-slate-800 mb-2">{formatNumber(channelViewMetrics.deliveredOrderCount + channelViewMetrics.returnedOrderCount)}</p>
                    <div className="flex flex-col text-xs space-y-1">
                      <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle size={12}/> Teslim: {formatNumber(channelViewMetrics.deliveredOrderCount)}</span>
                      <span className="text-red-500 font-medium flex items-center gap-1"><XCircle size={12}/> İade: {formatNumber(channelViewMetrics.returnedOrderCount)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mt-1"><Package size={24} /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">SATILAN ÜRÜN</p>
                    <p className="text-2xl font-bold text-slate-800 mb-2">{formatNumber(channelViewMetrics.deliveredProductQty + channelViewMetrics.returnedProductQty)} Adet</p>
                    <div className="flex flex-col text-xs space-y-1">
                      <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle size={12}/> Teslim: {formatNumber(channelViewMetrics.deliveredProductQty)}</span>
                      <span className="text-red-500 font-medium flex items-center gap-1"><XCircle size={12}/> İade: {formatNumber(channelViewMetrics.returnedProductQty)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><AlertCircle size={24} /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">İADE ORANI</p>
                    <p className="text-2xl font-bold text-slate-800">
                      % {(channelViewMetrics.deliveredOrderCount + channelViewMetrics.returnedOrderCount) > 0
                        ? ((channelViewMetrics.returnedOrderCount / (channelViewMetrics.deliveredOrderCount + channelViewMetrics.returnedOrderCount)) * 100).toFixed(1)
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded text-indigo-600"><Tags size={16}/></div>
                  <h3 className="font-bold text-slate-800">Kategori Bazlı Performans</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium text-slate-500">Ürün Grubu</th>
                        <th className="px-6 py-3 text-right font-medium text-slate-500">Satılan Adet</th>
                        <th className="px-6 py-3 text-right font-medium text-slate-500">Toplam Ciro</th>
                        <th className="px-6 py-3 text-right font-medium text-slate-500">Ciro Payı</th>
                        <th className="px-6 py-3 text-right font-medium text-slate-500">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryStats.map((cat, idx) => (
                        <React.Fragment key={idx}>
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-slate-700">{cat.name}</td>
                            <td className="px-6 py-3 text-right text-slate-600">{formatNumber(cat.qty)}</td>
                            <td className="px-6 py-3 text-right font-bold text-slate-800">{formatCurrency(cat.revenue)}</td>
                            <td className="px-6 py-3 text-right text-slate-500">%{channelViewMetrics.totalRevenueIncVAT > 0 ? ((cat.revenue / channelViewMetrics.totalRevenueIncVAT) * 100).toFixed(1) : 0}</td>
                            <td className="px-6 py-3 text-right">
                              <button onClick={() => toggleCategory(cat.name)}
                                className="text-indigo-600 hover:text-indigo-800 font-medium text-xs flex items-center justify-end gap-1 ml-auto">
                                {expandedCategories.has(cat.name) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>} Ürünler
                              </button>
                            </td>
                          </tr>
                          {expandedCategories.has(cat.name) && (
                            <tr className="bg-indigo-50/30">
                              <td colSpan={5} className="px-6 py-4">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">En Çok Satan 5 Ürün</p>
                                <div className="space-y-2">
                                  {cat.topProducts.map((prod, pIdx) => (
                                    <div key={pIdx} className="flex justify-between items-center text-sm border-b border-indigo-100 last:border-0 pb-1 last:pb-0">
                                      <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-white text-indigo-600 flex items-center justify-center text-xs font-bold shadow-sm border border-indigo-100">{pIdx + 1}</span>
                                        <span className="text-slate-700 truncate max-w-[400px]" title={prod.name}>{prod.name}</span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="text-slate-600 font-medium bg-white px-2 py-0.5 rounded border border-indigo-100">{prod.qty} Adet</span>
                                        <span className="text-slate-800 font-bold w-[100px] text-right">{formatCurrency(prod.revenue)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded text-emerald-600"><DollarSign size={16}/></div>
                  <h3 className="font-bold text-slate-800">En Yüksek Sepet Tutarları</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium text-slate-500">Sipariş No</th>
                        <th className="px-6 py-3 text-left font-medium text-slate-500">Platform</th>
                        <th className="px-6 py-3 text-left font-medium text-slate-500">Ay</th>
                        <th className="px-6 py-3 text-right font-medium text-slate-500">Toplam Tutar</th>
                        <th className="px-6 py-3 text-left font-medium text-slate-500">Ürünler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topOrdersByValue.length > 0 ? topOrdersByValue.map((order, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-slate-700">{order.orderId}</td>
                          <td className="px-6 py-3 text-slate-600">{order.platform}</td>
                          <td className="px-6 py-3 text-slate-600">{order.month}</td>
                          <td className="px-6 py-3 text-right font-bold text-emerald-600">{formatCurrency(order.totalValue)}</td>
                          <td className="px-6 py-3 text-slate-600 max-w-[300px] truncate" title={order.items.join(', ')}>{order.items.join(', ')}</td>
                        </tr>
                      )) : <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Uygun sipariş bulunamadı.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                  <div className="p-1.5 bg-red-100 rounded text-red-600"><AlertTriangle size={16}/></div>
                  <h3 className="font-bold text-slate-800">En Çok İade Edilen Ürünler</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium text-slate-500">Ürün Adı</th>
                        <th className="px-6 py-3 text-right font-medium text-slate-500">İade Adeti</th>
                        <th className="px-6 py-3 text-right font-medium text-slate-500">İade Tutarı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {returnStats.byQty.length > 0 ? returnStats.byQty.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-slate-700 max-w-[300px] truncate" title={item.name}>{item.name}</td>
                          <td className="px-6 py-3 text-right font-medium text-red-600">{formatNumber(item.qty)} Adet</td>
                          <td className="px-6 py-3 text-right font-bold text-red-600">{formatCurrency(item.lostAmount)}</td>
                        </tr>
                      )) : <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">İade verisi bulunamadı.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Search size={24} /></div>
                    <div>
                      <h3 className="font-bold text-slate-800">Detaylı Ürün Arama</h3>
                      <p className="text-sm text-slate-500">Ürün bazlı teslim ve iade detaylarını inceleyin.</p>
                    </div>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input type="text" placeholder="Ürün adı veya kodu ile arayın..."
                      value={channelSearchTerm} onChange={(e) => setChannelSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none" />
                  </div>
                </div>
                {channelSearchTerm ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-slate-500">Ürün Adı</th>
                          <th className="px-6 py-3 text-left font-medium text-slate-500">Stok Kodu</th>
                          <th className="px-6 py-3 text-right font-medium text-emerald-600">Teslim (Adet)</th>
                          <th className="px-6 py-3 text-right font-medium text-emerald-600">Teslim (Ciro)</th>
                          <th className="px-6 py-3 text-right font-medium text-red-600">İade (Adet)</th>
                          <th className="px-6 py-3 text-right font-medium text-red-600">İade (Tutar)</th>
                          <th className="px-6 py-3 text-right font-medium text-slate-700">Net Ciro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {channelSearchStats.length > 0 ? channelSearchStats.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-slate-700 max-w-[300px] truncate" title={item.name}>{item.name}</td>
                            <td className="px-6 py-3 text-slate-500 font-mono text-xs">{item.sku}</td>
                            <td className="px-6 py-3 text-right font-medium text-slate-700">{formatNumber(item.deliveredQty)}</td>
                            <td className="px-6 py-3 text-right font-medium text-emerald-600">{formatCurrency(item.deliveredRevenue)}</td>
                            <td className="px-6 py-3 text-right font-medium text-slate-700">{formatNumber(item.returnedQty)}</td>
                            <td className="px-6 py-3 text-right font-medium text-red-600">{formatCurrency(item.returnedRevenue)}</td>
                            <td className="px-6 py-3 text-right font-bold text-slate-800 bg-slate-50/50">{formatCurrency(item.deliveredRevenue - item.returnedRevenue)}</td>
                          </tr>
                        )) : <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Aradığınız kriterlere uygun ürün bulunamadı.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">Sonuçları görmek için yukarıdaki alandan ürün araması yapın.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'monthly' && comparisonData && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <h3 className="text-lg font-bold text-slate-900">Aylık Karşılaştırma</h3>
                  <div className="flex items-center gap-3">
                    <select value={compareMonth1} onChange={(e) => setCompareMonth1(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-200">
                      {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <span className="text-slate-400 font-medium">vs</span>
                    <select value={compareMonth2} onChange={(e) => setCompareMonth2(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-200">
                      {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Ciro Farkı (KDV Dahil)</p>
                    <p className={`text-xl font-bold ${comparisonData.diffRevenue >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(comparisonData.diffRevenue)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Net Kâr Farkı</p>
                    <p className={`text-xl font-bold ${comparisonData.diffProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(comparisonData.diffProfit)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Sipariş Adet Farkı</p>
                    <p className={`text-xl font-bold ${comparisonData.diffOrders >= 0 ? 'text-emerald-600' : 'text-slate-700'}`}>{formatNumber(comparisonData.diffOrders)} Sipariş</p>
                  </div>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                      <YAxis tickFormatter={(val) => val.toLocaleString('tr-TR')} tick={{ fill: '#64748b' }} />
                      <RechartsTooltip formatter={(val: number) => formatNumber(val)} cursor={{ fill: '#f8fafc' }} />
                      <Legend />
                      <Bar dataKey={compareMonth1} fill="#94a3b8" name={compareMonth1} radius={[4, 4, 0, 0]} />
                      <Bar dataKey={compareMonth2} fill="#6366f1" name={compareMonth2} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
