'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  Edit3,
  Plus,
  User,
  Bike,
  Printer,
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  calculateRepairFinancials,
  formatCurrency,
  formatShortDate,
  getPartSourceLabel,
} from '../utils/calculations';
import {
  getPaymentMethodLabel,
  REPAIR_STATUS_OPTIONS,
  RepairStatusText,
} from '../components/common/StatusDisplay';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import type { PaymentMethod, RepairPartSource, RepairStatus } from '../types/workshop';

export const RepairDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    repairs,
    customers,
    motorcycles,
    products,
    settings,
    updateRepair,
    updateRepairStatus,
    addRepairPayment,
    notify,
  } = useWorkshop();

  const repair = repairs.find((r) => r.id === id);
  const sym = settings.currencySymbol;

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('yape_plin');
  const [payNote, setPayNote] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editProblem, setEditProblem] = useState('');
  const [editDiagnosis, setEditDiagnosis] = useState('');
  const [editGlobalPrice, setEditGlobalPrice] = useState(0);
  const [editMechanic, setEditMechanic] = useState('');

  const [addPartModalOpen, setAddPartModalOpen] = useState(false);
  const [partSource, setPartSource] = useState<RepairPartSource>('almacen');
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id ?? '');
  const [customPartName, setCustomPartName] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partCost, setPartCost] = useState(0);

  const financials = useMemo(
    () => (repair ? calculateRepairFinancials(repair) : null),
    [repair]
  );

  if (!repair || !financials) {
    return (
      <EmptyState
        title="Orden de reparación no encontrada"
        description="El código solicitado no existe en el listado de órdenes locales."
        actionLabel="Volver al listado"
        onAction={() => router.push('/reparaciones')}
      />
    );
  }

  const customer = customers.find((c) => c.id === repair.customerId);
  const moto = motorcycles.find((m) => m.id === repair.motorcycleId);

  const openPaymentModal = () => {
    setPayAmount(financials.pendingBalance > 0 ? financials.pendingBalance : 50);
    setPayNote('');
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;
    addRepairPayment(repair.id, {
      amount: payAmount,
      method: payMethod,
      date: new Date().toISOString().slice(0, 10),
      note: payNote.trim() || 'Abono en taller',
    });
    setPaymentModalOpen(false);
  };

  const openEditModal = () => {
    setEditProblem(repair.reportedProblem);
    setEditDiagnosis(repair.diagnosisNotes);
    setEditGlobalPrice(repair.globalPrice);
    setEditMechanic(repair.mechanicName);
    setEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRepair(repair.id, {
      reportedProblem: editProblem.trim() || repair.reportedProblem,
      diagnosisNotes: editDiagnosis.trim(),
      globalPrice: Math.max(1, editGlobalPrice),
      mechanicName: editMechanic,
    });
    setEditModalOpen(false);
  };

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (partSource === 'almacen') {
      const prod = products.find((p) => p.id === selectedProdId);
      if (!prod) return;
      updateRepair(repair.id, {
        parts: [
          ...repair.parts,
          {
            id: `rp-${Date.now()}`,
            source: 'almacen',
            productId: prod.id,
            name: prod.name,
            quantity: Math.max(1, partQty),
            unitCost: prod.costPrice,
            unitPrice: prod.salePrice,
          },
        ],
      });
    } else if (customPartName.trim()) {
      updateRepair(repair.id, {
        parts: [
          ...repair.parts,
          {
            id: `rp-${Date.now()}`,
            source: partSource,
            name: customPartName.trim(),
            quantity: Math.max(1, partQty),
            unitCost: partSource === 'cliente' ? 0 : Math.max(0, partCost),
            unitPrice: partSource === 'cliente' ? 0 : Math.max(0, partCost * 1.3),
          },
        ],
      });
    }
    setCustomPartName('');
    setPartCost(0);
    setPartQty(1);
    setAddPartModalOpen(false);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Back & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/reparaciones')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Reparaciones
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="font-mono-num text-sm font-bold text-slate-900 dark:text-white">
            {repair.code}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="detail-status-select" className="sr-only">
            Cambiar estado de la reparación
          </label>
          <select
            id="detail-status-select"
            value={repair.status}
            onChange={(e) => updateRepairStatus(repair.id, e.target.value as RepairStatus)}
            className="px-3 py-2 text-xs font-semibold bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            {REPAIR_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Estado: {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
            Editar
          </button>

          <button
            type="button"
            onClick={() =>
              notify(
                'Comprobante en modo demostración',
                `Vista previa de impresión para la orden ${repair.code} (requiere backend para PDF oficial).`,
                'info'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            Imprimir orden
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 space-y-5">
          {/* Client & Moto Card */}
          <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <RepairStatusText status={repair.status} />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Ingreso {formatShortDate(repair.createdAt)} · Entrega est. {formatShortDate(repair.estimatedDelivery)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                  <User className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Cliente
                  </p>
                  {customer ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/clientes/${customer.id}`)}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-rose-600 text-left"
                    >
                      {customer.name}
                    </button>
                  ) : (
                    <p className="text-sm font-bold">Cliente</p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {customer?.phone} · Doc. {customer?.documentId}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                  <Bike className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Motocicleta
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {moto ? `${moto.brand} ${moto.model} (${moto.year})` : 'Motocicleta'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                    Placa {moto?.plate} · {repair.mileageAtEntry.toLocaleString('es-ES')} km
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Problema reportado
                </span>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {repair.reportedProblem}
                </p>
              </div>
              {repair.diagnosisNotes && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Diagnóstico y notas de taller (Mec. {repair.mechanicName})
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {repair.diagnosisNotes}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Parts Used */}
          <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Repuestos utilizados ({repair.parts.length})
              </h2>
              <button
                type="button"
                onClick={() => setAddPartModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Añadir repuesto
              </button>
            </div>

            {repair.parts.length === 0 ? (
              <p className="p-5 text-xs text-slate-500 dark:text-slate-400">
                No se han registrado repuestos en esta orden.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {repair.parts.map((part) => (
                  <li key={part.id} className="px-5 py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {part.quantity}x {part.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {getPartSourceLabel(part.source)}
                        {part.supplier ? ` · Proveedor: ${part.supplier}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono-num font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(part.unitCost * part.quantity, sym)}
                      </p>
                      <p className="text-[11px] text-slate-400">Costo taller</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Associated Expenses */}
          <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Gastos asociados ({repair.expenses.length})
              </h2>
            </div>
            {repair.expenses.length === 0 ? (
              <p className="p-5 text-xs text-slate-500 dark:text-slate-400">
                Sin gastos externos asociados a esta orden.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {repair.expenses.map((exp) => (
                  <li key={exp.id} className="px-5 py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{exp.description}</p>
                      <p className="text-[11px] text-slate-400">
                        {exp.category} · {formatShortDate(exp.date)}
                      </p>
                    </div>
                    <span className="font-mono-num font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(exp.amount, sym)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Financial & Payments Sidebar */}
        <aside className="space-y-4">
          <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Resumen de cuenta
            </h2>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Precio global</dt>
                <dd className="font-mono-num font-bold text-sm text-slate-900 dark:text-white">
                  {formatCurrency(financials.globalPrice, sym)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Pagado a la fecha</dt>
                <dd className="font-mono-num font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(financials.totalPaid, sym)}
                </dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <dt className="font-semibold text-slate-700 dark:text-slate-200">Saldo pendiente</dt>
                <dd
                  className={`font-mono-num font-bold text-sm ${
                    financials.pendingBalance > 0
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {formatCurrency(financials.pendingBalance, sym)}
                </dd>
              </div>
            </dl>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Costo repuestos + gastos</span>
                <span className="font-mono-num">
                  {formatCurrency(financials.totalWorkshopCost, sym)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Resultado estimado
                </span>
                <span className="font-mono-num font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(financials.estimatedResult, sym)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={openPaymentModal}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg inline-flex items-center justify-center gap-2 transition-colors"
            >
              <CreditCard className="w-4 h-4" aria-hidden="true" />
              Registrar abono / pago
            </button>
          </section>

          <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Historial de pagos ({repair.payments.length})
            </h2>
            {repair.payments.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aún no se registran abonos.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {repair.payments.map((pay) => (
                  <li key={pay.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {getPaymentMethodLabel(pay.method)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatShortDate(pay.date)}
                        {pay.note ? ` · ${pay.note}` : ''}
                      </p>
                    </div>
                    <span className="font-mono-num font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(pay.amount, sym)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {/* Modal Registrar Pago */}
      <Modal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Registrar pago · ${repair.code}`}
        subtitle={`Saldo pendiente actual: ${formatCurrency(financials.pendingBalance, sym)}`}
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          <div>
            <label htmlFor="pay-amount" className="block text-xs font-semibold mb-1">
              Monto a cobrar ({sym})
            </label>
            <input
              id="pay-amount"
              type="number"
              min={1}
              step="0.5"
              required
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono-num font-bold bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="pay-method" className="block text-xs font-semibold mb-1">
              Método de pago
            </label>
            <select
              id="pay-method"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <option value="efectivo">Efectivo</option>
              <option value="yape_plin">Yape / Plin</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
          <div>
            <label htmlFor="pay-note" className="block text-xs font-semibold mb-1">
              Nota (opcional)
            </label>
            <input
              id="pay-note"
              type="text"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder="Ej. Cancelación total al recoger moto"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              Confirmar pago
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Reparación */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Editar orden ${repair.code}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label htmlFor="edit-problem" className="block text-xs font-semibold mb-1">
              Problema reportado
            </label>
            <textarea
              id="edit-problem"
              rows={3}
              value={editProblem}
              onChange={(e) => setEditProblem(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="edit-diagnosis" className="block text-xs font-semibold mb-1">
              Diagnóstico del taller
            </label>
            <textarea
              id="edit-diagnosis"
              rows={2}
              value={editDiagnosis}
              onChange={(e) => setEditDiagnosis(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-price" className="block text-xs font-semibold mb-1">
                Precio global ({sym})
              </label>
              <input
                id="edit-price"
                type="number"
                min={1}
                value={editGlobalPrice}
                onChange={(e) => setEditGlobalPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="edit-mechanic" className="block text-xs font-semibold mb-1">
                Mecánico
              </label>
              <select
                id="edit-mechanic"
                value={editMechanic}
                onChange={(e) => setEditMechanic(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                {settings.team
                  .filter((t) => t.role === 'Mecánico' || t.role === 'Jefe de Taller')
                  .map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Añadir Repuesto */}
      <Modal
        open={addPartModalOpen}
        onClose={() => setAddPartModalOpen(false)}
        title="Añadir repuesto a la orden"
      >
        <form onSubmit={handleAddPart} className="space-y-4">
          <div>
            <label htmlFor="modal-part-source" className="block text-xs font-semibold mb-1">
              Origen del repuesto
            </label>
            <select
              id="modal-part-source"
              value={partSource}
              onChange={(e) => setPartSource(e.target.value as RepairPartSource)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <option value="almacen">1. Repuesto desde almacén</option>
              <option value="compra_directa">2. Repuesto comprado para la moto</option>
              <option value="cliente">3. Repuesto proporcionado por el cliente</option>
            </select>
          </div>

          {partSource === 'almacen' ? (
            <div>
              <label htmlFor="modal-prod-select" className="block text-xs font-semibold mb-1">
                Producto
              </label>
              <select
                id="modal-prod-select"
                value={selectedProdId}
                onChange={(e) => setSelectedProdId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="modal-custom-part" className="block text-xs font-semibold mb-1">
                Nombre del repuesto
              </label>
              <input
                id="modal-custom-part"
                type="text"
                required
                value={customPartName}
                onChange={(e) => setCustomPartName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="modal-part-qty" className="block text-xs font-semibold mb-1">
                Cantidad
              </label>
              <input
                id="modal-part-qty"
                type="number"
                min={1}
                value={partQty}
                onChange={(e) => setPartQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            {partSource === 'compra_directa' && (
              <div>
                <label htmlFor="modal-part-cost" className="block text-xs font-semibold mb-1">
                  Costo unit. ({sym})
                </label>
                <input
                  id="modal-part-cost"
                  type="number"
                  min={0}
                  step="0.5"
                  value={partCost}
                  onChange={(e) => setPartCost(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddPartModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              Agregar repuesto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
