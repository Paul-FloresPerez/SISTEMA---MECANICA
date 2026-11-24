import React from 'react';
import {
  CheckCircle2,
  Clock,
  PackageCheck,
  SearchCheck,
  Wrench,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  ShoppingBag,
  Receipt,
  PackagePlus,
} from 'lucide-react';
import type { MovementType, PaymentMethod, RepairStatus, TransactionOrigin } from '../../types/workshop';

const REPAIR_STATUS_META: Record<
  RepairStatus,
  { label: string; colorClass: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  recibida: {
    label: 'Recibida',
    colorClass: 'text-slate-600 dark:text-slate-300',
    Icon: Clock,
  },
  diagnostico: {
    label: 'Diagnóstico',
    colorClass: 'text-sky-700 dark:text-sky-400',
    Icon: SearchCheck,
  },
  en_proceso: {
    label: 'En proceso',
    colorClass: 'text-amber-700 dark:text-amber-400',
    Icon: Wrench,
  },
  esperando_repuesto: {
    label: 'Esperando repuesto',
    colorClass: 'text-rose-700 dark:text-rose-400',
    Icon: AlertTriangle,
  },
  lista: {
    label: 'Lista para entrega',
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    Icon: PackageCheck,
  },
  entregada: {
    label: 'Entregada',
    colorClass: 'text-slate-500 dark:text-slate-400',
    Icon: CheckCircle2,
  },
};

export const RepairStatusText: React.FC<{ status: RepairStatus }> = ({ status }) => {
  const meta = REPAIR_STATUS_META[status];
  const Icon = meta.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${meta.colorClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
};

export const REPAIR_STATUS_OPTIONS: { value: RepairStatus; label: string }[] = [
  { value: 'recibida', label: 'Recibida' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'esperando_repuesto', label: 'Esperando repuesto' },
  { value: 'lista', label: 'Lista para entrega' },
  { value: 'entregada', label: 'Entregada' },
];

export const MovementTypeText: React.FC<{ type: MovementType }> = ({ type }) => {
  if (type === 'entrada') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Entrada</span>
      </span>
    );
  }
  if (type === 'salida') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 whitespace-nowrap">
        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Salida</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
      <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Ajuste</span>
    </span>
  );
};

export const TransactionOriginText: React.FC<{ origin: TransactionOrigin }> = ({ origin }) => {
  if (origin === 'compra_almacen') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 whitespace-nowrap">
        <PackagePlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Compra almacén</span>
      </span>
    );
  }
  if (origin === 'compra_reparacion') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
        <ShoppingBag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>Compra reparación</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 whitespace-nowrap">
      <Receipt className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Gasto operativo</span>
    </span>
  );
};

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'efectivo':
      return 'Efectivo';
    case 'yape_plin':
      return 'Yape / Plin';
    case 'tarjeta':
      return 'Tarjeta';
    case 'transferencia':
      return 'Transferencia';
  }
}
