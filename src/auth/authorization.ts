import 'server-only';
import { getSession } from './session';
import { hasPermission, type Permission } from './permissions';

export async function requirePermission(permission: Permission) {
  const session = await getSession();
  if (!session) throw new Error('Sesión requerida.');
  if (session.mustChangePassword) throw new Error('Debes cambiar tu contraseña.');
  if (!hasPermission(session.role, permission)) throw new Error('No tienes permiso para realizar esta operación.');
  return session;
}
