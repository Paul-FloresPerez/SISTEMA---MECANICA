'use client';

import React, { useState } from 'react';
import { Building2, CreditCard, Palette, Users, Check, Plus } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { Modal } from '../components/common/Modal';
import type { TeamMember } from '../types/workshop';

type SettingsTab = 'taller' | 'pagos' | 'apariencia' | 'usuarios';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, toggleTheme } = useWorkshop();
  const [tab, setTab] = useState<SettingsTab>('taller');

  const [workshopName, setWorkshopName] = useState(settings.workshopName);
  const [legalName, setLegalName] = useState(settings.legalName);
  const [taxId, setTaxId] = useState(settings.taxId);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [workHours, setWorkHours] = useState(settings.workHours);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<TeamMember['role']>('Mecánico');
  const [memberSpecialty, setMemberSpecialty] = useState('');

  const handleSaveWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      workshopName: workshopName.trim() || 'Zona Racing',
      legalName: legalName.trim(),
      taxId: taxId.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      workHours: workHours.trim(),
      currencySymbol,
    });
  };

  const togglePaymentMethod = (id: string) => {
    updateSettings({
      paymentMethods: settings.paymentMethods.map((m) =>
        m.id === id ? { ...m, enabled: !m.enabled } : m
      ),
    });
  };

  const toggleMemberActive = (id: string) => {
    updateSettings({
      team: settings.team.map((u) => (u.id === id ? { ...u, active: !u.active } : u)),
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim()) return;
    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: memberName.trim(),
      email: memberEmail.trim(),
      role: memberRole,
      specialty: memberSpecialty.trim() || 'Mantenimiento general',
      active: true,
    };
    updateSettings({ team: [...settings.team, newMember] });
    setMemberName('');
    setMemberEmail('');
    setMemberSpecialty('');
    setUserModalOpen(false);
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Settings Tabs */}
      <div className="overflow-x-auto pb-1">
        <div
          role="tablist"
          aria-label="Secciones de configuración"
          className="inline-flex items-center gap-1 p-1 bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-lg"
        >
          {(
            [
              { id: 'taller', label: 'Perfil del taller', Icon: Building2 },
              { id: 'pagos', label: 'Métodos de pago', Icon: CreditCard },
              { id: 'apariencia', label: 'Preferencias y apariencia', Icon: Palette },
              { id: 'usuarios', label: 'Equipo (visual)', Icon: Users },
            ] as { id: SettingsTab; label: string; Icon: React.ComponentType<{ className?: string }> }[]
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                tab === id
                  ? 'bg-slate-900 text-white dark:bg-rose-600'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'taller' && (
        <form
          onSubmit={handleSaveWorkshop}
          className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:p-6 space-y-5"
        >
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Perfil del taller y datos del negocio
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Información comercial utilizada en encabezados y comprobantes demostrativos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cfg-name" className="block text-xs font-semibold mb-1">
                Nombre comercial
              </label>
              <input
                id="cfg-name"
                type="text"
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="cfg-legal" className="block text-xs font-semibold mb-1">
                Razón social
              </label>
              <input
                id="cfg-legal"
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="cfg-tax" className="block text-xs font-semibold mb-1">
                RUC / Identificación fiscal
              </label>
              <input
                id="cfg-tax"
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-num bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="cfg-currency" className="block text-xs font-semibold mb-1">
                Moneda principal
              </label>
              <select
                id="cfg-currency"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="S/">S/ (Soles)</option>
              </select>
            </div>
            <div>
              <label htmlFor="cfg-phone" className="block text-xs font-semibold mb-1">
                Teléfono de contacto
              </label>
              <input
                id="cfg-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="cfg-email" className="block text-xs font-semibold mb-1">
                Correo electrónico
              </label>
              <input
                id="cfg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="cfg-addr" className="block text-xs font-semibold mb-1">
                Dirección del taller
              </label>
              <input
                id="cfg-addr"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="cfg-hours" className="block text-xs font-semibold mb-1">
                Horario de atención
              </label>
              <input
                id="cfg-hours"
                type="text"
                value={workHours}
                onChange={(e) => setWorkHours(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              Guardar perfil del taller
            </button>
          </div>
        </form>
      )}

      {tab === 'pagos' && (
        <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Métodos de pago habilitados
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Activa o desactiva las opciones disponibles en el POS y en el registro de abonos.
            </p>
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {settings.paymentMethods.map((method) => (
              <li key={method.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {method.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {method.accountInfo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePaymentMethod(method.id)}
                  aria-pressed={method.enabled}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    method.enabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {method.enabled ? 'Activo' : 'Inactivo'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'apariencia' && (
        <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Preferencias visuales y apariencia
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personaliza el contraste de la interfaz según la iluminación del taller.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                if (settings.theme !== 'light') toggleTheme();
              }}
              className={`text-left p-4 rounded-xl border transition-colors ${
                settings.theme === 'light'
                  ? 'border-rose-600 bg-rose-50/40 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white">Modo Claro Taller</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Alta legibilidad bajo luz de día o luminarias LED de bahía.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                if (settings.theme !== 'dark') toggleTheme();
              }}
              className={`text-left p-4 rounded-xl border transition-colors ${
                settings.theme === 'dark'
                  ? 'border-rose-600 bg-rose-50/40 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white">Modo Oscuro Carbono</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Superficie oscura para jornadas nocturnas o consulta desde móvil.
              </p>
            </button>
          </div>
        </section>
      )}

      {tab === 'usuarios' && (
        <section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Gestión visual de usuarios y mecánicos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Directorio visual del personal (sin autenticación ni credenciales reales).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Agregar integrante
            </button>
          </div>

          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {settings.team.map((member) => (
              <li
                key={member.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {member.name} · <span className="text-rose-600 dark:text-rose-400">{member.role}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {member.email} · {member.specialty}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleMemberActive(member.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg self-start sm:self-auto ${
                    member.active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {member.active ? 'Activo' : 'Inactivo'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title="Agregar integrante al equipo"
        subtitle="Solo registro visual de demostración (sin acceso por contraseña)"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label htmlFor="usr-name" className="block text-xs font-semibold mb-1">
              Nombre completo
            </label>
            <input
              id="usr-name"
              type="text"
              required
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="usr-role" className="block text-xs font-semibold mb-1">
                Rol
              </label>
              <select
                id="usr-role"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value as TeamMember['role'])}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="Mecánico">Mecánico</option>
                <option value="Jefe de Taller">Jefe de Taller</option>
                <option value="Ventas / Caja">Ventas / Caja</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
            <div>
              <label htmlFor="usr-email" className="block text-xs font-semibold mb-1">
                Correo
              </label>
              <input
                id="usr-email"
                type="email"
                required
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label htmlFor="usr-spec" className="block text-xs font-semibold mb-1">
              Especialidad
            </label>
            <input
              id="usr-spec"
              type="text"
              value={memberSpecialty}
              onChange={(e) => setMemberSpecialty(e.target.value)}
              placeholder="Ej. Inyección electrónica y frenos ABS"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setUserModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
            >
              Agregar integrante
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
