import { requireRoute } from '@/src/auth/authorization';
import { NewRepairPage } from '@/src/screens/NewRepairPage';

export default async function Page() {
  await requireRoute('/reparaciones/nueva');
  return <NewRepairPage />;
}
