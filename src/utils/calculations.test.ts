import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRepairFinancials,
  calculateCartTotals,
  calculatePeriodReport,
  validateRepairDraft,
  formatCurrency,
} from './calculations';
import type { PurchaseOrExpense, RepairOrder, Sale } from '../types/workshop';

test('calculateRepairFinancials computes 3 part sources, expenses, payments and estimated result', () => {
  const result = calculateRepairFinancials({
    parts: [
      { id: 'p1', source: 'almacen', name: 'Aceite 10W-50', quantity: 2, unitCost: 18, unitPrice: 28 },
      { id: 'p2', source: 'compra_directa', name: 'Retén horquilla', quantity: 1, unitCost: 34, unitPrice: 45 },
      { id: 'p3', source: 'cliente', name: 'Pastillas traídas por cliente', quantity: 1, unitCost: 0, unitPrice: 0 },
    ],
    expenses: [
      { id: 'e1', description: 'Rectificado externo', amount: 25, category: 'Terceros', date: '2026-11-18' },
    ],
    globalPrice: 220,
    payments: [
      { id: 'pay1', amount: 100, method: 'efectivo', date: '2026-11-18' },
      { id: 'pay2', amount: 50, method: 'yape_plin', date: '2026-11-19' },
    ],
  });

  assert.equal(result.warehousePartsCost, 36);
  assert.equal(result.directPurchaseCost, 34);
  assert.equal(result.clientPartsCount, 1);
  assert.equal(result.associatedExpensesTotal, 25);
  assert.equal(result.totalWorkshopCost, 95);
  assert.equal(result.totalPaid, 150);
  assert.equal(result.pendingBalance, 70);
  assert.equal(result.estimatedResult, 125);
});

test('calculateCartTotals clamps discount to subtotal and computes estimated result', () => {
  const totals = calculateCartTotals(
    [
      { productId: '1', sku: 'SKU-1', name: 'Filtro', quantity: 2, unitPrice: 25, unitCost: 12 },
      { productId: '2', sku: 'SKU-2', name: 'Bujía', quantity: 1, unitPrice: 15, unitCost: 8 },
    ],
    10
  );

  assert.equal(totals.subtotal, 65);
  assert.equal(totals.discountAmount, 10);
  assert.equal(totals.total, 55);
  assert.equal(totals.totalCost, 32);
  assert.equal(totals.estimatedResult, 23);
  assert.equal(totals.itemCount, 3);

  const clamped = calculateCartTotals(
    [{ productId: '1', sku: 'SKU-1', name: 'Filtro', quantity: 1, unitPrice: 20, unitCost: 10 }],
    99
  );
  assert.equal(clamped.discountAmount, 20);
  assert.equal(clamped.total, 0);
});

test('validateRepairDraft rejects missing customer, motorcycle, short problem, or zero price', () => {
  const invalid = validateRepairDraft({
    customerId: '',
    motorcycleId: '',
    reportedProblem: 'abc',
    globalPrice: 0,
  });
  assert.ok(invalid.customerId);
  assert.ok(invalid.motorcycleId);
  assert.ok(invalid.reportedProblem);
  assert.ok(invalid.globalPrice);

  const valid = validateRepairDraft({
    customerId: 'c1',
    motorcycleId: 'm1',
    reportedProblem: 'Ruido metálico en cadena de distribución',
    globalPrice: 180,
  });
  assert.deepEqual(valid, {});
});

test('calculatePeriodReport computes totalIncome, operatingExpenses and estimatedResult', () => {
  const sales: Sale[] = [
    {
      id: 's1',
      code: 'V-001',
      date: '2026-11-20',
      customerName: 'Cliente Mostrador',
      items: [{ productId: 'p1', sku: 'A1', name: 'Aceite', quantity: 2, unitPrice: 30, unitCost: 15 }],
      discount: 0,
      total: 60,
      paymentMethod: 'efectivo',
      sellerName: 'Carlos',
    },
  ];
  const repairs: RepairOrder[] = [
    {
      id: 'r1',
      code: 'ZR-100',
      customerId: 'c1',
      motorcycleId: 'm1',
      reportedProblem: 'Frenos',
      diagnosisNotes: '',
      status: 'lista',
      mechanicName: 'Luis',
      mileageAtEntry: 12000,
      parts: [{ id: 'rp1', source: 'almacen', name: 'Pastillas', quantity: 1, unitCost: 20, unitPrice: 40 }],
      expenses: [],
      globalPrice: 100,
      payments: [{ id: 'p1', amount: 100, method: 'tarjeta', date: '2026-11-20' }],
      createdAt: '2026-11-19',
      estimatedDelivery: '2026-11-20',
      updatedAt: '2026-11-20',
    },
  ];
  const transactions: PurchaseOrExpense[] = [
    {
      id: 't1',
      code: 'G-01',
      origin: 'gasto_operativo',
      category: 'Servicios básicos',
      description: 'Luz taller',
      supplierOrPayee: 'Enel',
      amount: 40,
      date: '2026-11-20',
      paymentMethod: 'transferencia',
    },
  ];

  const report = calculatePeriodReport(sales, repairs, transactions);
  assert.equal(report.salesIncome, 60);
  assert.equal(report.repairsIncome, 100);
  assert.equal(report.totalIncome, 160);
  assert.equal(report.operatingExpenses, 40);
  assert.equal(report.directCosts, 50); // 30 sales cost + 20 repair cost
  assert.equal(report.estimatedResult, 70);
  assert.equal(report.repairsCompleted, 1);
  assert.equal(report.repairsActive, 0);
});

test('formatCurrency formats positive and negative numbers cleanly', () => {
  assert.equal(formatCurrency(1250.5, '$'), '$1,250.50');
  assert.equal(formatCurrency(-45, 'S/'), '-S/45.00');
});
