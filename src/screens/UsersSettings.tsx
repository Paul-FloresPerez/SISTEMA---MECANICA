'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { createUserAction, updateUserAction, resetPasswordAction } from '@/app/(taller)/configuracion/user-actions';

type UserItem = { id: string; name: string; username: string; email: string | null; role: 'admin' | 'workshop_manager' | 'mechanic' | 'cashier'; active: boolean };
const labels = { admin: 'Administrador', workshop_manager: 'Jefe de Taller', mechanic: 'Mecánico', cashier: 'Ventas / Caja' };
const field = 'w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0F141C] border border-slate-200 dark:border-slate-700 rounded-lg';

export function UsersSettings({ users }: { users: UserItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [resetting, setResetting] = useState<UserItem | null>(null);
  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending || !resetting) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') ?? '');
    if (password !== String(data.get('confirmation') ?? '')) { setError('Las contraseñas no coinciden.'); return; }
    setPending(true); setError('');
    try {
      const result = await resetPasswordAction(resetting.id, password);
      if (result.error) { setError(result.error); return; }
      setResetting(null); setSuccess('Contraseña temporal asignada. Las sesiones del usuario se cerraron.'); router.refresh();
    } catch { setError('No se pudo conectar. Intenta nuevamente.'); } finally { setPending(false); }
  }
  async function edit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending || !editing) return;
    const data = new FormData(event.currentTarget);
    setPending(true); setError('');
    try {
      const result = await updateUserAction({ id: editing.id, name: String(data.get('name') ?? ''), email: String(data.get('email') ?? ''), role: String(data.get('role') ?? ''), active: data.get('active') === 'true' });
      if (result.error) { setError(result.error); return; }
      setEditing(null); setSuccess('Cuenta actualizada correctamente.'); router.refresh();
    } catch { setError('No se pudo conectar. Intenta nuevamente.'); } finally { setPending(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? '');
    if (value('password') !== value('confirmation')) { setError('Las contraseñas no coinciden.'); return; }
    setPending(true); setError('');
    try {
      const result = await createUserAction({ name: value('name'), username: value('username'), email: value('email'), password: value('password'), role: value('role') });
      if (result.error) { setError(result.error); return; }
      setOpen(false); setSuccess('Cuenta creada correctamente.'); router.refresh();
    } catch { setError('No se pudo conectar. Intenta nuevamente.'); } finally { setPending(false); }
  }
  return <><section className="bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-800 rounded-xl p-5 lg:p-6 space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900 dark:text-white">Usuarios del taller</h2><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cuentas con acceso a este taller.</p></div><button type="button" onClick={() => { setError(''); setOpen(true); }} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"><Plus className="w-3.5 h-3.5" aria-hidden="true" />Agregar integrante</button></div>
  {success && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">{success}</p>}
  {users.length === 0 ? <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">No hay usuarios registrados en este taller.</p> : <ul className="divide-y divide-slate-100 dark:divide-slate-800">{users.map(user => <li key={user.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="text-sm font-bold text-slate-900 dark:text-white">{user.name} · <span className="text-rose-600 dark:text-rose-400">{labels[user.role]}</span></p><p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}{user.email ? ` · ${user.email}` : ''}</p></div><div className="flex items-center gap-3"><span className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${user.active ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{user.active ? 'Activo' : 'Inactivo'}</span><button onClick={() => { setError(''); setResetting(user); }} className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">Restablecer contraseña</button><button onClick={() => { setError(''); setEditing(user); }} className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">Editar</button></div></li>)}</ul>}</section>
  <Modal open={!!resetting} onClose={() => { if (!pending) setResetting(null); }} title="Restablecer contraseña">{resetting && <form key={resetting.id} onSubmit={resetPassword} className="space-y-4"><p className="text-xs text-slate-500 dark:text-slate-400">Se cerrarán todas las sesiones de @{resetting.username}. Deberá cambiar la contraseña temporal al ingresar.</p><label className="block text-xs font-semibold">Contraseña temporal (mínimo 12 caracteres)<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={1024} className={`${field} mt-1`} /></label><label className="block text-xs font-semibold">Repetir contraseña<input name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={1024} className={`${field} mt-1`} /></label>{error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}<div className="flex justify-end gap-2 pt-2"><button type="button" disabled={pending} onClick={() => setResetting(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg">Cancelar</button><button disabled={pending} className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50">{pending ? 'Guardando…' : 'Restablecer'}</button></div></form>}</Modal>
  <Modal open={!!editing} onClose={() => { if (!pending) setEditing(null); }} title="Editar integrante">{editing && <form key={editing.id} onSubmit={edit} className="space-y-4"><p className="text-xs text-slate-500">Usuario: @{editing.username}</p><label className="block text-xs font-semibold">Nombre completo<input name="name" required minLength={2} maxLength={160} defaultValue={editing.name} className={`${field} mt-1`} /></label><label className="block text-xs font-semibold">Correo (opcional)<input name="email" type="email" maxLength={320} defaultValue={editing.email ?? ''} className={`${field} mt-1`} /></label><label className="block text-xs font-semibold">Rol<select name="role" defaultValue={editing.role} className={`${field} mt-1`}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-xs font-semibold">Estado<select name="active" defaultValue={String(editing.active)} className={`${field} mt-1`}><option value="true">Activo</option><option value="false">Inactivo</option></select></label><p className="text-xs text-slate-500">Cambiar el rol o desactivar la cuenta cierra sus sesiones activas.</p>{error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}<div className="flex justify-end gap-2 pt-2"><button type="button" disabled={pending} onClick={() => setEditing(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg">Cancelar</button><button disabled={pending} className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50">{pending ? 'Guardando…' : 'Guardar cambios'}</button></div></form>}</Modal>
  <Modal open={open} onClose={() => { if (!pending) setOpen(false); }} title="Agregar integrante al equipo"><form onSubmit={submit} className="space-y-4"><label className="block text-xs font-semibold">Nombre completo<input name="name" required minLength={2} maxLength={160} className={`${field} mt-1`} /></label><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="block text-xs font-semibold">Usuario<input name="username" required minLength={3} maxLength={64} autoCapitalize="none" autoComplete="off" pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,63}" className={`${field} mt-1`} /></label><label className="block text-xs font-semibold">Rol<select name="role" className={`${field} mt-1`} defaultValue="mechanic">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><label className="block text-xs font-semibold">Correo (opcional)<input name="email" type="email" maxLength={320} className={`${field} mt-1`} /></label><label className="block text-xs font-semibold">Contraseña temporal (mínimo 12 caracteres)<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={1024} className={`${field} mt-1`} /></label><label className="block text-xs font-semibold">Repetir contraseña<input name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={1024} className={`${field} mt-1`} /></label>{error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}<div className="flex justify-end gap-2 pt-2"><button type="button" disabled={pending} onClick={() => setOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 rounded-lg">Cancelar</button><button disabled={pending} className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50">{pending ? 'Guardando…' : 'Agregar integrante'}</button></div></form></Modal></>;
}
