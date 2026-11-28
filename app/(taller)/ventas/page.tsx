import { requireRoute } from '@/src/auth/authorization';
import { SalesPosPage } from '@/src/screens/SalesPosPage';

export default async function Page() {
  await requireRoute('/ventas');
  return <SalesPosPage />;
}
