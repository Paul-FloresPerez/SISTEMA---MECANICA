import { SettingsPage } from '@/src/screens/SettingsPage';
import { getSession } from '@/src/auth/session';
import { listUsers } from '@/src/users/service';

export default async function Page() {
  const session = await getSession();
  const canManageUsers = session?.role === 'admin';
  const users = canManageUsers ? await listUsers() : [];
  return <SettingsPage users={users} canManageUsers={canManageUsers} />;
}
