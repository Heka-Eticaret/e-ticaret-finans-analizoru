import { SalesDataRow, FixedExpenses } from './types';
import rawData from './eticaret-verileri.json';

export const INITIAL_SALES_DATA: SalesDataRow[] = rawData.sales as SalesDataRow[];
export const INITIAL_EXPENSES: FixedExpenses = rawData.expenses as FixedExpenses; 