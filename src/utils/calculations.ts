import type {
  PurchaseOrExpense,
  RepairOrder,
  RepairPartSource,
  Sale,
  SaleItem,
} from '../types/workshop';

export interface RepairFinancials {
  warehousePartsCost: number;
  directPurchaseCost: number;
  clientPartsCount: number;
  totalPartsCost: number;
  associatedExpensesTotal: number;
  totalWorkshopCost: number;
  globalPrice: number;
  totalPaid: number;
  pendingBalance: number;
  estimatedResult: number;
}

export function calculateRepairFinancials(repair: Pick<RepairOrder, 'parts' | 'expenses' | 'globalPrice' | 'payments'>): RepairFinancials {
  let warehousePartsCost = 0;
  let directPurchaseCost = 0;
  let clientPartsCount = 0;

  for (const part of repair.parts) {
    const qty = Math.max(0, part.quantity);
    if (part.source === 'almacen') {
      warehousePartsCost += qty * Math.max(0, part.unitCost);
    } else if (part.source === 'compra_directa') {
      directPurchaseCost += qty * Math.max(0, part.unitCost);
    } else if (part.source === 'cliente') {
      clientPartsCount += qty;
    }
  }

  const associatedExpensesTotal = repair.expenses.reduce(
    (sum, exp) => sum + Math.max(0, exp.amount),
    0
  );

  const totalPartsCost = warehousePartsCost + directPurchaseCost;
  const totalWorkshopCost = totalPartsCost + associatedExpensesTotal;
  const globalPrice = Math.max(0, repair.globalPrice);

  const totalPaid = repair.payments.reduce(
    (sum, payment) => sum + Math.max(0, payment.amount),
    0
  );

  const pendingBalance = Math.max(0, globalPrice - totalPaid);
  const estimatedResult = globalPrice - totalWorkshopCost;

  return {
    warehousePartsCost,
    directPurchaseCost,
    clientPartsCount,
    totalPartsCost,
    associatedExpensesTotal,
    totalWorkshopCost,
    globalPrice,
    totalPaid,
    pendingBalance,
    estimatedResult,
  };
}

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  total: number;
  totalCost: number;
  estimatedResult: number;
  itemCount: number;
}

export function calculateCartTotals(items: SaleItem[], discount: number = 0): CartTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + Math.max(0, item.unitPrice) * Math.max(0, item.quantity),
    0
  );
  const totalCost = items.reduce(
    (sum, item) => sum + Math.max(0, item.unitCost) * Math.max(0, item.quantity),
    0
  );
  const safeDiscount = Math.min(subtotal, Math.max(0, discount));
  const total = Math.max(0, subtotal - safeDiscount);
  const estimatedResult = total - totalCost;
  const itemCount = items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);

  return {
    subtotal,
    discountAmount: safeDiscount,
    total,
    totalCost,
    estimatedResult,
    itemCount,
  };
}

export interface PeriodReportSummary {
  salesIncome: number;
  repairsIncome: number;
  totalIncome: number;
  directCosts: number;
  operatingExpenses: number;
  estimatedResult: number;
  repairsCompleted: number;
  repairsActive: number;
  salesCount: number;
}

export function calculatePeriodReport(
  sales: Sale[],
  repairs: RepairOrder[],
  transactions: PurchaseOrExpense[]
): PeriodReportSummary {
  const salesIncome = sales.reduce((sum, s) => sum + s.total, 0);
  const salesCost = sales.reduce(
    (sum, s) =>
      sum + s.items.reduce((iSum, item) => iSum + item.unitCost * item.quantity, 0),
    0
  );

  // Repairs income counted from payments received (or global price on delivered/ready)
  const repairsIncome = repairs.reduce(
    (sum, r) => sum + r.payments.reduce((pSum, p) => pSum + p.amount, 0),
    0
  );

  const repairPartsAndDirectCosts = repairs.reduce((sum, r) => {
    const fin = calculateRepairFinancials(r);
    return sum + fin.totalWorkshopCost;
  }, 0);

  const warehousePurchases = transactions
    .filter((t) => t.origin === 'compra_almacen')
    .reduce((sum, t) => sum + t.amount, 0);

  const operatingExpenses = transactions
    .filter((t) => t.origin === 'gasto_operativo')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = salesIncome + repairsIncome;
  const directCosts = salesCost + repairPartsAndDirectCosts + warehousePurchases * 0.25;
  const estimatedResult = totalIncome - directCosts - operatingExpenses;

  const repairsCompleted = repairs.filter(
    (r) => r.status === 'lista' || r.status === 'entregada'
  ).length;
  const repairsActive = repairs.filter(
    (r) => r.status !== 'lista' && r.status !== 'entregada'
  ).length;

  return {
    salesIncome,
    repairsIncome,
    totalIncome,
    directCosts,
    operatingExpenses,
    estimatedResult,
    repairsCompleted,
    repairsActive,
    salesCount: sales.length,
  };
}

export interface RepairDraftValidationInput {
  customerId: string;
  motorcycleId: string;
  reportedProblem: string;
  globalPrice: number;
}

export interface RepairValidationErrors {
  customerId?: string;
  motorcycleId?: string;
  reportedProblem?: string;
  globalPrice?: string;
}

export function validateRepairDraft(input: RepairDraftValidationInput): RepairValidationErrors {
  const errors: RepairValidationErrors = {};
  if (!input.customerId.trim()) {
    errors.customerId = 'Selecciona un cliente.';
  }
  if (!input.motorcycleId.trim()) {
    errors.motorcycleId = 'Selecciona una motocicleta.';
  }
  if (input.reportedProblem.trim().length < 5) {
    errors.reportedProblem = 'Describe el problema reportado (mínimo 5 caracteres).';
  }
  if (!Number.isFinite(input.globalPrice) || input.globalPrice <= 0) {
    errors.globalPrice = 'Ingresa un precio global mayor a 0.';
  }
  return errors;
}

export function formatCurrency(amount: number, symbol: string = '$'): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function getPartSourceLabel(source: RepairPartSource): string {
  switch (source) {
    case 'almacen':
      return 'Desde almacén';
    case 'compra_directa':
      return 'Compra para la moto';
    case 'cliente':
      return 'Aportado por cliente';
  }
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
