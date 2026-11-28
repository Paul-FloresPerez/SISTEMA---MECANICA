import { requireRoute } from '@/src/auth/authorization';
import { RepairDetailPage } from '@/src/screens/RepairDetailPage';

export default async function Page() {
  await requireRoute('/reparaciones/example');
  return <RepairDetailPage />;
}
