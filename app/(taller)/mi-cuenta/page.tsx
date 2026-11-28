import { requireRoute } from '@/src/auth/authorization';
import { AccountPage } from '@/src/screens/AccountPage';

export default async function Page() {
  const session = await requireRoute('/mi-cuenta');
  return <AccountPage name={session.name} role={session.role} />;
}
