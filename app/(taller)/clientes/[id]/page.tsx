import { ClientDetailPage } from '@/src/screens/ClientDetailPage';
import { getCustomer } from '@/src/customers/service';
import { requirePermission } from '@/src/auth/authorization';
import { hasPermission } from '@/src/auth/permissions';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('customers:read');
  const customer = await getCustomer((await params).id);
  if (!customer) notFound();
  return <ClientDetailPage customer={customer} canWrite={hasPermission(session.role, 'customers:write')} />;
}
