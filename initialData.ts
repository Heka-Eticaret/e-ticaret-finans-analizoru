import { SalesDataRow, FixedExpenses } from './types';
import raw from './eticaret.json';
export const INITIAL_SALES_DATA: SalesDataRow[] = (raw.sales as SalesDataRow[]);

export const INITIAL_FIXED_EXPENSES: FixedExpenses = {
	"2025 OCAK": { marketing: 25000, operations: 150000 },
	"2025 Şubat": { marketing: 17250, operations: 150000 },
	"2025 Mart": { marketing: 15500, operations: 150000 },
	"2025 Nisan": { marketing: 37837, operations: 150000 },
	"2025 Mayıs": { marketing: 41393, operations: 150000 },
	"2025 Haziran": { marketing: 22273, operations: 150000 },
	"2025 Temmuz": { marketing: 39123, operations: 150000 },
	"2025 Ağustos": { marketing: 69211.03, operations: 150000 },
	"2025 Eylül": { marketing: 42044.48, operations: 150000 },
	"2025 Ekim": { marketing: 62301, operations: 150000 },
	"2025 Kasım": { marketing: 69110.73, operations: 150000 },
	"2025 Aralık": { marketing: 63352.55, operations: 150000 }
};