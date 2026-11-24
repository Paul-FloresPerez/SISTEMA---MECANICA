'use client';
import { useActionState, useState } from 'react';
import { login } from './actions';

export function LoginForm() {
  const [error, action, pending] = useActionState(login, '');
  const [showPassword, setShowPassword] = useState(false);
  return <form action={action} className="space-y-5">
    <div><label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">Nombre de usuario</label><input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={64} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20" placeholder="Tu usuario" /></div>
    <div><label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</label><div className="relative"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required maxLength={1024} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-24 text-base outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-controls="password" aria-pressed={showPassword} className="absolute inset-y-0 right-0 min-w-20 px-3 text-sm font-semibold text-rose-700">{showPassword ? 'Ocultar' : 'Mostrar'}</button></div></div>
    {error && <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <button disabled={pending} className="min-h-12 w-full rounded-xl bg-rose-600 px-4 py-3 font-bold text-white transition hover:bg-rose-700 disabled:opacity-60">{pending ? 'Ingresando…' : 'Iniciar sesión'}</button>
  </form>;
}
