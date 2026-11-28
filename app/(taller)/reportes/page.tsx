import { requireRoute } from '@/src/auth/authorization';
import { ReportsPage } from '@/src/screens/ReportsPage';

export default async function Page() {
  await requireRoute('/reportes');
  return <ReportsPage />;
}
