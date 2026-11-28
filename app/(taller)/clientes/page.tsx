import { ClientsPage } from '@/src/screens/ClientsPage';
import { listCustomers } from '@/src/customers/service';
import { requireRoute } from '@/src/auth/authorization';
import { hasPermission } from '@/src/auth/permissions';

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const session = await requireRoute('/clientes');
  const rawQuery = (await searchParams).q;
  const query = typeof rawQuery === 'string' ? rawQuery.slice(0, 100) : '';
  const customers = await listCustomers(query);
  return <ClientsPage customers={customers} query={query} canWrite={hasPermission(session.role, 'customers:write')} />;
}
