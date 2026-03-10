export interface SalesDataRow {
  Platform: string; // A
  SiparisTarihi: string | number; // B
  Ay: string; // C (YYYY-MM format expected ideally, or string)
  SiparisNo: string; // D
  SiparisStatusu: string; // E
  UrunKodu: string; // F
  UrunGrubu: string; // G
  UrunAciklamasi: string; // H
  UrunAdedi: number; // I
  AlisFiyati: number; // J (Toplam Maliyet)
  SiparisTutari: number; // K
  Komisyon: number; // L
  Kargo: number; // M
  IadeKargoBedeli: number; // N
  CezaBedeli: number; // O
  PlatformGideri: number; // P
  SiparisSayisi: number; // Q
}

export interface FixedExpenseRow {
  Ay: string;
  HarcananReklamBakiyesi?: number;
  AylikIsletmeGideri?: number;
}

export interface FixedExpenses {
  [month: string]: {
    marketing: number;
    operations: number;
  };
}

export interface DashboardMetrics {
  totalRevenueIncVAT: number;
  totalRevenueExVAT: number;
  totalCostOfGoods: number;
  totalGrossProfit: number;
  totalNetProfit: number;
  totalCommission: number;
  totalShipping: number; // Cargo + Return Cargo
  totalPenalty: number;
  totalPlatformExpense: number;
  totalMarketingExpense: number;
  totalOperatingExpense: number;
  returnLoss: number; // Revenue lost due to returns
  
  // Updated metric fields
  deliveredOrderCount: number;
  returnedOrderCount: number;
  deliveredProductQty: number;
  returnedProductQty: number;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}