import { requireRoute } from '@/src/auth/authorization';
import { PurchasesExpensesPage } from '@/src/screens/PurchasesExpensesPage';

export default async function Page() {
  await requireRoute('/compras-gastos');
  return <PurchasesExpensesPage />;
}
