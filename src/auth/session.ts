import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { dbQuery, dbTx } from '../db/client';
import { memberships, sessions, userCredentials, users, workshops } from '../db/schema';

const cookieName = process.env.NODE_ENV === 'production' ? '__Host-zr_session' : 'zr_session';
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function getSession() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const rows = await dbQuery.select({ sessionId: sessions.id, userId: users.id, name: users.fullName, organizationId: memberships.organizationId, workshopId: workshops.id, role: memberships.role, mustChangePassword: userCredentials.mustChangePassword })
    .from(sessions)
    .innerJoin(users, and(eq(users.id, sessions.userId), eq(users.isActive, true)))
    .innerJoin(userCredentials, eq(userCredentials.userId, users.id))
    .innerJoin(memberships, and(eq(memberships.userId, sessions.userId), eq(memberships.organizationId, sessions.organizationId), eq(memberships.workshopId, sessions.workshopId), eq(memberships.isActive, true)))
    .innerJoin(workshops, and(eq(workshops.id, sessions.workshopId), eq(workshops.organizationId, sessions.organizationId), eq(workshops.isActive, true)))
    .where(and(eq(sessions.tokenHash, hashToken(token)), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()))).limit(1);
  return rows[0] ?? null;
}

export function newSessionToken() {
  return { token: randomBytes(32).toString('hex'), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt });
}

export async function revokeSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) await dbTx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, hashToken(token)));
  jar.delete(cookieName);
}
