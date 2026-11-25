import { redirect } from 'next/navigation';
import { getSession } from '@/src/auth/session';
import { AccountPage } from '@/src/screens/AccountPage';

export default async function Page() {
  const session = await getSession();
  if (!session) redirect('/login');
  return <AccountPage name={session.name} role={session.role} />;
}
