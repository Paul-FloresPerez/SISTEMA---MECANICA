'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Wrench } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { calculateRepairFinancials, formatCurrency, formatShortDate } from '../utils/calculations';
import { RepairStatusText } from '../components/common/StatusDisplay';
import { EmptyState } from '../components/common/EmptyState';
import type { RepairStatus } from '../types/workshop';

type StatusTab = 'todas' | 'activas' | RepairStatus;

export const RepairsPage: React.FC = () => {
  const { repairs, customers, motorcycles, settings } = useWorkshop();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('todas');
  const sym = settings.currencySymbol;

  const getCustomer = (id: string) => customers.find((c) => c.id === id);
  const getMoto = (id: string) => motorcycles.find((m) => m.id === id);

  const filteredRepairs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return repairs.filter((r) => {
      if (statusTab === 'activas' && r.status === 'entregada') return false;
      if (statusTab !== 'todas' && statusTab !== 'activas' && r.status !== statusTab) {
        return false;
      }
      if (!q) return true;
      const cust = getCustomer(r.customerId);
      const moto = getMoto(r.motorcycleId);
      const haystack = [
        r.code,
        r.reportedProblem,
        r.mechanicName,
        cust?.name,
        moto?.brand,
        moto?.model,
        moto?.plate,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [repairs, customers, motorcycles, search, statusTab]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="repair-search" className="sr-only">
            Buscar reparación por código, cliente, moto o placa
          </label>
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="repair-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar orden, cliente, modelo o placa..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/40"
          />
        </div>

        <button
          type="button"
          onClick={() => router.push('/reparaciones/nueva')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nueva reparación
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="overflow-x-auto pb-1">
        <div
          role="group"
          aria-label="Filtrar reparaciones por estado"
          className="inline-flex items-center gap-1 p-1 bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg"
        >
          {(
            [
              { id: 'todas', label: 'Todas' },
              { id: 'activas', label: 'En taller' },
              { id: 'diagnostico', label: 'Diagnóstico' },
              { id: 'en_proceso', label: 'En proceso' },
              { id: 'esperando_repuesto', label: 'Esperando repuesto' },
              { id: 'lista', label: 'Listas' },
              { id: 'entregada', label: 'Entregadas' },
            ] as { id: StatusTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusTab === tab.id
                  ? 'bg-slate-900 text-white dark:bg-rose-600'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredRepairs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No hay reparaciones con ese criterio"
          description="Ajusta el buscador o registra una nueva orden de servicio para ingresar una motocicleta al taller."
          actionLabel="Registrar reparación"
          onAction={() => router.push('/reparaciones/nueva')}
        />
      ) : (
        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0F141C] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Orden</th>
                  <th className="py-3 px-4">Cliente / Motocicleta</th>
                  <th className="py-3 px-4">Problema reportado</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Precio global</th>
                  <th className="py-3 px-4 text-right">Pagado</th>
                  <th className="py-3 px-5 text-right">Saldo pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredRepairs.map((repair) => {
                  const cust = getCustomer(repair.customerId);
                  const moto = getMoto(repair.motorcycleId);
                  const fin = calculateRepairFinancials(repair);

                  return (
                    <tr
                      key={repair.id}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => router.push(`/reparaciones/${repair.id}`)}
                          className="font-mono-num font-bold text-rose-600 dark:text-rose-400 hover:underline"
                        >
                          {repair.code}
                        </button>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatShortDate(repair.createdAt)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {moto ? `${moto.brand} ${moto.model} · ${moto.plate}` : 'Motocicleta'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {cust?.name ?? 'Cliente'} · Mec. {repair.mechanicName}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
                          {repair.reportedProblem}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {repair.parts.length} repuesto(s) · {repair.expenses.length} gasto(s)
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <RepairStatusText status={repair.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(fin.globalPrice, sym)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formatCurrency(fin.totalPaid, sym)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono-num font-bold whitespace-nowrap">
                        <span
                          className={
                            fin.pendingBalance > 0
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }
                        >
                          {formatCurrency(fin.pendingBalance, sym)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Card List */}
          <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRepairs.map((repair) => {
              const cust = getCustomer(repair.customerId);
              const moto = getMoto(repair.motorcycleId);
              const fin = calculateRepairFinancials(repair);
              return (
                <button
                  key={repair.id}
                  type="button"
                  onClick={() => router.push(`/reparaciones/${repair.id}`)}
                  className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-num text-xs font-bold text-rose-600 dark:text-rose-400">
                      {repair.code}
                    </span>
                    <RepairStatusText status={repair.status} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {moto ? `${moto.brand} ${moto.model} · ${moto.plate}` : 'Motocicleta'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {cust?.name} · {repair.mechanicName}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {repair.reportedProblem}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/70 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Total: <strong className="font-mono-num text-slate-900 dark:text-white">{formatCurrency(fin.globalPrice, sym)}</strong>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Saldo:{' '}
                      <strong
                        className={`font-mono-num ${
                          fin.pendingBalance > 0
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(fin.pendingBalance, sym)}
                      </strong>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
