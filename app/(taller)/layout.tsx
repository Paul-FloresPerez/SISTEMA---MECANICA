import { redirect } from 'next/navigation';
import { getSession } from '@/src/auth/session';
import { WorkshopProvider } from '@/src/context/WorkshopContext';
import { MainLayout } from '@/src/layouts/MainLayout';

export const dynamic = 'force-dynamic';
export default async function TallerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.mustChangePassword) redirect('/cambiar-contrasena');
  return <WorkshopProvider><MainLayout role={session.role}>{children}</MainLayout></WorkshopProvider>;
}
