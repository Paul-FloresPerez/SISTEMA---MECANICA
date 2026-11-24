'use client';

import React, { useMemo, useState } from 'react';
import { PackagePlus, Receipt, Search, ShoppingBag } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { formatCurrency, formatShortDate, getTodayIso } from '../utils/calculations';
import {
  getPaymentMethodLabel,
  TransactionOriginText,
} from '../components/common/StatusDisplay';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import type {
  ExpenseCategory,
  PaymentMethod,
  PurchaseOrExpense,
  TransactionOrigin,
} from '../types/workshop';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Repuestos e insumos',
  'Compra directa taller',
  'Servicios básicos',
  'Alquiler',
  'Herramientas',
  'Nómina y técnicos',
  'Otros operativos',
];

export const PurchasesExpensesPage: React.FC = () => {
  const { transactions, products, repairs, settings, addTransaction } = useWorkshop();
  const sym = settings.currencySymbol;

  const [originFilter, setOriginFilter] = useState<'todos' | TransactionOrigin>('todos');
  const [categoryFilter, setCategoryFilter] = useState<'Todas' | ExpenseCategory>('Todas');
  const [dateFrom, setDateFrom] = useState('');
  const [search, setSearch] = useState('');

  const [detailTx, setDetailTx] = useState<PurchaseOrExpense | null>(null);
  const [modalMode, setModalMode] = useState<'compra' | 'gasto' | null>(null);

  // Form states
  const [purchaseOrigin, setPurchaseOrigin] = useState<'compra_almacen' | 'compra_reparacion'>(
    'compra_almacen'
  );
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<ExpenseCategory>('Repuestos e insumos');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [relatedProductId, setRelatedProductId] = useState(products[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [relatedRepairId, setRelatedRepairId] = useState(repairs[0]?.id ?? '');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (originFilter !== 'todos' && t.origin !== originFilter) return false;
      if (categoryFilter !== 'Todas' && t.category !== categoryFilter) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (!q) return true;
      return (
        t.code.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.supplierOrPayee.toLowerCase().includes(q)
      );
    });
  }, [transactions, originFilter, categoryFilter, dateFrom, search]);

  const totalsByOrigin = useMemo(() => {
    return {
      almacen: transactions
        .filter((t) => t.origin === 'compra_almacen')
        .reduce((s, t) => s + t.amount, 0),
      reparacion: transactions
        .filter((t) => t.origin === 'compra_reparacion')
        .reduce((s, t) => s + t.amount, 0),
      operativo: transactions
        .filter((t) => t.origin === 'gasto_operativo')
        .reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions]);

  const openModal = (mode: 'compra' | 'gasto') => {
    setDescription('');
    setSupplier('');
    setAmount(0);
    setNotes('');
    if (mode === 'compra') {
      setPurchaseOrigin('compra_almacen');
      setCategory('Repuestos e insumos');
    } else {
      setCategory('Servicios básicos');
    }
    setModalMode(mode);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    const isExpense = modalMode === 'gasto';
    const origin: TransactionOrigin = isExpense ? 'gasto_operativo' : purchaseOrigin;
    const linkedRepair = repairs.find((r) => r.id === relatedRepairId);

    addTransaction({
      origin,
      category: isExpense
        ? category
        : origin === 'compra_almacen'
        ? 'Repuestos e insumos'
        : 'Compra directa taller',
      description: description.trim(),
      supplierOrPayee: supplier.trim() || 'Proveedor general',
      amount,
      date: getTodayIso(),
      paymentMethod,
      relatedProductId: origin === 'compra_almacen' ? relatedProductId : undefined,
      quantity: origin === 'compra_almacen' ? quantity : undefined,
      relatedRepairId: origin === 'compra_reparacion' ? linkedRepair?.id : undefined,
      relatedRepairCode: origin === 'compra_reparacion' ? linkedRepair?.code : undefined,
      notes: notes.trim() || undefined,
    });
    setModalMode(null);
  };

  return (
    <div className="space-y-5">
      {/* Differentiated Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-sky-700 dark:text-sky-400 font-semibold">
            <span>Compras para almacén</span>
            <PackagePlus className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="font-mono-num text-xl font-bold text-slate-900 dark:text-white mt-1.5">
            {formatCurrency(totalsByOrigin.almacen, sym)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Reposición de stock inventariable
          </p>
        </div>

        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-semibold">
            <span>Compras para reparaciones</span>
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="font-mono-num text-xl font-bold text-slate-900 dark:text-white mt-1.5">
            {formatCurrency(totalsByOrigin.reparacion, sym)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Repuestos puntuales por orden
          </p>
        </div>

        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 font-semibold">
            <span>Gastos operativos</span>
            <Receipt className="w-4 h-4" aria-hidden="true" />
          </div>
          <p className="font-mono-num text-xl font-bold text-slate-900 dark:text-white mt-1.5">
            {formatCurrency(totalsByOrigin.operativo, sym)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Alquiler, servicios, herramientas
          </p>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <label htmlFor="tx-search" className="sr-only">
              Buscar compra o gasto
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="tx-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar concepto o proveedor..."
              className="pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg"
            />
          </div>

          <label htmlFor="tx-cat-filter" className="sr-only">
            Filtrar por categoría
          </label>
          <select
            id="tx-cat-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'Todas' | ExpenseCategory)}
            className="px-3 py-2 text-xs bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            <option value="Todas">Todas las categorías</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label htmlFor="tx-date-filter" className="sr-only">
            Desde fecha
          </label>
          <input
            id="tx-date-filter"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openModal('compra')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 rounded-lg whitespace-nowrap"
          >
            <PackagePlus className="w-3.5 h-3.5" aria-hidden="true" />
            Nueva compra
          </button>
          <button
            type="button"
            onClick={() => openModal('gasto')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg whitespace-nowrap"
          >
            <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
            Nuevo gasto
          </button>
        </div>
      </div>

      {/* Origin Segmented Filter */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex items-center gap-1 p-1 bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg">
          {(
            [
              { id: 'todos', label: 'Todos los movimientos' },
              { id: 'compra_almacen', label: 'Compra para almacén' },
              { id: 'compra_reparacion', label: 'Compra para reparación' },
              { id: 'gasto_operativo', label: 'Gasto operativo' },
            ] as { id: 'todos' | TransactionOrigin; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOriginFilter(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                originFilter === t.id
                  ? 'bg-slate-900 text-white dark:bg-rose-600'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin movimientos en este rango"
          description="Ajusta las fechas o registra una nueva compra o gasto operativo."
        />
      ) : (
        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0F141C] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Código</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descripción y proveedor</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-5 font-mono-num font-bold text-rose-600 dark:text-rose-400">
                      <button
                        type="button"
                        onClick={() => setDetailTx(tx)}
                        className="hover:underline"
                      >
                        {tx.code}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <TransactionOriginText origin={tx.origin} />
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {tx.supplierOrPayee}
                        {tx.relatedRepairCode ? ` · Orden ${tx.relatedRepairCode}` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {tx.category}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatShortDate(tx.date)}
                    </td>
                    <td className="py-3 px-5 text-right font-mono-num font-bold text-slate-900 dark:text-white">
                      {formatCurrency(tx.amount, sym)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((tx) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => setDetailTx(tx)}
                className="w-full text-left p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <TransactionOriginText origin={tx.origin} />
                  <span className="font-mono-num text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurrency(tx.amount, sym)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {tx.description}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {tx.code} · {tx.supplierOrPayee} · {formatShortDate(tx.date)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal Nueva Compra / Nuevo Gasto */}
      <Modal
        open={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={modalMode === 'compra' ? 'Registrar nueva compra' : 'Registrar gasto operativo'}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {modalMode === 'compra' && (
            <div>
              <span className="block text-xs font-semibold mb-1.5">Destino de la compra</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPurchaseOrigin('compra_almacen')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border ${
                    purchaseOrigin === 'compra_almacen'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-rose-600 dark:border-rose-600'
                      : 'bg-slate-50 dark:bg-[#0F141C] border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Para almacén
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseOrigin('compra_reparacion')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border ${
                    purchaseOrigin === 'compra_reparacion'
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-rose-600 dark:border-rose-600'
                      : 'bg-slate-50 dark:bg-[#0F141C] border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Para reparación
                </button>
              </div>
            </div>
          )}

          {modalMode === 'compra' && purchaseOrigin === 'compra_almacen' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label htmlFor="tx-prod" className="block text-xs font-semibold mb-1">
                  Producto a reponer
                </label>
                <select
                  id="tx-prod"
                  value={relatedProductId}
                  onChange={(e) => setRelatedProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="tx-qty" className="block text-xs font-semibold mb-1">
                  Cantidad
                </label>
                <input
                  id="tx-qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>
          )}

          {modalMode === 'compra' && purchaseOrigin === 'compra_reparacion' && (
            <div>
              <label htmlFor="tx-rep" className="block text-xs font-semibold mb-1">
                Vincular a orden de reparación
              </label>
              <select
                id="tx-rep"
                value={relatedRepairId}
                onChange={(e) => setRelatedRepairId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                {repairs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} — {r.reportedProblem.slice(0, 45)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {modalMode === 'gasto' && (
            <div>
              <label htmlFor="tx-cat" className="block text-xs font-semibold mb-1">
                Categoría del gasto
              </label>
              <select
                id="tx-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                {EXPENSE_CATEGORIES.filter(
                  (c) => c !== 'Repuestos e insumos' && c !== 'Compra directa taller'
                ).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="tx-desc" className="block text-xs font-semibold mb-1">
              Descripción
            </label>
            <input
              id="tx-desc"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                modalMode === 'compra'
                  ? 'Ej. Compra 12 litros de aceite 10W-50'
                  : 'Ej. Recibo de luz y compresor taller'
              }
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="tx-sup" className="block text-xs font-semibold mb-1">
                Proveedor / Beneficiario
              </label>
              <input
                id="tx-sup"
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Nombre de tienda o empresa"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="tx-amt" className="block text-xs font-semibold mb-1">
                Monto ({sym})
              </label>
              <input
                id="tx-amt"
                type="number"
                min={1}
                step="0.5"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num font-bold bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-method" className="block text-xs font-semibold mb-1">
                Método de pago
              </label>
              <select
                id="tx-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="efectivo">Efectivo</option>
                <option value="yape_plin">Yape / Plin</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            <div>
              <label htmlFor="tx-notes" className="block text-xs font-semibold mb-1">
                Notas (opcional)
              </label>
              <input
                id="tx-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Factura o referencia"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              Guardar registro
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={Boolean(detailTx)}
        onClose={() => setDetailTx(null)}
        title={`Detalle de movimiento · ${detailTx?.code ?? ''}`}
      >
        {detailTx && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tipo</span>
              <TransactionOriginText origin={detailTx.origin} />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha</span>
              <span>{formatShortDate(detailTx.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Categoría</span>
              <span className="font-medium">{detailTx.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Proveedor / Beneficiario</span>
              <span className="font-semibold">{detailTx.supplierOrPayee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Método de pago</span>
              <span>{getPaymentMethodLabel(detailTx.paymentMethod)}</span>
            </div>
            {detailTx.relatedRepairCode && (
              <div className="flex justify-between">
                <span className="text-slate-500">Reparación asociada</span>
                <span className="font-mono-num font-bold text-rose-600">
                  {detailTx.relatedRepairCode}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 block mb-1">Concepto</span>
              <p className="text-slate-800 dark:text-slate-200 font-medium">
                {detailTx.description}
              </p>
              {detailTx.notes && (
                <p className="text-slate-500 mt-1">{detailTx.notes}</p>
              )}
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Monto total</span>
              <span className="font-mono-num">{formatCurrency(detailTx.amount, sym)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
