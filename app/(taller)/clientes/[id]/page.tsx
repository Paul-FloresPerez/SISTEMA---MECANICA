import { ClientDetailPage } from '@/src/screens/ClientDetailPage';
import { getCustomer } from '@/src/customers/service';
import { requirePermission } from '@/src/auth/authorization';
import { hasPermission } from '@/src/auth/permissions';
import { notFound } from 'next/navigation';
import { listMotorcycles } from '@/src/motorcycles/service';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('customers:read');
  const customer = await getCustomer((await params).id);
  if (!customer) notFound();
  const motorcycles = await listMotorcycles(customer.id);
  return <ClientDetailPage customer={customer} canWrite={hasPermission(session.role, 'customers:write')} motorcycles={motorcycles} canWriteMotorcycles={hasPermission(session.role, 'motorcycles:write')} />;
}
