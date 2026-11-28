import { requireRoute } from '@/src/auth/authorization';
import { DashboardPage } from '@/src/screens/DashboardPage';

export default async function Page() {
  const session = await requireRoute('/');
  return <DashboardPage role={session.role} />;
}
