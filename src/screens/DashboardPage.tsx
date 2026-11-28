'use client';

import { canAccessRoute } from '../auth/route-policy';
import { hasPermission, type Role } from '../auth/permissions';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  ShoppingCart,
  Receipt,
  Package,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useWorkshop } from '../context/WorkshopContext';
import { MONTHLY_CHART_SERIES } from '../mocks/seedData';
import {
  calculatePeriodReport,
  calculateRepairFinancials,
  formatCurrency,
  formatRepairPrice,
  formatShortDate,
  getTodayIso,
} from '../utils/calculations';
import { RepairStatusText } from '../components/common/StatusDisplay';

type DateScope = 'hoy' | '7d' | 'mes' | 'todo';

export const DashboardPage: React.FC<{ role: Role }> = ({ role }) => {
  const { repairs, sales, transactions, products, customers, motorcycles, settings } =
    useWorkshop();
  const router = useRouter();
  const [dateScope, setDateScope] = useState<DateScope>('mes');

  const sym = settings.currencySymbol;
  const today = getTodayIso();
  const currentMonth = today.slice(0, 7);

  const filteredData = useMemo(() => {
    const refDate = new Date(`${today}T23:59:59`);
    const inScope = (iso: string) => {
      if (dateScope === 'todo') return true;
      const d = new Date(`${iso}T12:00:00`);
      const diffDays = (refDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      if (dateScope === 'hoy') return iso === today;
      if (dateScope === '7d') return diffDays >= 0 && diffDays <= 7;
      return iso.startsWith(currentMonth);
    };

    const scopedSales = sales.filter((s) => inScope(s.date));
    const scopedRepairs = repairs.filter((r) => inScope(r.createdAt));
    const scopedTx = transactions.filter((t) => inScope(t.date));

    const todaySalesTotal = sales
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.total, 0);

    const monthSalesTotal = sales
      .filter((s) => s.date.startsWith(currentMonth))
      .reduce((sum, s) => sum + s.total, 0);

    const monthExpensesTotal = transactions
      .filter((t) => t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const periodReport = calculatePeriodReport(scopedSales, scopedRepairs, scopedTx);

    return {
      todaySalesTotal,
      monthSalesTotal,
      monthExpensesTotal,
      periodReport,
    };
  }, [sales, repairs, transactions, dateScope, today, currentMonth]);

  const pendingRepairs = useMemo(
    () => repairs.filter((r) => r.status !== 'entregada'),
    [repairs]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock),
    [products]
  );

  const chartData = useMemo(() => {
    if (dateScope === 'hoy') {
      return [
        {
          label: `Hoy (${formatShortDate(today)})`,
          ingresos: filteredData.todaySalesTotal + 120,
          gastos: 48,
        },
      ];
    }
    if (dateScope === '7d') {
      return [
        { label: 'Lun', ingresos: 320, gastos: 140 },
        { label: 'Mar', ingresos: 480, gastos: 210 },
        { label: 'Mié', ingresos: 410, gastos: 195 },
        { label: 'Jue', ingresos: 590, gastos: 260 },
        { label: 'Vie', ingresos: 640, gastos: 220 },
        { label: 'Sáb', ingresos: 710, gastos: 185 },
      ];
    }
    return MONTHLY_CHART_SERIES.map((m) => ({
      label: m.month,
      ingresos: m.ingresos,
      gastos: m.gastos,
    }));
  }, [dateScope, filteredData.todaySalesTotal]);

  const getCustomerName = (id: string) =>
    customers.find((c) => c.id === id)?.name ?? 'Cliente';
  const getMotoLabel = (id: string) => {
    const m = motorcycles.find((moto) => moto.id === id);
    return m ? `${m.brand} ${m.model} · ${m.plate}` : 'Motocicleta';
  };

  return (
    <div className="space-y-6">
      {/* Date Filter + Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            Periodo:
          </span>
          <div
            role="group"
            aria-label="Filtrar resumen por fecha"
            className="inline-flex items-center p-1 bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg"
          >
            {(
              [
                { id: 'hoy', label: 'Hoy' },
                { id: '7d', label: '7 días' },
                { id: 'mes', label: 'Mes actual' },
                { id: 'todo', label: 'Todo' },
              ] as { id: DateScope; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateScope(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  dateScope === tab.id
                    ? 'bg-slate-900 text-white dark:bg-rose-600'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {canAccessRoute(role, '/reparaciones/nueva') && (
          <button
            type="button"
            onClick={() => router.push('/reparaciones/nueva')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-rose-500/50 transition-colors whitespace-nowrap shrink-0"
          >
            <Wrench className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
            Nueva reparación
          </button>
          )}
          {hasPermission(role, 'sales:write') && canAccessRoute(role, '/ventas') && (
          <button
            type="button"
            onClick={() => router.push('/ventas')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-rose-500/50 transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
            Abrir POS
          </button>
          )}
          {hasPermission(role, 'purchases:write') && canAccessRoute(role, '/compras-gastos') && (
          <button
            type="button"
            onClick={() => router.push('/compras-gastos')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-rose-500/50 transition-colors whitespace-nowrap shrink-0"
          >
            <Receipt className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
            Registrar gasto
          </button>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <section aria-label="Indicadores principales" className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Ventas del día
          </p>
          <p className="font-mono-num text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {formatCurrency(filteredData.todaySalesTotal, sym)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Mostrador POS · {formatShortDate(today)}
          </p>
        </div>

        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Ventas del mes
          </p>
          <p className="font-mono-num text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {formatCurrency(filteredData.monthSalesTotal, sym)}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
            +12.4% vs mes anterior
          </p>
        </div>

        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Gastos del mes
          </p>
          <p className="font-mono-num text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {formatCurrency(filteredData.monthExpensesTotal, sym)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Compras y operación
          </p>
        </div>

        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Resultado estimado
            </p>
            {filteredData.periodReport.estimatedResult >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
            )}
          </div>
          <p
            className={`font-mono-num text-xl lg:text-2xl font-bold mt-1.5 ${
              filteredData.periodReport.estimatedResult >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {formatCurrency(filteredData.periodReport.estimatedResult, sym)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Ingresos menos costos y gastos
          </p>
        </div>
      </section>

      {/* Secondary Operational Strip + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Income vs Expenses Chart */}
        <section className="lg:col-span-2 bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Ingresos vs. gastos del taller
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparativa operativa (reparaciones + ventas POS frente a compras y gastos)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" aria-hidden="true" />
                Ingresos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-800 dark:bg-slate-400 inline-block" aria-hidden="true" />
                Gastos
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.45} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="ingresos" name="Ingresos" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Operational Status + Low Stock Alert Card */}
        <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Estado del taller
              </h2>
              <button
                type="button"
                onClick={() => router.push('/reparaciones')}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                Ver todas <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0F141C] border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Reparaciones pendientes
                </span>
                <span className="font-mono-num text-xl font-bold text-slate-900 dark:text-white mt-0.5 block">
                  {pendingRepairs.length}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0F141C] border border-slate-200/80 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Stock bajo
                </span>
                <span className="font-mono-num text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {lowStockProducts.length}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white inline-flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                Productos con poco stock
              </h3>
              <button
                type="button"
                onClick={() => router.push('/inventario')}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline whitespace-nowrap"
              >
                Inventario
              </button>
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {lowStockProducts.slice(0, 4).map((prod) => (
                <li key={prod.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {prod.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {prod.sku} · Mín. {prod.minStock} u.
                    </p>
                  </div>
                  <span className="font-mono-num text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">
                    {prod.stock} u.
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Recent Repairs Section */}
      <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Reparaciones recientes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Órdenes activas y últimas entregas en taller
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/reparaciones')}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            Ir a reparaciones <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0F141C] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-5">Orden</th>
                <th className="py-2.5 px-4">Cliente y motocicleta</th>
                <th className="py-2.5 px-4">Estado</th>
                <th className="py-2.5 px-4">Fecha entrega</th>
                <th className="py-2.5 px-4 text-right">Precio global</th>
                <th className="py-2.5 px-5 text-right">Saldo pendiente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {repairs.slice(0, 5).map((repair) => {
                const fin = calculateRepairFinancials(repair);
                return (
                  <tr
                    key={repair.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-5 font-mono-num font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => router.push(`/reparaciones/${repair.id}`)}
                        className="hover:text-rose-600 dark:hover:text-rose-400 underline-offset-2 hover:underline"
                      >
                        {repair.code}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {getMotoLabel(repair.motorcycleId)}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {getCustomerName(repair.customerId)} · Mec. {repair.mechanicName}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <RepairStatusText status={repair.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatShortDate(repair.estimatedDelivery)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatRepairPrice(fin.globalPrice, sym)}
                    </td>
                    <td className="py-3 px-5 text-right font-mono-num font-semibold whitespace-nowrap">
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

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {repairs.slice(0, 5).map((repair) => {
            const fin = calculateRepairFinancials(repair);
            return (
              <button
                key={repair.id}
                type="button"
                onClick={() => router.push(`/reparaciones/${repair.id}`)}
                className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-num text-xs font-bold text-slate-900 dark:text-white">
                    {repair.code}
                  </span>
                  <RepairStatusText status={repair.status} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {getMotoLabel(repair.motorcycleId)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {getCustomerName(repair.customerId)} · Entrega {formatShortDate(repair.estimatedDelivery)}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400">
                    Global: <strong className="font-mono-num text-slate-900 dark:text-white">{formatRepairPrice(fin.globalPrice, sym)}</strong>
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
      </section>
    </div>
  );
};
