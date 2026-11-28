import 'server-only';
import { getSession } from './session';
import { hasPermission, type Permission } from './permissions';
import { canAccessRoute } from './route-policy';
import { redirect } from 'next/navigation';

export async function requireRoute(pathname: string) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.mustChangePassword) redirect('/cambiar-contrasena');
  if (!canAccessRoute(session.role, pathname)) redirect('/mi-cuenta');
  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await getSession();
  if (!session) throw new Error('Sesión requerida.');
  if (session.mustChangePassword) throw new Error('Debes cambiar tu contraseña.');
  if (!hasPermission(session.role, permission)) throw new Error('No tienes permiso para realizar esta operación.');
  return session;
}
