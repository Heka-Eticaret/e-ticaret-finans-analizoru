import * as XLSX from 'xlsx';
import { SalesDataRow, FixedExpenseRow, FixedExpenses } from '../types';

export const parseExcelFile = (file: File): Promise<{ sales: SalesDataRow[], expenses: FixedExpenses }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Parse Sheet 1: Sales Data
        const sheet1Name = workbook.SheetNames[0];
        const sheet1 = workbook.Sheets[sheet1Name];
        
        // Custom mapping to ensure column headers match our interface keys
        // Assuming the user's excel structure is strictly as described
        // We use sheet_to_json with 'header: A' to map by column letters
        const rawSales = XLSX.utils.sheet_to_json<any>(sheet1, { header: "A", range: 1 }); // Skip header row
        
        const salesData: SalesDataRow[] = rawSales.map(row => ({
          Platform: row['A'] || 'Diğer',
          SiparisTarihi: row['B'],
          Ay: row['C'] ? String(row['C']).trim() : '',
          SiparisNo: row['D'],
          SiparisStatusu: row['E'],
          UrunKodu: row['F'],
          UrunGrubu: row['G'] || 'Genel',
          UrunAciklamasi: row['H'],
          UrunAdedi: Number(row['I']) || 0,
          AlisFiyati: Number(row['J']) || 0,
          SiparisTutari: Number(row['K']) || 0,
          Komisyon: Number(row['L']) || 0,
          Kargo: Number(row['M']) || 0,
          IadeKargoBedeli: Number(row['N']) || 0,
          CezaBedeli: Number(row['O']) || 0,
          PlatformGideri: Number(row['P']) || 0,
          SiparisSayisi: Number(row['Q']) || 0,
        }));

        // Parse Sheet 2: Expenses
        const fixedExpenses: FixedExpenses = {};
        
        if (workbook.SheetNames.length > 1) {
          const sheet2Name = workbook.SheetNames[1];
          const sheet2 = workbook.Sheets[sheet2Name];
          const rawExpenses = XLSX.utils.sheet_to_json<any>(sheet2, { header: "A", range: 1 });

          rawExpenses.forEach(row => {
            // Ads are in A (Month) and B (Amount)
            const adMonth = row['A'] ? String(row['A']).trim() : null;
            const adAmount = Number(row['B']) || 0;

            // Ops are in E (Month) and F (Amount)
            const opMonth = row['E'] ? String(row['E']).trim() : null;
            const opAmount = Number(row['F']) || 0;

            if (adMonth) {
              if (!fixedExpenses[adMonth]) fixedExpenses[adMonth] = { marketing: 0, operations: 0 };
              fixedExpenses[adMonth].marketing += adAmount;
            }

            if (opMonth) {
              if (!fixedExpenses[opMonth]) fixedExpenses[opMonth] = { marketing: 0, operations: 0 };
              fixedExpenses[opMonth].operations += opAmount;
            }
          });
        }

        resolve({ sales: salesData, expenses: fixedExpenses });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
};

export const formatNumber = (val: number) => {
  return new Intl.NumberFormat('tr-TR').format(val);
};