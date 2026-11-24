'use client';

import React, { useMemo, useState } from 'react';
import { Download, TrendingUp, TrendingDown, Wrench, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { useWorkshop } from '../context/WorkshopContext';
import { MONTHLY_CHART_SERIES } from '../mocks/seedData';
import { calculatePeriodReport, formatCurrency } from '../utils/calculations';

type ReportPeriod = 'semana' | 'mes' | 'semestre';

export const ReportsPage: React.FC = () => {
  const { sales, repairs, transactions, settings, notify } = useWorkshop();
  const sym = settings.currencySymbol;
  const [period, setPeriod] = useState<ReportPeriod>('mes');

  const summary = useMemo(
    () => calculatePeriodReport(sales, repairs, transactions),
    [sales, repairs, transactions]
  );

  const periodSeries = useMemo(() => {
    if (period === 'semana') {
      return [
        { name: 'Lun', ingresos: 380, costos: 160, resultado: 220 },
        { name: 'Mar', ingresos: 520, costos: 240, resultado: 280 },
        { name: 'Mié', ingresos: 440, costos: 195, resultado: 245 },
        { name: 'Jue', ingresos: 610, costos: 270, resultado: 340 },
        { name: 'Vie', ingresos: 690, costos: 290, resultado: 400 },
        { name: 'Sáb', ingresos: 790, costos: 310, resultado: 480 },
      ];
    }
    if (period === 'mes') {
      return [
        { name: 'Sem 1', ingresos: 1120, costos: 510, resultado: 610 },
        { name: 'Sem 2', ingresos: 1380, costos: 620, resultado: 760 },
        { name: 'Sem 3', ingresos: 1490, costos: 590, resultado: 900 },
        { name: 'Sem 4', ingresos: 1500, costos: 570, resultado: 930 },
      ];
    }
    return MONTHLY_CHART_SERIES.map((m) => ({
      name: m.month,
      ingresos: m.ingresos,
      costos: m.gastos,
      resultado: m.resultado,
    }));
  }, [period]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; sku: string; qty: number; revenue: number }>();
    for (const sale of sales) {
      for (const item of sale.items) {
        const prev = map.get(item.productId) ?? {
          name: item.name,
          sku: item.sku,
          qty: 0,
          revenue: 0,
        };
        prev.qty += item.quantity;
        prev.revenue += item.quantity * item.unitPrice;
        map.set(item.productId, prev);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  const handleDemoExport = () => {
    notify(
      'Exportación Excel (Demostración)',
      'Se generó la vista previa demostrativa del reporte. La descarga XLSX real se conectará con el backend.',
      'info'
    );
  };

  return (
    <div className="space-y-6">
      {/* Period Selector & Excel Export Demo CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Seleccionar periodo de reporte"
          className="inline-flex items-center p-1 bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg self-start"
        >
          {(
            [
              { id: 'semana', label: 'Última semana' },
              { id: 'mes', label: 'Mes actual' },
              { id: 'semestre', label: 'Últimos 6 meses' },
            ] as { id: ReportPeriod; label: string }[]
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                period === p.id
                  ? 'bg-slate-900 text-white dark:bg-rose-600'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleDemoExport}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg whitespace-nowrap self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          Exportar Excel (Demo)
        </button>
      </div>

      {/* Primary Financial Hierarchy: Ingresos, Costos, Gastos, Resultado estimado */}
      <section aria-label="Resumen financiero estimado" className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ingresos totales</p>
          <p className="font-mono-num text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {formatCurrency(summary.totalIncome, sym)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            POS {formatCurrency(summary.salesIncome, sym)} · Taller {formatCurrency(summary.repairsIncome, sym)}
          </p>
        </div>

        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Costos directos</p>
          <p className="font-mono-num text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {formatCurrency(summary.directCosts, sym)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Repuestos e insumos aplicados
          </p>
        </div>

        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Gastos operativos</p>
          <p className="font-mono-num text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {formatCurrency(summary.operatingExpenses, sym)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Alquiler, servicios, herramientas
          </p>
        </div>

        <div className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-4 lg:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Resultado estimado
            </p>
            {summary.estimatedResult >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600" aria-hidden="true" />
            )}
          </div>
          <p
            className={`font-mono-num text-xl lg:text-2xl font-bold mt-1.5 ${
              summary.estimatedResult >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {formatCurrency(summary.estimatedResult, sym)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Ingresos − Costos − Gastos
          </p>
        </div>
      </section>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Evolución del resultado estimado
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tendencia demostrativa por periodo seleccionado
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-rose-600" aria-hidden="true" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={periodSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.45} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="resultado"
                  name="Resultado estimado"
                  stroke="#16a34a"
                  fill="#16a34a"
                  fillOpacity={0.14}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Ingresos vs. egresos totales
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparativa por bloque temporal
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.45} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="ingresos" name="Ingresos" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costos" name="Costos y gastos" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Bottom Row: Top Products & Repairs Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Productos más vendidos (POS)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranking según unidades facturadas y monto acumulado
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0F141C] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-5">Producto</th>
                  <th className="py-2.5 px-4 text-right">Unidades</th>
                  <th className="py-2.5 px-5 text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {topProducts.map((item) => (
                  <tr key={item.sku}>
                    <td className="py-3 px-5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                      <p className="text-[11px] font-mono-num text-slate-400">{item.sku}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold">
                      {item.qty} u.
                    </td>
                    <td className="py-3 px-5 text-right font-mono-num font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.revenue, sym)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Wrench className="w-4 h-4 text-rose-600" aria-hidden="true" />
              <h2>Reparaciones realizadas</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Productividad de órdenes en el taller
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0F141C] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Listas o entregadas
              </span>
              <span className="font-mono-num text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {summary.repairsCompleted}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0F141C] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                En proceso / diagnóstico
              </span>
              <span className="font-mono-num text-lg font-bold text-amber-700 dark:text-amber-400">
                {summary.repairsActive}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0F141C] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Ventas rápidas registradas
              </span>
              <span className="font-mono-num text-lg font-bold text-slate-900 dark:text-white">
                {summary.salesCount}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Todos los montos y gráficas corresponden a datos demostrativos locales para validación de interfaz.
          </p>
        </section>
      </div>
    </div>
  );
};
