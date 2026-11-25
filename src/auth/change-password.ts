import 'server-only';
import { hash, verify } from '@node-rs/argon2';
import { and, eq, gt, isNull, ne } from 'drizzle-orm';
import { dbTx } from '../db/client';
import { auditLogs, memberships, sessions, userCredentials, users, workshops } from '../db/schema';
import { getSession } from './session';
import { isValidPassword } from './password-policy';

export async function changePassword(current: unknown, next: unknown) {
  if (typeof current !== 'string' || current.length === 0 || current.length > 1024 || !isValidPassword(next) || current === next) throw new Error('Contraseña inválida.');
  const session = await getSession();
  if (!session) throw new Error('Sesión requerida.');
  return changePasswordForSession(session, current, next);
}

/** Session identity is always revalidated against the database before writing. */
export async function changePasswordForSession(session: NonNullable<Awaited<ReturnType<typeof getSession>>>, current: string, next: string) {
  if (!isValidPassword(next) || !current || current.length > 1024 || current === next) throw new Error('Contraseña inválida.');
  const newHash = await hash(next, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const changed = await dbTx.transaction(async tx => {
    const [credential] = await tx.select({ passwordHash: userCredentials.passwordHash, failedAttempts: userCredentials.failedAttempts, lockedUntil: userCredentials.lockedUntil }).from(userCredentials).where(eq(userCredentials.userId, session.userId)).for('update');
    const [active] = await tx.select({ id: sessions.id }).from(sessions).innerJoin(users, and(eq(users.id, sessions.userId), eq(users.isActive, true))).innerJoin(memberships, and(eq(memberships.userId, sessions.userId), eq(memberships.organizationId, sessions.organizationId), eq(memberships.workshopId, sessions.workshopId), eq(memberships.isActive, true))).innerJoin(workshops, and(eq(workshops.id, sessions.workshopId), eq(workshops.organizationId, sessions.organizationId), eq(workshops.isActive, true))).where(and(eq(sessions.id, session.sessionId), eq(sessions.userId, session.userId), eq(sessions.organizationId, session.organizationId), eq(sessions.workshopId, session.workshopId), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()))).limit(1);
    if (!credential || !active || (credential.lockedUntil && credential.lockedUntil > new Date())) return false;
    if (!(await verify(credential.passwordHash, current))) {
      const attempts = credential.failedAttempts + 1;
      await tx.update(userCredentials).set({ failedAttempts: attempts >= 5 ? 0 : attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null }).where(eq(userCredentials.userId, session.userId));
      return false;
    }
    await tx.update(userCredentials).set({ passwordHash: newHash, passwordChangedAt: new Date(), failedAttempts: 0, lockedUntil: null }).where(eq(userCredentials.userId, session.userId));
    await tx.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, session.userId), ne(sessions.id, session.sessionId), isNull(sessions.revokedAt)));
    await tx.insert(auditLogs).values({ organizationId: session.organizationId, workshopId: session.workshopId, actorUserId: session.userId, action: 'user.password_changed', entityType: 'user', entityId: session.userId });
    return true;
  });
  if (!changed) throw new Error('No se pudo verificar la contraseña actual.');
}
