import 'server-only';
import { hash } from '@node-rs/argon2';
import { and, eq } from 'drizzle-orm';
import { requirePermission } from '../auth/authorization';
import { dbQuery, dbTx } from '../db/client';
import { auditLogs, memberships, userCredentials, users } from '../db/schema';

export async function listUsers() {
  const session = await requirePermission('settings:manage');
  return dbQuery.select({ id: users.id, name: users.fullName, username: users.username, email: users.email, role: memberships.role, active: users.isActive }).from(memberships).innerJoin(users, eq(users.id, memberships.userId)).where(and(eq(memberships.organizationId, session.organizationId), eq(memberships.workshopId, session.workshopId), eq(memberships.isActive, true))).orderBy(users.fullName);
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
