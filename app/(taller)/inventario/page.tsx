import { requireRoute } from '@/src/auth/authorization';
import { InventoryPage } from '@/src/screens/InventoryPage';

export default async function Page() {
  await requireRoute('/inventario');
  return <InventoryPage />;
}
