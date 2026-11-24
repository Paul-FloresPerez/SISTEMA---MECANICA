'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bike, Plus, Wrench, Phone, Mail, FileText } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { BRAND_ASSETS } from '../mocks/seedData';
import { calculateRepairFinancials, formatCurrency, formatRepairPrice, formatShortDate, getCurrentYear } from '../utils/calculations';
import { RepairStatusText } from '../components/common/StatusDisplay';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { customers, motorcycles, repairs, settings, addMotorcycle } = useWorkshop();
  const sym = settings.currencySymbol;

  const customer = customers.find((c) => c.id === id);
  const clientMotos = useMemo(
    () => motorcycles.filter((m) => m.customerId === id),
    [motorcycles, id]
  );
  const clientRepairs = useMemo(
    () => repairs.filter((r) => r.customerId === id),
    [repairs, id]
  );

  const [selectedMotoFilter, setSelectedMotoFilter] = useState<string>('todas');
  const [motoModalOpen, setMotoModalOpen] = useState(false);

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(() => getCurrentYear());
  const [plate, setPlate] = useState('');
  const [cc, setCc] = useState(650);
  const [color, setColor] = useState('');
  const [mileage, setMileage] = useState(0);

  if (!customer) {
    return (
      <EmptyState
        title="Cliente no encontrado"
        description="El perfil solicitado no figura en el directorio actual."
        actionLabel="Volver a clientes"
        onAction={() => router.push('/clientes')}
      />
    );
  }

  const visibleRepairs =
    selectedMotoFilter === 'todas'
      ? clientRepairs
      : clientRepairs.filter((r) => r.motorcycleId === selectedMotoFilter);

  const handleAddMoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim() || !plate.trim()) return;
    addMotorcycle({
      customerId: customer.id,
      brand: brand.trim(),
      model: model.trim(),
      year,
      plate: plate.trim().toUpperCase(),
      displacementCc: cc,
      color: color.trim() || 'Negro',
      mileageKm: mileage,
    });
    setBrand('');
    setModel('');
    setPlate('');
    setColor('');
    setMileage(0);
    setMotoModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/clientes')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Volver a clientes y motocicletas
        </button>

        <button
          type="button"
          onClick={() => setMotoModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Registrar motocicleta
        </button>
      </div>

      {/* Customer Profile Card */}
      <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        <div className="md:col-span-2 space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Cliente desde {formatShortDate(customer.createdAt)} · Doc. {customer.documentId}
          </p>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{customer.name}</h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
              {customer.phone}
            </span>
            {customer.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                {customer.email}
              </span>
            )}
          </div>
          {customer.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 inline-flex items-start gap-1.5">
              <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              {customer.notes}
            </p>
          )}
        </div>

        <div className="aspect-[16/10] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <ImageWithFallback
            src={BRAND_ASSETS.sportbike}
            alt="Motocicleta en taller Zona Racing"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Motorcycles Garage */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Garaje de motocicletas ({clientMotos.length})
          </h3>
          {clientMotos.length > 1 && (
            <button
              type="button"
              onClick={() => setSelectedMotoFilter('todas')}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Mostrar historial de todas
            </button>
          )}
        </div>

        {clientMotos.length === 0 ? (
          <EmptyState
            icon={Bike}
            title="Sin motocicletas registradas"
            description="Agrega una motocicleta al perfil de este cliente para asignarle órdenes de reparación."
            actionLabel="Agregar motocicleta"
            onAction={() => setMotoModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientMotos.map((moto) => {
              const active = selectedMotoFilter === moto.id;
              return (
                <button
                  key={moto.id}
                  type="button"
                  onClick={() =>
                    setSelectedMotoFilter((prev) => (prev === moto.id ? 'todas' : moto.id))
                  }
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-rose-600/15 dark:border-rose-500'
                      : 'bg-white dark:bg-[#131822] border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono-num text-xs font-bold text-rose-500">
                      {moto.plate}
                    </span>
                    <span className="text-[11px] opacity-75">{moto.displacementCc} cc</span>
                  </div>
                  <p className="text-sm font-bold mt-1">
                    {moto.brand} {moto.model}
                  </p>
                  <p className="text-xs opacity-75 mt-0.5">
                    Año {moto.year} · {moto.color} ·{' '}
                    <span className="font-mono-num">{moto.mileageKm.toLocaleString('es-ES')} km</span>
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Visual Repair History */}
      <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Historial visual de reparaciones ({visibleRepairs.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedMotoFilter === 'todas'
                ? 'Todas las motocicletas del cliente'
                : 'Filtrado por motocicleta seleccionada'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/reparaciones/nueva')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
            Nueva orden
          </button>
        </div>

        {visibleRepairs.length === 0 ? (
          <p className="p-6 text-xs text-slate-500 dark:text-slate-400 text-center">
            No hay reparaciones registradas para esta selección.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visibleRepairs.map((repair) => {
              const moto = clientMotos.find((m) => m.id === repair.motorcycleId);
              const fin = calculateRepairFinancials(repair);
              return (
                <div
                  key={repair.id}
                  className="p-4 lg:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => router.push(`/reparaciones/${repair.id}`)}
                        className="font-mono-num text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        {repair.code}
                      </button>
                      <RepairStatusText status={repair.status} />
                      <span className="text-[11px] text-slate-400">
                        {formatShortDate(repair.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {moto ? `${moto.brand} ${moto.model} (${moto.plate})` : 'Motocicleta'} ·{' '}
                      <span className="font-normal text-slate-600 dark:text-slate-400">
                        {repair.reportedProblem}
                      </span>
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 shrink-0">
                    <span className="font-mono-num text-sm font-bold text-slate-900 dark:text-white">
                      {formatRepairPrice(fin.globalPrice, sym)}
                    </span>
                    <span className="text-[11px] font-mono-num text-slate-500">
                      Saldo: {formatCurrency(fin.pendingBalance, sym)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Motorcycle Modal */}
      <Modal
        open={motoModalOpen}
        onClose={() => setMotoModalOpen(false)}
        title={`Agregar motocicleta a ${customer.name}`}
      >
        <form onSubmit={handleAddMoto} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="m-brand" className="block text-xs font-semibold mb-1">
                Marca
              </label>
              <input
                id="m-brand"
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ej. Yamaha"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="m-model" className="block text-xs font-semibold mb-1">
                Modelo
              </label>
              <input
                id="m-model"
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ej. MT-09 SP"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="m-plate" className="block text-xs font-semibold mb-1">
                Placa
              </label>
              <input
                id="m-plate"
                type="text"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="4821-ZR"
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="m-year" className="block text-xs font-semibold mb-1">
                Año
              </label>
              <input
                id="m-year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="m-cc" className="block text-xs font-semibold mb-1">
                Cilindrada (cc)
              </label>
              <input
                id="m-cc"
                type="number"
                value={cc}
                onChange={(e) => setCc(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="m-color" className="block text-xs font-semibold mb-1">
                Color
              </label>
              <input
                id="m-color"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Negro / Rojo"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="m-km" className="block text-xs font-semibold mb-1">
                Kilometraje actual
              </label>
              <input
                id="m-km"
                type="number"
                min={0}
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMotoModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              Guardar motocicleta
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
