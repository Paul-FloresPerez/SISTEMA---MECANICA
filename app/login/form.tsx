'use client';
import { useActionState } from 'react';
import { login } from './actions';

export function LoginForm() {
  const [error, action, pending] = useActionState(login, '');
  return <form action={action} className="space-y-5">
    <div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={320} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20" placeholder="tu@correo.com" /></div>
    <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={1024} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20" /></div>
    {error && <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <button disabled={pending} className="min-h-12 w-full rounded-xl bg-rose-600 px-4 py-3 font-bold text-white transition hover:bg-rose-700 disabled:opacity-60">{pending ? 'Ingresando…' : 'Iniciar sesión'}</button>
  </form>;
}
