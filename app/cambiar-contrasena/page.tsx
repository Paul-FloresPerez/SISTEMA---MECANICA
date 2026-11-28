import { redirect } from 'next/navigation';
import { getSession } from '@/src/auth/session';
import { AccountPage } from '@/src/screens/AccountPage';
import { logout } from '@/app/login/actions';

export const dynamic = 'force-dynamic';
export default async function Page() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.mustChangePassword) redirect('/');
  return <main className="min-h-screen bg-[#F5F6F8] p-4 sm:p-8"><div className="mx-auto max-w-3xl space-y-4"><h1 className="font-display text-2xl font-bold">ZONA RACING</h1><p className="text-sm text-slate-700">Debes cambiar la contraseña temporal para acceder al taller.</p><AccountPage name={session.name} role={session.role} /><form action={logout}><button className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600">Cerrar sesión</button></form></div></main>;
}
