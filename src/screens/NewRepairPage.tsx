'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  Package,
  ShoppingBag,
  UserCheck,
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  calculateRepairFinancials,
  formatCurrency,
  getPartSourceLabel,
  validateRepairDraft,
} from '../utils/calculations';
import type {
  PaymentMethod,
  RepairExpense,
  RepairPart,
  RepairPartSource,
  RepairStatus,
} from '../types/workshop';
import { REPAIR_STATUS_OPTIONS } from '../components/common/StatusDisplay';

const MOBILE_STEPS = [
  { id: 1, title: 'Cliente y moto' },
  { id: 2, title: 'Diagnóstico' },
  { id: 3, title: 'Repuestos y gastos' },
  { id: 4, title: 'Precio y confirmación' },
];

export const NewRepairPage: React.FC = () => {
  const { customers, motorcycles, products, settings, addRepair } = useWorkshop();
  const router = useRouter();
  const sym = settings.currencySymbol;

  const [mobileStep, setMobileStep] = useState(1);

  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const customerMotos = useMemo(
    () => motorcycles.filter((m) => m.customerId === customerId),
    [motorcycles, customerId]
  );
  const [motorcycleId, setMotorcycleId] = useState(
    motorcycles.find((m) => m.customerId === (customers[0]?.id ?? ''))?.id ?? ''
  );
  const [mileageAtEntry, setMileageAtEntry] = useState<number>(12500);
  const [mechanicName, setMechanicName] = useState(
    settings.team.find((t) => t.role === 'Mecánico' || t.role === 'Jefe de Taller')?.name ??
      'Carlos Mendoza'
  );
  const [status, setStatus] = useState<RepairStatus>('recibida');
  const [estimatedDelivery, setEstimatedDelivery] = useState('2026-11-24');
  const [reportedProblem, setReportedProblem] = useState('');
  const [diagnosisNotes, setDiagnosisNotes] = useState('');

  const [parts, setParts] = useState<RepairPart[]>([]);
  const [expenses, setExpenses] = useState<RepairExpense[]>([]);
  const [globalPrice, setGlobalPrice] = useState<number>(180);
  const [initialPayment, setInitialPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');

  // Part builder states
  const [partSource, setPartSource] = useState<RepairPartSource>('almacen');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '');
  const [customPartName, setCustomPartName] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partCost, setPartCost] = useState(0);
  const [partSupplier, setPartSupplier] = useState('');

  // Expense builder states
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    const firstMoto = motorcycles.find((m) => m.customerId === newCustId);
    setMotorcycleId(firstMoto?.id ?? '');
    if (firstMoto) setMileageAtEntry(firstMoto.mileageKm);
  };

  const handleAddPart = () => {
    if (partSource === 'almacen') {
      const prod = products.find((p) => p.id === selectedProductId);
      if (!prod) return;
      setParts((prev) => [
        ...prev,
        {
          id: `rp-${Date.now()}`,
          source: 'almacen',
          productId: prod.id,
          name: prod.name,
          quantity: Math.max(1, partQty),
          unitCost: prod.costPrice,
          unitPrice: prod.salePrice,
        },
      ]);
      setPartQty(1);
      return;
    }

    if (!customPartName.trim()) return;
    setParts((prev) => [
      ...prev,
      {
        id: `rp-${Date.now()}`,
        source: partSource,
        name: customPartName.trim(),
        quantity: Math.max(1, partQty),
        unitCost: partSource === 'cliente' ? 0 : Math.max(0, partCost),
        unitPrice: partSource === 'cliente' ? 0 : Math.max(0, partCost * 1.3),
        supplier: partSource === 'compra_directa' ? partSupplier.trim() : undefined,
      },
    ]);
    setCustomPartName('');
    setPartCost(0);
    setPartQty(1);
    setPartSupplier('');
  };

  const handleAddExpense = () => {
    if (!expDesc.trim() || expAmount <= 0) return;
    setExpenses((prev) => [
      ...prev,
      {
        id: `re-${Date.now()}`,
        description: expDesc.trim(),
        amount: expAmount,
        category: 'Asociado a reparación',
        date: '2026-11-21',
      },
    ]);
    setExpDesc('');
    setExpAmount(0);
  };

  const previewFinancials = useMemo(
    () =>
      calculateRepairFinancials({
        parts,
        expenses,
        globalPrice,
        payments:
          initialPayment > 0
            ? [{ id: 'preview', amount: initialPayment, method: paymentMethod, date: '2026-11-21' }]
            : [],
      }),
    [parts, expenses, globalPrice, initialPayment, paymentMethod]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateRepairDraft({
      customerId,
      motorcycleId,
      reportedProblem,
      globalPrice,
    });
    if (Object.keys(validation).length > 0) {
      setErrors(validation as Record<string, string>);
      if (validation.customerId || validation.motorcycleId) setMobileStep(1);
      else if (validation.reportedProblem) setMobileStep(2);
      else if (validation.globalPrice) setMobileStep(4);
      return;
    }

    const created = addRepair({
      customerId,
      motorcycleId,
      reportedProblem: reportedProblem.trim(),
      diagnosisNotes: diagnosisNotes.trim(),
      status,
      mechanicName,
      mileageAtEntry,
      parts,
      expenses,
      globalPrice,
      payments:
        initialPayment > 0
          ? [
              {
                id: `pay-${Date.now()}`,
                amount: initialPayment,
                method: paymentMethod,
                date: new Date().toISOString().slice(0, 10),
                note: 'Abono inicial al ingreso',
              },
            ]
          : [],
      estimatedDelivery,
    });

    router.push(`/reparaciones/${created.id}`);
  };

  const goNextStep = () => {
    if (mobileStep === 1 && (!customerId || !motorcycleId)) {
      setErrors({
        customerId: !customerId ? 'Selecciona un cliente.' : '',
        motorcycleId: !motorcycleId ? 'Selecciona una motocicleta.' : '',
      });
      return;
    }
    if (mobileStep === 2 && reportedProblem.trim().length < 5) {
      setErrors({ reportedProblem: 'Describe el problema reportado (mínimo 5 caracteres).' });
      return;
    }
    setErrors({});
    setMobileStep((s) => Math.min(4, s + 1));
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/reparaciones')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Volver a reparaciones
        </button>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Nueva orden · Zona Racing
        </span>
      </div>

      {/* Mobile Stepper Header */}
      <div className="md:hidden bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="font-bold text-slate-900 dark:text-white">
            Paso {mobileStep} de 4 · {MOBILE_STEPS[mobileStep - 1].title}
          </span>
          <span className="font-mono-num text-slate-500 dark:text-slate-400">
            {Math.round((mobileStep / 4) * 100)}%
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {MOBILE_STEPS.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setMobileStep(st.id)}
              aria-label={`Ir al paso ${st.id}: ${st.title}`}
              className={`h-1.5 rounded-full transition-colors ${
                st.id <= mobileStep ? 'bg-rose-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 space-y-5">
          {/* Step 1: Cliente y Motocicleta */}
          <section
            className={`bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 ${
              mobileStep === 1 ? 'block' : 'hidden md:block'
            }`}
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              1. Cliente y motocicleta
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="repair-customer"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Cliente
                </label>
                <select
                  id="repair-customer"
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="">Seleccionar cliente...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <p className="text-xs text-rose-600 mt-1">{errors.customerId}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="repair-moto"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Motocicleta
                </label>
                <select
                  id="repair-moto"
                  value={motorcycleId}
                  onChange={(e) => setMotorcycleId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="">Seleccionar moto...</option>
                  {customerMotos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} {m.model} · {m.plate}
                    </option>
                  ))}
                </select>
                {errors.motorcycleId && (
                  <p className="text-xs text-rose-600 mt-1">{errors.motorcycleId}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="repair-mileage"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Kilometraje al ingreso (km)
                </label>
                <input
                  id="repair-mileage"
                  type="number"
                  min={0}
                  value={mileageAtEntry}
                  onChange={(e) => setMileageAtEntry(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label
                  htmlFor="repair-mechanic"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Mecánico asignado
                </label>
                <select
                  id="repair-mechanic"
                  value={mechanicName}
                  onChange={(e) => setMechanicName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {settings.team
                    .filter((t) => t.role === 'Mecánico' || t.role === 'Jefe de Taller')
                    .map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </section>

          {/* Step 2: Problema Reportado y Estado */}
          <section
            className={`bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 ${
              mobileStep === 2 ? 'block' : 'hidden md:block'
            }`}
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              2. Problema reportado y diagnóstico
            </h2>

            <div>
              <label
                htmlFor="repair-problem"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Problema reportado por el cliente
              </label>
              <textarea
                id="repair-problem"
                rows={3}
                value={reportedProblem}
                onChange={(e) => setReportedProblem(e.target.value)}
                placeholder="Ej. Ruido en tren delantero al frenar, cambio de aceite y revisión de cadena..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
              {errors.reportedProblem && (
                <p className="text-xs text-rose-600 mt-1">{errors.reportedProblem}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="repair-diagnosis"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Observaciones técnicas / diagnóstico inicial
              </label>
              <textarea
                id="repair-diagnosis"
                rows={2}
                value={diagnosisNotes}
                onChange={(e) => setDiagnosisNotes(e.target.value)}
                placeholder="Notas internas del mecánico..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="repair-status"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Estado inicial
                </label>
                <select
                  id="repair-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RepairStatus)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {REPAIR_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="repair-delivery"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Fecha estimada de entrega
                </label>
                <input
                  id="repair-delivery"
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>
          </section>

          {/* Step 3: 3 Tipos de Repuestos y Gastos Asociados */}
          <section
            className={`bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-5 ${
              mobileStep === 3 ? 'block' : 'hidden md:block'
            }`}
          >
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                3. Repuestos utilizados y gastos asociados
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Registra repuestos de almacén, compras directas para la moto o piezas traídas por el cliente.
              </p>
            </div>

            {/* 3 Part Source Segmented Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'almacen', label: '1. Desde almacén', Icon: Package },
                  { id: 'compra_directa', label: '2. Compra para la moto', Icon: ShoppingBag },
                  { id: 'cliente', label: '3. Del cliente', Icon: UserCheck },
                ] as { id: RepairPartSource; label: string; Icon: React.ComponentType<{ className?: string }> }[]
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPartSource(id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                    partSource === id
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-rose-600 dark:border-rose-600'
                      : 'bg-slate-50 dark:bg-[#0F141C] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Part Add Inputs */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-800 space-y-3">
              {partSource === 'almacen' ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="part-warehouse-select"
                      className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                    >
                      Repuesto en inventario
                    </label>
                    <select
                      id="part-warehouse-select"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · Stock: {p.stock} u. ({formatCurrency(p.costPrice, sym)} costo)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="part-qty-almacen"
                      className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                    >
                      Cantidad
                    </label>
                    <input
                      id="part-qty-almacen"
                      type="number"
                      min={1}
                      value={partQty}
                      onChange={(e) => setPartQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono-num bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="part-custom-name"
                      className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                    >
                      Descripción del repuesto
                    </label>
                    <input
                      id="part-custom-name"
                      type="text"
                      value={customPartName}
                      onChange={(e) => setCustomPartName(e.target.value)}
                      placeholder={
                        partSource === 'compra_directa'
                          ? 'Ej. Sensor TPS OEM comprado para esta moto'
                          : 'Ej. Juego de pastillas traídas por el cliente'
                      }
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="part-custom-qty"
                      className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                    >
                      Cant.
                    </label>
                    <input
                      id="part-custom-qty"
                      type="number"
                      min={1}
                      value={partQty}
                      onChange={(e) => setPartQty(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono-num bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                  {partSource === 'compra_directa' ? (
                    <div>
                      <label
                        htmlFor="part-custom-cost"
                        className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                      >
                        Costo unit. ({sym})
                      </label>
                      <input
                        id="part-custom-cost"
                        type="number"
                        min={0}
                        step="0.5"
                        value={partCost}
                        onChange={(e) => setPartCost(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono-num bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 py-2">
                      Sin costo para el taller ({sym}0.00)
                    </div>
                  )}
                  {partSource === 'compra_directa' && (
                    <div className="sm:col-span-4">
                      <label
                        htmlFor="part-supplier"
                        className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                      >
                        Proveedor (opcional)
                      </label>
                      <input
                        id="part-supplier"
                        type="text"
                        value={partSupplier}
                        onChange={(e) => setPartSupplier(e.target.value)}
                        placeholder="Ej. Motopartes Central"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddPart}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  Agregar repuesto
                </button>
              </div>
            </div>

            {/* Added Parts List */}
            {parts.length > 0 && (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                {parts.map((p) => (
                  <li key={p.id} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {p.quantity}x {p.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {getPartSourceLabel(p.source)}
                        {p.supplier ? ` · ${p.supplier}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono-num font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(p.unitCost * p.quantity, sym)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setParts((prev) => prev.filter((item) => item.id !== p.id))}
                        aria-label={`Quitar ${p.name}`}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Associated Expenses */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Gastos asociados (servicios externos, envíos, etc.)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                <div className="sm:col-span-2">
                  <label htmlFor="assoc-exp-desc" className="block text-[11px] text-slate-500 mb-1">
                    Descripción del gasto
                  </label>
                  <input
                    id="assoc-exp-desc"
                    type="text"
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    placeholder="Ej. Torno / rectificado externo"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="assoc-exp-amount" className="block text-[11px] text-slate-500 mb-1">
                    Monto ({sym})
                  </label>
                  <input
                    id="assoc-exp-amount"
                    type="number"
                    min={0}
                    step="0.5"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddExpense}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  + Añadir gasto
                </button>
              </div>

              {expenses.length > 0 && (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
                  {expenses.map((ex) => (
                    <li key={ex.id} className="px-3.5 py-2 flex items-center justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300">{ex.description}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono-num font-semibold">
                          {formatCurrency(ex.amount, sym)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExpenses((prev) => prev.filter((item) => item.id !== ex.id))
                          }
                          aria-label={`Quitar gasto ${ex.description}`}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Mobile Step 4 Pricing Section (also visible on Desktop in sidebar summary) */}
          <section
            className={`bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 md:hidden ${
              mobileStep === 4 ? 'block' : 'hidden'
            }`}
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              4. Precio global y pago inicial
            </h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="m-global-price" className="block text-xs font-semibold mb-1">
                  Precio global acordado ({sym})
                </label>
                <input
                  id="m-global-price"
                  type="number"
                  min={1}
                  value={globalPrice}
                  onChange={(e) => setGlobalPrice(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-base font-mono-num font-bold bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                />
                {errors.globalPrice && (
                  <p className="text-xs text-rose-600 mt-1">{errors.globalPrice}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="m-init-pay" className="block text-xs font-semibold mb-1">
                    Abono inicial ({sym})
                  </label>
                  <input
                    id="m-init-pay"
                    type="number"
                    min={0}
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="m-pay-method" className="block text-xs font-semibold mb-1">
                    Método
                  </label>
                  <select
                    id="m-pay-method"
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
              </div>
            </div>
          </section>

          {/* Mobile Stepper Navigation Controls */}
          <div className="md:hidden flex items-center justify-between gap-3 pt-1">
            {mobileStep > 1 ? (
              <button
                type="button"
                onClick={() => setMobileStep((s) => Math.max(1, s - 1))}
                className="flex-1 py-3 px-4 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131822] text-slate-700 dark:text-slate-200 inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Anterior
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {mobileStep < 4 ? (
              <button
                type="button"
                onClick={goNextStep}
                className="flex-1 py-3 px-4 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 inline-flex items-center justify-center gap-1.5"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 py-3 px-4 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 inline-flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                Crear orden
              </button>
            )}
          </div>
        </div>

        {/* Desktop Summary & Financial Card (shown on mobile only in step 4) */}
        <aside
          className={`bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 lg:sticky lg:top-24 ${
            mobileStep === 4 ? 'block' : 'hidden md:block'
          }`}
        >
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Resumen económico de la orden
          </h2>

          <div className="hidden md:block space-y-3">
            <div>
              <label
                htmlFor="d-global-price"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Precio global al cliente ({sym})
              </label>
              <input
                id="d-global-price"
                type="number"
                min={1}
                value={globalPrice}
                onChange={(e) => setGlobalPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-base font-mono-num font-bold bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
              {errors.globalPrice && (
                <p className="text-xs text-rose-600 mt-1">{errors.globalPrice}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="d-init-pay"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Abono inicial ({sym})
                </label>
                <input
                  id="d-init-pay"
                  type="number"
                  min={0}
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label
                  htmlFor="d-pay-method"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Método
                </label>
                <select
                  id="d-pay-method"
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
            </div>
          </div>

          <dl className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Repuestos almacén (costo)</dt>
              <dd className="font-mono-num font-medium">
                {formatCurrency(previewFinancials.warehousePartsCost, sym)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Compras directas</dt>
              <dd className="font-mono-num font-medium">
                {formatCurrency(previewFinancials.directPurchaseCost, sym)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Repuestos del cliente</dt>
              <dd className="font-mono-num font-medium">
                {previewFinancials.clientPartsCount} u. ({sym}0.00)
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Gastos asociados</dt>
              <dd className="font-mono-num font-medium">
                {formatCurrency(previewFinancials.associatedExpensesTotal, sym)}
              </dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <dt className="font-semibold text-slate-700 dark:text-slate-200">Saldo pendiente</dt>
              <dd className="font-mono-num font-bold text-amber-700 dark:text-amber-400">
                {formatCurrency(previewFinancials.pendingBalance, sym)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-semibold text-slate-700 dark:text-slate-200">Resultado estimado</dt>
              <dd
                className={`font-mono-num font-bold ${
                  previewFinancials.estimatedResult >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {formatCurrency(previewFinancials.estimatedResult, sym)}
              </dd>
            </div>
          </dl>

          <button
            type="submit"
            className="hidden md:flex w-full py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg items-center justify-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            Guardar orden de reparación
          </button>
        </aside>
      </form>
    </div>
  );
};
