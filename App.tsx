import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  UploadCloud, TrendingUp, TrendingDown, DollarSign, Package, 
  AlertCircle, LayoutDashboard, ShoppingBag, 
  FileText, BarChart2, ChevronDown, Wallet, CheckCircle, XCircle, LogOut, Trash2, Download, FileJson,
  Tags, RefreshCw, AlertTriangle, Search
} from 'lucide-react';
import { parseExcelFile, formatCurrency, formatNumber } from './utils/excelHelpers';
import { SalesDataRow, FixedExpenses, DashboardMetrics } from './types';
import { KpiCard } from './components/KpiCard';
import { Login } from './components/Login';
import { INITIAL_SALES_DATA, INITIAL_FIXED_EXPENSES } from './initialData';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];

// Helper to calculate metrics for a given dataset
const calculateMetrics = (data: SalesDataRow[], expenses: FixedExpenses, monthFilter: string | 'all', platformFilter: string | 'all'): DashboardMetrics => {
    let revenueIncVAT = 0;
    let costOfGoods = 0;
    let commission = 0;
    let shipping = 0;
    let penalty = 0;
    let platformExp = 0;
    let returnLoss = 0;
    
    // Split counts
    let deliveredOrderCount = 0;
    let returnedOrderCount = 0;
    let deliveredProductQty = 0;
    let returnedProductQty = 0;

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

    // Fixed Expenses logic
    let marketingExp = 0;
    let operatingExp = 0;
    
    if (monthFilter !== 'all') {
        if (expenses[monthFilter]) {
             if (platformFilter === 'all') {
                marketingExp += expenses[monthFilter].marketing;
                operatingExp += expenses[monthFilter].operations;
             }
        }
    } else {
        Object.values(expenses).forEach(exp => {
             if (platformFilter === 'all') {
                marketingExp += exp.marketing;
                operatingExp += exp.operations;
             }
        });
    }

    const revenueExVAT = revenueIncVAT / 1.2; 
    const grossProfit = revenueExVAT - costOfGoods;
    const totalVariableExpenses = commission + shipping + penalty + platformExp;
    const netProfit = grossProfit - totalVariableExpenses - marketingExp - operatingExp;

    return {
      totalRevenueIncVAT: revenueIncVAT,
      totalRevenueExVAT: revenueExVAT,
      totalCostOfGoods: costOfGoods,
      totalGrossProfit: grossProfit,
      totalNetProfit: netProfit,
      totalCommission: commission,
      totalShipping: shipping,
      totalPenalty: penalty,
      totalPlatformExpense: platformExp,
      totalMarketingExpense: marketingExp,
      totalOperatingExpense: operatingExp,
      returnLoss,
      deliveredOrderCount,
      returnedOrderCount,
      deliveredProductQty,
      returnedProductQty
    };
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [salesData, setSalesData] = useState<SalesDataRow[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenses>({});
  const [loading, setLoading] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'monthly' | 'products'>('overview');

  // Global Filter State (Mainly for Overview)
  const [globalPeriod, setGlobalPeriod] = useState<string>('all');

  // Channel Analysis Specific State
  const [channelFilter, setChannelFilter] = useState<string>('all');

  // Monthly Comparison Specific State
  const [compareMonth1, setCompareMonth1] = useState<string>('');
  const [compareMonth2, setCompareMonth2] = useState<string>('');

  // Product Analysis Specific State
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // --- PERSISTENCE LOGIC ---
    useEffect(() => {
        const storedSales = localStorage.getItem('ecommerce_sales_data');
        const storedExpenses = localStorage.getItem('ecommerce_expenses');

        if (storedSales) {
            try {
                setSalesData(JSON.parse(storedSales));
            } catch (e) {
                console.error("Failed to parse stored sales data");
                setSalesData(INITIAL_SALES_DATA);
            }
        } else {
                // Load initial seed data if nothing is in local storage
                setSalesData(INITIAL_SALES_DATA);
        }

        if (storedExpenses) {
            try {
                setFixedExpenses(JSON.parse(storedExpenses));
            } catch (e) {
                 console.error("Failed to parse stored expenses");
                 setFixedExpenses(INITIAL_FIXED_EXPENSES);
            }
        } else {
            setFixedExpenses(INITIAL_FIXED_EXPENSES);
        }
    }, []);

  // Derived Lists
  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    salesData.forEach(row => { if (row.Ay) months.add(row.Ay); });
    
    const trMonths = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];
    
    return Array.from(months).sort((a, b) => {
         const parseDate = (str: string) => {
             const lowerStr = str.toLowerCase();
             let monthIdx = -1;
             for (let i = 0; i < trMonths.length; i++) {
                 if (lowerStr.includes(trMonths[i])) {
                     monthIdx = i;
                     break;
                 }
             }
             const yearMatch = str.match(/\d{4}/);
             const year = yearMatch ? parseInt(yearMatch[0]) : 0;
             return { monthIdx, year };
         };

         const dA = parseDate(a);
         const dB = parseDate(b);

         if (dA.monthIdx !== -1 && dB.monthIdx !== -1) {
             if (dA.year !== dB.year) return dA.year - dB.year;
             return dA.monthIdx - dB.monthIdx;
         }
         return a.localeCompare(b);
    });
  }, [salesData]);

  // Set default comparison months when data loads
  useEffect(() => {
      if (uniqueMonths.length >= 2 && !compareMonth1 && !compareMonth2) {
          setCompareMonth1(uniqueMonths[uniqueMonths.length - 2]);
          setCompareMonth2(uniqueMonths[uniqueMonths.length - 1]);
      } else if (uniqueMonths.length === 1 && !compareMonth1) {
          setCompareMonth1(uniqueMonths[0]);
          setCompareMonth2(uniqueMonths[0]);
      }
  }, [uniqueMonths, compareMonth1, compareMonth2]);

  const uniquePlatforms = useMemo(() => {
    const platforms = new Set<string>();
    salesData.forEach(row => { if (row.Platform) platforms.add(row.Platform); });
    return Array.from(platforms).sort();
  }, [salesData]);

  // --- DATA PROCESSING FOR OVERVIEW ---
  const overviewData = useMemo(() => {
    return salesData.filter(row => globalPeriod === 'all' || row.Ay === globalPeriod);
  }, [salesData, globalPeriod]);

  const overviewMetrics = useMemo(() => {
    return calculateMetrics(overviewData, fixedExpenses, globalPeriod, 'all');
  }, [overviewData, fixedExpenses, globalPeriod]);

  const channelRevenueData = useMemo(() => {
      const stats: Record<string, number> = {};
      overviewData.forEach(row => {
          if (row.SiparisStatusu !== 'İade Edildi') {
              stats[row.Platform] = (stats[row.Platform] || 0) + row.SiparisTutari;
          }
      });
      return Object.entries(stats)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [overviewData]);

  const expenseBreakdownData = useMemo(() => {
      return [
        { name: 'Komisyon', value: Math.abs(overviewMetrics.totalCommission) },
        { name: 'Kargo', value: Math.abs(overviewMetrics.totalShipping) },
        { name: 'Reklam', value: overviewMetrics.totalMarketingExpense },
        { name: 'İşletme', value: overviewMetrics.totalOperatingExpense },
        { name: 'Ceza', value: Math.abs(overviewMetrics.totalPenalty) },
        { name: 'Platform', value: Math.abs(overviewMetrics.totalPlatformExpense) },
        { name: 'İade (Ciro Kaybı)', value: overviewMetrics.returnLoss }, 
      ].filter(item => item.value > 0);
  }, [overviewMetrics]);

  // --- DATA PROCESSING FOR CHANNEL ANALYSIS ---
  const channelViewMetrics = useMemo(() => {
      const filtered = salesData.filter(row => 
          (channelFilter === 'all' || row.Platform === channelFilter) &&
          (globalPeriod === 'all' || row.Ay === globalPeriod)
      );
      return calculateMetrics(filtered, fixedExpenses, globalPeriod, channelFilter);
  }, [salesData, fixedExpenses, channelFilter, globalPeriod]);

  const expenseBreakdownChannel = useMemo(() => {
      return [
          { name: 'Ürün Maliyeti (COGS)', value: channelViewMetrics.totalCostOfGoods },
          { name: 'Komisyon', value: Math.abs(channelViewMetrics.totalCommission) },
          { name: 'Kargo', value: Math.abs(channelViewMetrics.totalShipping) },
          { name: 'Platform & Ceza', value: Math.abs(channelViewMetrics.totalPlatformExpense) + Math.abs(channelViewMetrics.totalPenalty) },
      ].filter(i => i.value > 0);
  }, [channelViewMetrics]);
  
  const categoryStats = useMemo(() => {
      const filtered = salesData.filter(row => 
          (channelFilter === 'all' || row.Platform === channelFilter) &&
          (globalPeriod === 'all' || row.Ay === globalPeriod)
      );
      const stats: Record<string, { revenue: number, qty: number, products: Record<string, number> }> = {};

      filtered.forEach(row => {
          if (row.SiparisStatusu !== 'İade Edildi') {
              const group = row.UrunGrubu || 'Diğer';
              if (!stats[group]) stats[group] = { revenue: 0, qty: 0, products: {} };
              stats[group].revenue += row.SiparisTutari;
              stats[group].qty += row.UrunAdedi;

              const prodName = row.UrunAciklamasi;
              stats[group].products[prodName] = (stats[group].products[prodName] || 0) + row.UrunAdedi;
          }
      });

      return Object.entries(stats)
          .map(([name, data]) => ({
              name,
              revenue: data.revenue,
              qty: data.qty,
              topProducts: Object.entries(data.products)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([pName, pQty]) => ({ name: pName, qty: pQty }))
          }))
          .sort((a, b) => b.revenue - a.revenue);
  }, [salesData, channelFilter, globalPeriod]);

  const returnStats = useMemo(() => {
      const filtered = salesData.filter(row => 
          (channelFilter === 'all' || row.Platform === channelFilter) &&
          (globalPeriod === 'all' || row.Ay === globalPeriod)
      );
      const stats: Record<string, { qty: number, lostAmount: number }> = {};

      filtered.forEach(row => {
          if (row.SiparisStatusu === 'İade Edildi') {
               const prodName = row.UrunAciklamasi;
               if (!stats[prodName]) stats[prodName] = { qty: 0, lostAmount: 0 };
               stats[prodName].qty += (row.UrunAdedi || 1);
               stats[prodName].lostAmount += row.SiparisTutari;
          }
      });

      const arr = Object.entries(stats).map(([name, val]) => ({ name, ...val }));

      return {
          byQty: [...arr].sort((a, b) => b.qty - a.qty).slice(0, 5),
          byAmount: [...arr].sort((a, b) => b.lostAmount - a.lostAmount).slice(0, 5)
      };
  }, [salesData, channelFilter, globalPeriod]);

  const topSellingProductsChannel = useMemo(() => {
    const filtered = salesData.filter(row => 
        (channelFilter === 'all' || row.Platform === channelFilter) &&
        (globalPeriod === 'all' || row.Ay === globalPeriod)
    );
    const stats: Record<string, number> = {};

    filtered.forEach(row => {
        if (row.SiparisStatusu !== 'İade Edildi') {
             const prodName = row.UrunAciklamasi;
             stats[prodName] = (stats[prodName] || 0) + (row.UrunAdedi || 0);
        }
    });

    return Object.entries(stats)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
}, [salesData, channelFilter, globalPeriod]);


  const comparisonData = useMemo(() => {
      if (!compareMonth1 || !compareMonth2) return null;
      const m1Metrics = calculateMetrics(salesData.filter(r => r.Ay === compareMonth1), fixedExpenses, compareMonth1, 'all');
      const m2Metrics = calculateMetrics(salesData.filter(r => r.Ay === compareMonth2), fixedExpenses, compareMonth2, 'all');

      return {
          m1: m1Metrics,
          m2: m2Metrics,
          diffRevenue: m2Metrics.totalRevenueIncVAT - m1Metrics.totalRevenueIncVAT,
          diffProfit: m2Metrics.totalNetProfit - m1Metrics.totalNetProfit,
          diffOrders: (m2Metrics.deliveredOrderCount + m2Metrics.returnedOrderCount) - (m1Metrics.deliveredOrderCount + m1Metrics.returnedOrderCount),
          chartData: [
              { name: 'Ciro (TL)', [compareMonth1]: m1Metrics.totalRevenueIncVAT, [compareMonth2]: m2Metrics.totalRevenueIncVAT },
              { name: 'Net Kâr (TL)', [compareMonth1]: m1Metrics.totalNetProfit, [compareMonth2]: m2Metrics.totalNetProfit },
              { name: 'Giderler (TL)', 
                [compareMonth1]: (m1Metrics.totalRevenueIncVAT - m1Metrics.totalNetProfit), 
                [compareMonth2]: (m2Metrics.totalRevenueIncVAT - m2Metrics.totalNetProfit) 
              }
          ]
      };
  }, [salesData, fixedExpenses, compareMonth1, compareMonth2]);

  const productAnalysisData = useMemo(() => {
    let baseData = salesData.filter(row => globalPeriod === 'all' || row.Ay === globalPeriod);
    
    if (productSearchTerm.trim() !== '') {
        const lowerQuery = productSearchTerm.toLocaleLowerCase('tr-TR');
        baseData = baseData.filter(row => {
            const code = row.UrunKodu ? String(row.UrunKodu).toLocaleLowerCase('tr-TR') : '';
            const name = row.UrunAciklamasi ? row.UrunAciklamasi.toLocaleLowerCase('tr-TR') : '';
            return code.includes(lowerQuery) || name.includes(lowerQuery);
        });
    }

    return baseData;
  }, [salesData, globalPeriod, productSearchTerm]);

  const productSearchMetrics = useMemo(() => {
    let totalQty = 0;
    let totalRevenue = 0;
    let totalReturnQty = 0;

    productAnalysisData.forEach(row => {
        const isReturn = row.SiparisStatusu === 'İade Edildi';
        const qty = row.UrunAdedi || 0;
        
        if (isReturn) {
            totalReturnQty += qty;
        } else {
            totalQty += qty;
            totalRevenue += row.SiparisTutari || 0;
        }
    });

    return { totalQty, totalRevenue, totalReturnQty };
  }, [productAnalysisData]);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true);
      try {
        const { sales, expenses } = await parseExcelFile(e.target.files[0]);
        setSalesData(sales);
        setFixedExpenses(expenses);
        localStorage.setItem('ecommerce_sales_data', JSON.stringify(sales));
        localStorage.setItem('ecommerce_expenses', JSON.stringify(expenses));
      } catch (error) {
        console.error("Error parsing file", error);
        alert("Dosya okunamadı.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetData = () => {
    if (window.confirm('Tüm yüklü veriler ve geçmiş silinecek. Emin misiniz?')) {
        setSalesData(INITIAL_SALES_DATA);
        setFixedExpenses({});
        localStorage.removeItem('ecommerce_sales_data');
        localStorage.removeItem('ecommerce_expenses');
    }
  };

  const handleExportData = () => {
    const dataToExport = { sales: salesData, expenses: fixedExpenses };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eticaret-yedek-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const content = event.target?.result as string;
            const parsed = JSON.parse(content);
            if (parsed.sales && Array.isArray(parsed.sales)) {
                setSalesData(parsed.sales);
                setFixedExpenses(parsed.expenses || {});
                localStorage.setItem('ecommerce_sales_data', JSON.stringify(parsed.sales));
                localStorage.setItem('ecommerce_expenses', JSON.stringify(parsed.expenses || {}));
                alert('Yedek başarıyla yüklendi!');
            } else {
                alert('Geçersiz yedek dosyası formatı.');
            }
        } catch (err) {
            console.error(err);
            alert('Dosya okunamadı.');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isAuthenticated) {
      return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderSidebar = () => (
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-10 hidden md:flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-slate-100">
              <h1 className="text-2xl font-bold text-indigo-600">E-Ticaret Pro</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1">
              {[
                  { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
                  { id: 'channels', label: 'Kanal Analizi', icon: ShoppingBag },
                  { id: 'monthly', label: 'Karşılaştırma', icon: BarChart2 },
                  { id: 'products', label: 'Ürün Analizi', icon: FileText },
              ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === item.id 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                  </button>
              ))}
          </nav>
          
          <div className="p-4 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors w-full">
                  <UploadCloud className="w-4 h-4" />
                  <span>Yeni Dosya Yükle</span>
                  <input type="file" accept=".xlsx" onChange={handleFileUpload} className="hidden" />
              </label>

              <button 
                  onClick={handleExportData}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors w-full"
              >
                  <Download className="w-4 h-4" />
                  <span>Yedeği İndir</span>
              </button>

              <label className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors w-full">
                  <FileJson className="w-4 h-4" />
                  <span>Yedekten Yükle</span>
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>

               <button 
                onClick={handleResetData}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 w-full transition-colors"
              >
                  <Trash2 className="w-4 h-4" />
                  <span>Verileri Sıfırla</span>
              </button>
              
              <button 
                onClick={() => setIsAuthenticated(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 w-full transition-colors"
              >
                  <LogOut className="w-4 h-4" />
                  <span>Güvenli Çıkış</span>
              </button>
          </div>
      </aside>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-inter flex text-slate-800">
      {renderSidebar()}
      
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-8 py-5 flex items-center justify-between shadow-sm">
            <div>
                <h2 className="text-xl font-bold text-slate-900">
                    {activeTab === 'overview' && 'Genel Bakış'}
                    {activeTab === 'channels' && 'Kanal Analizi'}
                    {activeTab === 'monthly' && 'Karşılaştırma'}
                    {activeTab === 'products' && 'Ürün Analizi'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    {activeTab === 'overview' && 'Tüm satış kanallarınızın anlık finansal durumu.'}
                    {activeTab === 'channels' && 'Platform bazlı performans ve kârlılık analizi.'}
                    {activeTab === 'monthly' && 'Aylar arası performans farklarını inceleyin.'}
                    {activeTab === 'products' && 'Ürün bazlı satış ve iade detayları.'}
                </p>
            </div>
            
            {(activeTab === 'overview' || activeTab === 'channels' || activeTab === 'products') && (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">Dönem:</span>
                    <div className="relative">
                        <select 
                            value={globalPeriod}
                            onChange={(e) => setGlobalPeriod(e.target.value)}
                            className="appearance-none bg-white border border-slate-300 hover:border-indigo-500 text-slate-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                            <option value="all">Tüm Zamanlar</option>
                            {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            )}
        </header>

        <main className="p-8">
            
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCard 
                            title="Ciro (KDV Dahil)" 
                            value={formatCurrency(overviewMetrics.totalRevenueIncVAT)} 
                            icon={DollarSign} 
                            iconColorClass="bg-indigo-50 text-indigo-600"
                            valueColorClass="text-indigo-600"
                            subLabel="Satışlardan elde edilen toplam tutar"
                        />
                        <KpiCard 
                            title="Brüt Kar" 
                            value={formatCurrency(overviewMetrics.totalGrossProfit)} 
                            icon={TrendingUp} 
                            iconColorClass="bg-blue-50 text-blue-600"
                            valueColorClass="text-blue-600"
                            subLabel="Ciro (KDV Hariç) - Alış Maliyeti"
                        />
                         <KpiCard 
                            title="Net Kar" 
                            value={formatCurrency(overviewMetrics.totalNetProfit)} 
                            icon={Wallet} 
                            iconColorClass={overviewMetrics.totalNetProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}
                            valueColorClass={overviewMetrics.totalNetProfit >= 0 ? "text-emerald-600" : "text-red-600"}
                            subLabel="Tüm giderler düşüldükten sonra"
                        />
                        <KpiCard 
                            title="Toplam Giderler" 
                            value={formatCurrency(Math.abs(overviewMetrics.totalCommission) + Math.abs(overviewMetrics.totalShipping) + Math.abs(overviewMetrics.totalPenalty) + Math.abs(overviewMetrics.totalPlatformExpense) + overviewMetrics.totalMarketingExpense + overviewMetrics.totalOperatingExpense)} 
                            icon={TrendingDown} 
                            iconColorClass="bg-red-50 text-red-600"
                            valueColorClass="text-red-600"
                            subLabel="Komisyon, Kargo, Reklam, İşletme vb."
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                    <span className="text-slate-600">Toplam Ciro (KDV Hariç)</span>
                                    <span className="font-semibold text-slate-700">{formatNumber(overviewMetrics.totalRevenueExVAT)} TL</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-dashed border-slate-100">
                                    <span className="text-red-500">(-) Alış Maliyeti (COGS)</span>
                                    <span className="font-semibold text-red-600">{formatNumber(overviewMetrics.totalCostOfGoods)} TL</span>
                                </div>
                                <div className="flex justify-between py-3 bg-blue-50 px-3 rounded-lg my-2">
                                    <span className="text-blue-800 font-bold">BRÜT KAR</span>
                                    <span className="font-bold text-blue-800">{formatNumber(overviewMetrics.totalGrossProfit)} TL</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-dashed border-slate-100">
                                    <span className="text-red-500">(-) Operasyonel Giderler</span>
                                    <span className="font-semibold text-red-500">{formatNumber(Math.abs(overviewMetrics.totalCommission) + Math.abs(overviewMetrics.totalShipping) + Math.abs(overviewMetrics.totalPenalty) + Math.abs(overviewMetrics.totalPlatformExpense))} TL</span>
                                </div>
                                 <div className="flex justify-between py-2 border-b border-dashed border-slate-100">
                                    <span className="text-red-500">(-) Reklam Gideri</span>
                                    <span className="font-semibold text-red-500">{formatNumber(overviewMetrics.totalMarketingExpense)} TL</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-dashed border-slate-100">
                                    <span className="text-red-500">(-) İşletme Gideri</span>
                                    <span className="font-semibold text-red-500">{formatNumber(overviewMetrics.totalOperatingExpense)} TL</span>
                                </div>
                                <div className={`flex justify-between py-4 ${overviewMetrics.totalNetProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'} px-3 rounded-lg mt-4`}>
                                    <span className={`${overviewMetrics.totalNetProfit >= 0 ? 'text-emerald-800' : 'text-red-800'} font-bold`}>NET KAR</span>
                                    <span className={`font-bold ${overviewMetrics.totalNetProfit >= 0 ? 'text-emerald-800' : 'text-red-800'} text-lg`}>{formatNumber(overviewMetrics.totalNetProfit)} TL</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
                             <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <div className="p-1.5 bg-red-100 rounded text-red-600"><TrendingDown size={16}/></div>
                                Gider Dağılımı
                            </h3>
                            <div className="flex-1">
                                <ul className="space-y-3 mb-6">
                                    {expenseBreakdownData.map((item, idx) => (
                                        <li key={idx} className="flex justify-between text-sm items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                                                <span className="text-slate-600">{item.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-800">{formatNumber(item.value)} TL</span>
                                        </li>
                                    ))}
                                     <li className="flex justify-between text-sm items-center pt-3 border-t border-slate-100">
                                         <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                                            <span className="text-slate-600">Maliyet (Alış)</span>
                                         </div>
                                         <span className="font-bold text-slate-800">{formatNumber(overviewMetrics.totalCostOfGoods)} TL</span>
                                     </li>
                                </ul>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={expenseBreakdownData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {expenseBreakdownData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
                             <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 rounded text-blue-600"><BarChart2 size={16}/></div>
                                Kanal Bazlı Ciro
                            </h3>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={channelRevenueData}
                                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 11, fill: '#64748b'}} />
                                        <RechartsTooltip 
                                            cursor={{fill: '#f1f5f9'}}
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                                            formatter={(val: number) => formatCurrency(val)}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {channelRevenueData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'channels' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                 <TrendingUp size={24} />
                             </div>
                             <h3 className="text-lg font-bold text-slate-900">Kanal Analizi & Kârlılık</h3>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">Kanal Seçimi:</span>
                            <div className="relative">
                                <select 
                                    value={channelFilter}
                                    onChange={(e) => setChannelFilter(e.target.value)}
                                    className="appearance-none bg-white border border-slate-300 hover:border-indigo-500 text-slate-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-[150px]"
                                >
                                    <option value="all">Tüm Kanallar</option>
                                    {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <KpiCard 
                            title="Toplam Ciro (Gelir)" 
                            value={formatCurrency(channelViewMetrics.totalRevenueIncVAT)} 
                            icon={DollarSign} 
                            iconColorClass="bg-gray-50 text-gray-300"
                            valueColorClass="text-indigo-600"
                            subLabel="KDV Dahil Satış Tutarı"
                        />
                        <KpiCard 
                            title="Toplam Gider" 
                            value={formatCurrency(Math.abs(channelViewMetrics.totalCommission) + Math.abs(channelViewMetrics.totalShipping) + channelViewMetrics.totalCostOfGoods)} 
                            icon={TrendingDown} 
                            iconColorClass="bg-gray-50 text-gray-300"
                            valueColorClass="text-red-600"
                            subLabel="Maliyet + Komisyon + Kargo"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
                             <div className="p-3 bg-purple-50 text-purple-600 rounded-xl mt-1"><Package size={24} /></div>
                             <div className="flex-1">
                                 <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">SİPARİŞ SAYISI</p>
                                 <p className="text-2xl font-bold text-slate-800 mb-2">{formatNumber(channelViewMetrics.deliveredOrderCount + channelViewMetrics.returnedOrderCount)}</p>
                                 <div className="flex flex-col text-xs space-y-1">
                                     <span className="text-emerald-600 font-medium flex items-center gap-1">
                                        <CheckCircle size={12}/> Teslim: {formatNumber(channelViewMetrics.deliveredOrderCount)}
                                     </span>
                                     <span className="text-red-500 font-medium flex items-center gap-1">
                                        <XCircle size={12}/> İade: {formatNumber(channelViewMetrics.returnedOrderCount)}
                                     </span>
                                 </div>
                             </div>
                         </div>
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
                             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mt-1"><Package size={24} /></div>
                             <div className="flex-1">
                                 <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">SATILAN ÜRÜN</p>
                                 <p className="text-2xl font-bold text-slate-800 mb-2">{formatNumber(channelViewMetrics.deliveredProductQty + channelViewMetrics.returnedProductQty)} Adet</p>
                                  <div className="flex flex-col text-xs space-y-1">
                                     <span className="text-emerald-600 font-medium flex items-center gap-1">
                                        <CheckCircle size={12}/> Teslim: {formatNumber(channelViewMetrics.deliveredProductQty)}
                                     </span>
                                     <span className="text-red-500 font-medium flex items-center gap-1">
                                        <XCircle size={12}/> İade: {formatNumber(channelViewMetrics.returnedProductQty)}
                                     </span>
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
                                        <th className="px-6 py-3 text-left font-medium text-slate-500">Ürün Grubu (Kategori)</th>
                                        <th className="px-6 py-3 text-right font-medium text-slate-500">Satılan Adet</th>
                                        <th className="px-6 py-3 text-right font-medium text-slate-500">Toplam Ciro</th>
                                        <th className="px-6 py-3 text-right font-medium text-slate-500">Ciro Payı</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {categoryStats.map((cat, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-slate-700">{cat.name}</td>
                                            <td className="px-6 py-3 text-right text-slate-600">{formatNumber(cat.qty)}</td>
                                            <td className="px-6 py-3 text-right font-bold text-slate-800">{formatCurrency(cat.revenue)}</td>
                                            <td className="px-6 py-3 text-right text-slate-500">
                                                %{channelViewMetrics.totalRevenueIncVAT > 0 ? ((cat.revenue / channelViewMetrics.totalRevenueIncVAT) * 100).toFixed(1) : 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'monthly' && comparisonData && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <h3 className="text-lg font-bold text-slate-900">Aylık Karşılaştırma</h3>
                            <div className="flex items-center gap-3">
                                <select 
                                    value={compareMonth1}
                                    onChange={(e) => setCompareMonth1(e.target.value)}
                                    className="bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-200"
                                >
                                    {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <span className="text-slate-400 font-medium">vs</span>
                                <select 
                                    value={compareMonth2}
                                    onChange={(e) => setCompareMonth2(e.target.value)}
                                    className="bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-200"
                                >
                                    {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">Ciro Farkı (KDV Dahil)</p>
                                <p className={`text-xl font-bold ${comparisonData.diffRevenue >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(comparisonData.diffRevenue)}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">Net Kâr Farkı</p>
                                <p className={`text-xl font-bold ${comparisonData.diffProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(comparisonData.diffProfit)}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">Sipariş Adet Farkı</p>
                                <p className={`text-xl font-bold ${comparisonData.diffOrders >= 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                    {formatNumber(comparisonData.diffOrders)} Sipariş
                                </p>
                            </div>
                        </div>

                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{fill: '#64748b'}} />
                                    <YAxis tickFormatter={(val) => val.toLocaleString('tr-TR')} tick={{fill: '#64748b'}} />
                                    <RechartsTooltip 
                                         formatter={(val: number) => formatNumber(val)}
                                         cursor={{fill: '#f8fafc'}}
                                    />
                                    <Legend />
                                    <Bar dataKey={compareMonth1} fill="#94a3b8" name={compareMonth1} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey={compareMonth2} fill="#6366f1" name={compareMonth2} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
             
            {activeTab === 'products' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Search size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Ürün Ara</h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">
                                Stok kodu veya ürün adı ile arama yapın.
                            </p>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    type="text" 
                                    placeholder="SKU veya Ürün Adı..." 
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Bulunan Toplam Satış</p>
                                    <h3 className="text-2xl font-bold text-indigo-600">{formatNumber(productSearchMetrics.totalQty)} Adet</h3>
                                </div>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Package size={24} />
                                </div>
                             </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Bulunan Toplam Ciro</p>
                                    <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(productSearchMetrics.totalRevenue)}</h3>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <DollarSign size={24} />
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                       <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                           <h3 className="font-bold text-slate-800">
                               {productSearchTerm ? 'Arama Sonuçları' : 'Son Satışlar'}
                           </h3>
                           <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                               {productAnalysisData.length} Kayıt
                           </span>
                       </div>
                       <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-medium text-slate-500">Tarih</th>
                                        <th className="px-6 py-3 text-left font-medium text-slate-500">Ürün Adı</th>
                                        <th className="px-6 py-3 text-left font-medium text-slate-500">Stok Kodu</th>
                                        <th className="px-6 py-3 text-left font-medium text-slate-500">Kanal</th>
                                        <th className="px-6 py-3 text-right font-medium text-slate-500">Adet</th>
                                        <th className="px-6 py-3 text-right font-medium text-slate-500">Tutar</th>
                                        <th className="px-6 py-3 text-right font-medium text-slate-500">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {productAnalysisData.slice(0, 50).map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 text-slate-600">{row.Ay}</td>
                                            <td className="px-6 py-3 text-slate-700 font-medium max-w-[300px] truncate" title={row.UrunAciklamasi}>{row.UrunAciklamasi}</td>
                                            <td className="px-6 py-3 text-slate-500 font-mono text-xs">{row.UrunKodu}</td>
                                            <td className="px-6 py-3">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200">
                                                    {row.Platform}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-bold text-slate-800">{row.UrunAdedi}</td>
                                            <td className="px-6 py-3 text-right font-medium text-slate-600">{formatCurrency(row.SiparisTutari)}</td>
                                            <td className="px-6 py-3 text-right">
                                                {row.SiparisStatusu === 'İade Edildi' ? (
                                                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium">İade</span>
                                                ) : (
                                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-medium">Satış</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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