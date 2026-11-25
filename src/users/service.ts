import 'server-only';
import { hash } from '@node-rs/argon2';
import { and, eq, sql, isNull } from 'drizzle-orm';
import { requirePermission } from '../auth/authorization';
import { dbQuery, dbTx } from '../db/client';
import { auditLogs, memberships, organizations, sessions, userCredentials, users } from '../db/schema';

export async function listUsers() {
  const session = await requirePermission('settings:manage');
  return dbQuery.select({ id: users.id, name: users.fullName, username: users.username, email: users.email, role: memberships.role, active: sql<boolean>`${memberships.isActive} AND ${users.isActive}` }).from(memberships).innerJoin(users, eq(users.id, memberships.userId)).where(and(eq(memberships.organizationId, session.organizationId), eq(memberships.workshopId, session.workshopId))).orderBy(users.fullName);
}

export async function updateUser(input: { id: string; name: string; email: string; role: string; active: boolean }) {
  const session = await requirePermission('settings:manage');
  if (!input || typeof input !== 'object' || typeof input.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id) || typeof input.name !== 'string' || typeof input.email !== 'string' || typeof input.role !== 'string' || typeof input.active !== 'boolean') throw new Error('Datos inválidos.');
  const name = input.name.trim(), email = input.email.trim().toLowerCase();
  const roles = ['admin', 'workshop_manager', 'mechanic', 'cashier'] as const;
  if (name.length < 2 || name.length > 160 || email.length > 320 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || !roles.includes(input.role as typeof roles[number])) throw new Error('Datos inválidos.');
  await dbTx.transaction(async tx => {
    await tx.select({ id: organizations.id }).from(organizations).where(eq(organizations.id, session.organizationId)).for('update');
    const [actor] = await tx.select({ role: memberships.role, membershipActive: memberships.isActive, userActive: users.isActive }).from(memberships).innerJoin(users, eq(users.id, memberships.userId)).where(and(eq(memberships.organizationId, session.organizationId), eq(memberships.workshopId, session.workshopId), eq(memberships.userId, session.userId))).limit(1);
    if (!actor || actor.role !== 'admin' || !actor.membershipActive || !actor.userActive) throw new Error('Sin autorización.');
    const [target] = await tx.select({ role: memberships.role, active: memberships.isActive, userActive: users.isActive, name: users.fullName, email: users.email }).from(memberships).innerJoin(users, eq(users.id, memberships.userId)).where(and(eq(memberships.organizationId, session.organizationId), eq(memberships.workshopId, session.workshopId), eq(memberships.userId, input.id))).limit(1).for('update');
    if (!target) throw new Error('Usuario no encontrado.');
    if (input.id === session.userId && (!input.active || input.role !== 'admin')) throw new Error('No puedes desactivar ni degradar tu propia cuenta.');
    if (!target.userActive && input.active) throw new Error('La cuenta global está inactiva.');
    if (target.name !== name || (target.email ?? '') !== email) {
      const affiliations = await tx.select({ id: memberships.id }).from(memberships).where(eq(memberships.userId, input.id)).limit(2);
      if (affiliations.length > 1) throw new Error('El perfil compartido no puede modificarse desde un taller.');
    }
    if (target.role === 'admin' && target.active && target.userActive && (!input.active || input.role !== 'admin')) {
      const admins = await tx.select({ id: memberships.id }).from(memberships).innerJoin(users, eq(users.id, memberships.userId)).where(and(eq(memberships.organizationId, session.organizationId), eq(memberships.workshopId, session.workshopId), eq(memberships.role, 'admin'), eq(memberships.isActive, true), eq(users.isActive, true)));
      if (admins.length <= 1) throw new Error('Debe quedar al menos un administrador activo.');
    }
    await tx.update(users).set({ fullName: name, email: email || null, updatedAt: new Date() }).where(eq(users.id, input.id));
    await tx.update(memberships).set({ role: input.role as typeof roles[number], isActive: input.active, updatedAt: new Date() }).where(and(eq(memberships.organizationId, session.organizationId), eq(memberships.workshopId, session.workshopId), eq(memberships.userId, input.id)));
    if (target.role !== input.role || (target.active && !input.active)) await tx.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, input.id), eq(sessions.organizationId, session.organizationId), isNull(sessions.revokedAt)));
    await tx.insert(auditLogs).values({ organizationId: session.organizationId, workshopId: session.workshopId, actorUserId: session.userId, action: 'user.updated', entityType: 'user', entityId: input.id, metadata: { previousRole: target.role, role: input.role, previousActive: target.active, active: input.active } });
  });
}

export async function createUser(input: { name: string; username: string; email: string; password: string; role: string }) {
  const session = await requirePermission('settings:manage');
  if (!input || typeof input !== 'object' || ['name', 'username', 'email', 'password', 'role'].some(key => typeof (input as unknown as Record<string, unknown>)[key] !== 'string')) throw new Error('Datos inválidos.');
  const name = input.name.trim(), username = input.username.trim().toLowerCase(), email = input.email.trim().toLowerCase();
  const roles = ['admin', 'workshop_manager', 'mechanic', 'cashier'] as const;
  if (name.length < 2 || name.length > 160 || !/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username) || email.length > 320 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || input.password.length < 12 || input.password.length > 1024 || !roles.includes(input.role as typeof roles[number])) throw new Error('Datos inválidos.');
  const passwordHash = await hash(input.password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  await dbTx.transaction(async tx => {
    const [user] = await tx.insert(users).values({ fullName: name, username, email: email || null }).returning({ id: users.id });
    await tx.insert(userCredentials).values({ userId: user.id, passwordHash });
    await tx.insert(memberships).values({ userId: user.id, organizationId: session.organizationId, workshopId: session.workshopId, role: input.role as typeof roles[number] });
    await tx.insert(auditLogs).values({ organizationId: session.organizationId, workshopId: session.workshopId, actorUserId: session.userId, action: 'user.created', entityType: 'user', entityId: user.id });
  });
}
