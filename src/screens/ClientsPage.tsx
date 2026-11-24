'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bike, Plus, Search, User, ArrowRight } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { getCurrentYear } from '../utils/calculations';

export const ClientsPage: React.FC = () => {
  const { customers, motorcycles, repairs, addCustomer, addMotorcycle } = useWorkshop();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [newClientModal, setNewClientModal] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [notes, setNotes] = useState('');

  // Optional initial motorcycle on new client
  const [addInitialMoto, setAddInitialMoto] = useState(true);
  const [motoBrand, setMotoBrand] = useState('');
  const [motoModel, setMotoModel] = useState('');
  const [motoYear, setMotoYear] = useState(() => getCurrentYear());
  const [motoPlate, setMotoPlate] = useState('');
  const [motoCc, setMotoCc] = useState(300);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const custMotos = motorcycles
        .filter((m) => m.customerId === c.id)
        .map((m) => `${m.brand} ${m.model} ${m.plate}`)
        .join(' ');
      return `${c.name} ${c.phone} ${c.documentId} ${custMotos}`
        .toLowerCase()
        .includes(q);
    });
  }, [customers, motorcycles, search]);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const created = addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      documentId: documentId.trim() || 'Sin documento',
      notes: notes.trim() || undefined,
    });

    if (addInitialMoto && motoBrand.trim() && motoModel.trim()) {
      addMotorcycle({
        customerId: created.id,
        brand: motoBrand.trim(),
        model: motoModel.trim(),
        year: motoYear,
        plate: motoPlate.trim().toUpperCase() || 'SIN-PLACA',
        displacementCc: motoCc,
        color: 'Por definir',
        mileageKm: 0,
      });
    }

    setName('');
    setPhone('');
    setEmail('');
    setDocumentId('');
    setNotes('');
    setMotoBrand('');
    setMotoModel('');
    setMotoPlate('');
    setNewClientModal(false);
    router.push(`/clientes/${created.id}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <label htmlFor="client-search" className="sr-only">
            Buscar cliente por nombre, teléfono, documento o placa
          </label>
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="client-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente, teléfono, moto o placa..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg"
          />
        </div>

        <button
          type="button"
          onClick={() => setNewClientModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg whitespace-nowrap min-h-[40px]"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Nuevo cliente
        </button>
      </div>

      {filteredClients.length === 0 ? (
        <EmptyState
          icon={User}
          title="No se encontraron clientes"
          description="Registra a un nuevo cliente y vincula una o varias motocicletas a su perfil."
          actionLabel="Nuevo cliente"
          onAction={() => setNewClientModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const clientMotos = motorcycles.filter((m) => m.customerId === client.id);
            const clientRepairs = repairs.filter((r) => r.customerId === client.id);

            return (
              <div
                key={client.id}
                className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        {client.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {client.phone} · Doc. {client.documentId}
                      </p>
                    </div>
                    <span className="font-mono-num text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {clientRepairs.length} orden(es)
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Motocicletas registradas ({clientMotos.length})
                    </p>
                    {clientMotos.length === 0 ? (
                      <p className="text-xs text-slate-400">Sin motocicletas vinculadas</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {clientMotos.map((m) => (
                          <li
                            key={m.id}
                            className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                          >
                            <span className="inline-flex items-center gap-1.5 truncate">
                              <Bike className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
                              <span className="truncate">
                                {m.brand} {m.model} ({m.year})
                              </span>
                            </span>
                            <span className="font-mono-num text-[11px] text-slate-500 shrink-0 ml-2">
                              {m.plate}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/clientes/${client.id}`)}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#0F141C] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  Ver perfil y garaje
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      <Modal
        open={newClientModal}
        onClose={() => setNewClientModal(false)}
        title="Registrar nuevo cliente"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cli-name" className="block text-xs font-semibold mb-1">
                Nombre completo
              </label>
              <input
                id="cli-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="cli-phone" className="block text-xs font-semibold mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                id="cli-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cli-doc" className="block text-xs font-semibold mb-1">
                DNI / Documento
              </label>
              <input
                id="cli-doc"
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="cli-email" className="block text-xs font-semibold mb-1">
                Correo electrónico
              </label>
              <input
                id="cli-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label htmlFor="cli-notes" className="block text-xs font-semibold mb-1">
              Notas del cliente (opcional)
            </label>
            <input
              id="cli-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={addInitialMoto}
                onChange={(e) => setAddInitialMoto(e.target.checked)}
                className="rounded border-slate-300 text-rose-600"
              />
              Registrar primera motocicleta ahora
            </label>

            {addInitialMoto && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label htmlFor="im-brand" className="block text-[11px] text-slate-500 mb-1">
                    Marca
                  </label>
                  <input
                    id="im-brand"
                    type="text"
                    value={motoBrand}
                    onChange={(e) => setMotoBrand(e.target.value)}
                    placeholder="Yamaha"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="im-model" className="block text-[11px] text-slate-500 mb-1">
                    Modelo
                  </label>
                  <input
                    id="im-model"
                    type="text"
                    value={motoModel}
                    onChange={(e) => setMotoModel(e.target.value)}
                    placeholder="R3 / MT-03"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="im-plate" className="block text-[11px] text-slate-500 mb-1">
                    Placa
                  </label>
                  <input
                    id="im-plate"
                    type="text"
                    value={motoPlate}
                    onChange={(e) => setMotoPlate(e.target.value)}
                    placeholder="9921-ZR"
                    className="w-full px-2.5 py-1.5 text-xs font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="im-year" className="block text-[11px] text-slate-500 mb-1">
                    Año
                  </label>
                  <input
                    id="im-year"
                    type="number"
                    value={motoYear}
                    onChange={(e) => setMotoYear(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="im-cc" className="block text-[11px] text-slate-500 mb-1">
                    Cilindrada (cc)
                  </label>
                  <input
                    id="im-cc"
                    type="number"
                    value={motoCc}
                    onChange={(e) => setMotoCc(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewClientModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              Guardar cliente
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
