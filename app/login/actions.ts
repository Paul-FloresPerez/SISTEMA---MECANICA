'use server';
import { verify } from '@node-rs/argon2';
import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { dbTx } from '@/src/db/client';
import { memberships, sessions, userCredentials, users, workshops } from '@/src/db/schema';
import { hashToken, newSessionToken, setSessionCookie, revokeSession } from '@/src/auth/session';

export async function login(_state: string, formData: FormData): Promise<string> {
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username) || !password || password.length > 1024) return 'Usuario o contraseña incorrectos.';
  const { token, expiresAt } = newSessionToken();
  const identity = await dbTx.transaction(async (tx) => {
    const rows = await tx.select({ userId: users.id, active: users.isActive, hash: userCredentials.passwordHash, mustChangePassword: userCredentials.mustChangePassword, attempts: userCredentials.failedAttempts, lockedUntil: userCredentials.lockedUntil, organizationId: memberships.organizationId, workshopId: memberships.workshopId })
      .from(userCredentials).innerJoin(users, eq(users.id, userCredentials.userId))
      .innerJoin(memberships, and(eq(memberships.userId, users.id), eq(memberships.isActive, true)))
      .innerJoin(workshops, and(eq(workshops.id, memberships.workshopId), eq(workshops.organizationId, memberships.organizationId), eq(workshops.isActive, true)))
      .where(eq(users.username, username)).limit(1).for('update', { of: userCredentials });
    const row = rows[0];
    if (!row || !row.active || !row.workshopId || (row.lockedUntil && row.lockedUntil > new Date())) return null;
    let valid = false;
    try { valid = await verify(row.hash, password); } catch { valid = false; }
    if (!valid) {
      const attempts = row.attempts + 1;
      await tx.update(userCredentials).set({ failedAttempts: attempts >= 5 ? 0 : attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null }).where(eq(userCredentials.userId, row.userId));
      return null;
    }
    await tx.update(userCredentials).set({ failedAttempts: 0, lockedUntil: null }).where(eq(userCredentials.userId, row.userId));
    await tx.insert(sessions).values({ userId: row.userId, organizationId: row.organizationId, workshopId: row.workshopId, tokenHash: hashToken(token), expiresAt });
    return { mustChangePassword: row.mustChangePassword };
  });
  if (!identity) return 'Usuario o contraseña incorrectos, o acceso temporalmente bloqueado.';
  await setSessionCookie(token, expiresAt);
  redirect(identity.mustChangePassword ? '/cambiar-contrasena' : '/');
}

export async function logout() {
  await revokeSession();
  redirect('/login');
}
