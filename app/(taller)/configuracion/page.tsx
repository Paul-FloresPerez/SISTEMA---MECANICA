import { SettingsPage } from '@/src/screens/SettingsPage';
import { getSession } from '@/src/auth/session';
import { listUsers } from '@/src/users/service';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/');
  const canManageUsers = session?.role === 'admin';
  const users = canManageUsers ? await listUsers() : [];
  return <SettingsPage users={users} canManageUsers={canManageUsers} />;
}
