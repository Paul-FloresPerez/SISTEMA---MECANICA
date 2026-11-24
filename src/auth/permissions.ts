export type Role = 'admin' | 'workshop_manager' | 'mechanic' | 'cashier';
export type Permission = 'customers:read' | 'customers:write' | 'motorcycles:read' | 'motorcycles:write' | 'repairs:read' | 'repairs:write' | 'inventory:read' | 'inventory:write' | 'sales:read' | 'sales:write' | 'payments:read' | 'payments:write' | 'cash:read' | 'cash:write' | 'purchases:read' | 'purchases:write' | 'profitability:read' | 'settings:manage';

const grants: Record<Exclude<Role, 'admin'>, readonly Permission[]> = {
  workshop_manager: ['customers:read', 'customers:write', 'motorcycles:read', 'motorcycles:write', 'repairs:read', 'repairs:write', 'inventory:read', 'inventory:write', 'sales:read', 'sales:write', 'payments:read', 'payments:write', 'purchases:read', 'purchases:write'],
  mechanic: ['customers:read', 'motorcycles:read', 'repairs:read', 'repairs:write', 'inventory:read'],
  cashier: ['customers:read', 'customers:write', 'motorcycles:read', 'motorcycles:write', 'sales:read', 'sales:write', 'payments:read', 'payments:write', 'cash:read', 'cash:write'],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return role === 'admin' || (grants[role]?.includes(permission) ?? false);
}
