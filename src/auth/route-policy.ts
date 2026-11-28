import { hasPermission, type Permission, type Role } from './permissions';

/** Server and navigation must use the same policy. Unknown routes fail closed. */
export function permissionForRoute(pathname: string): Permission | 'authenticated' | null {
  if (pathname === '/' || pathname === '/mi-cuenta') return 'authenticated';
  if (pathname === '/reparaciones/nueva') return 'repairs:write';
  if (pathname === '/reparaciones' || pathname.startsWith('/reparaciones/')) return 'repairs:read';
  if (pathname === '/clientes' || pathname.startsWith('/clientes/')) return 'customers:read';
  if (pathname === '/inventario' || pathname.startsWith('/inventario/')) return 'inventory:read';
  if (pathname === '/ventas' || pathname.startsWith('/ventas/')) return 'sales:read';
  if (pathname === '/compras-gastos' || pathname.startsWith('/compras-gastos/')) return 'purchases:read';
  if (pathname === '/reportes' || pathname.startsWith('/reportes/')) return 'profitability:read';
  if (pathname === '/configuracion' || pathname.startsWith('/configuracion/')) return 'settings:manage';
  return null;
}

export function canAccessRoute(role: Role, pathname: string): boolean {
  const permission = permissionForRoute(pathname);
  return permission === 'authenticated' || (permission !== null && hasPermission(role, permission));
}
