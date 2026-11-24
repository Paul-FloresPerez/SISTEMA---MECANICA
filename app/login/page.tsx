import { redirect } from 'next/navigation';
import { getSession } from '@/src/auth/session';
import { LoginForm } from './form';

export const dynamic = 'force-dynamic';
export default async function LoginPage() {
  if (await getSession()) redirect('/');
  return <main className="flex min-h-screen items-center justify-center bg-[#0F141C] px-5 py-10"><div className="w-full max-w-md"><div className="mb-8 flex items-center justify-center gap-4 text-white"><img src="/images/zona_racing_logo_1795298880163.jpg" alt="" className="h-16 w-16 rounded-xl bg-white object-contain p-1" /><div><h1 className="font-display text-3xl font-bold uppercase tracking-wide">Zona Racing</h1><p className="text-sm text-slate-400">Gestión de taller</p></div></div><section className="rounded-2xl bg-white p-6 shadow-2xl sm:p-9"><h2 className="font-display text-3xl font-bold text-slate-900">Bienvenido</h2><p className="mb-7 mt-2 text-sm text-slate-500">Ingresa a tu cuenta para continuar.</p><LoginForm /></section></div></main>;
}
