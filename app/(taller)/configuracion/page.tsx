import { SettingsPage } from '@/src/screens/SettingsPage';
import { requireRoute } from '@/src/auth/authorization';
import { listUsers } from '@/src/users/service';

export default async function Page() {
  const session = await requireRoute('/configuracion');
  const canManageUsers = session?.role === 'admin';
  const users = canManageUsers ? await listUsers() : [];
  return <SettingsPage users={users} canManageUsers={canManageUsers} />;
}
