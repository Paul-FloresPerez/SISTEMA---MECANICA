import { requireRoute } from '@/src/auth/authorization';
import { canAccessRoute } from '@/src/auth/route-policy';
import { RepairsPage } from '@/src/screens/RepairsPage';

export default async function Page() {
  const session = await requireRoute('/reparaciones');
  return <RepairsPage canCreate={canAccessRoute(session.role, '/reparaciones/nueva')} />;
}
