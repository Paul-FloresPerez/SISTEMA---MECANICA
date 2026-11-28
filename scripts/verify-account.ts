import nextEnv from '@next/env';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { hash, verify } from '@node-rs/argon2';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import ws from 'ws';

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL_UNPOOLED) throw new Error('Faltan las conexiones de desarrollo.');
neonConfig.webSocketConstructor = ws;
const { changePasswordForSession } = await import('../src/auth/change-password');
const { resetUserPasswordForSession } = await import('../src/users/service');
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED, max: 1 });
const client = await pool.connect();
const org = randomUUID(), workshop = randomUUID(), user = randomUUID(), admin = randomUUID(), adminSession = randomUUID(), s1 = randomUUID(), s2 = randomUUID();
const old = 'Test-old-password-142!', nextA = 'Test-new-password-142!', nextB = 'Test-new-password-143!';
let created = false;
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO organizations(id,name) VALUES($1,$2)', [org, 'TEST ACCOUNT INTEGRATION']);
  await client.query('INSERT INTO workshops(id,organization_id,name) VALUES($1,$2,$3)', [workshop, org, 'TEST ACCOUNT INTEGRATION']);
  await client.query('INSERT INTO users(id,full_name,username) VALUES($1,$2,$3)', [user, 'TEST ACCOUNT INTEGRATION', `test-${user}`]);
  await client.query('INSERT INTO users(id,full_name,username) VALUES($1,$2,$3)', [admin, 'TEST ACCOUNT INTEGRATION', `test-${admin}`]);
  await client.query('INSERT INTO user_credentials(user_id,password_hash) VALUES($1,$2)', [user, await hash(old, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 })]);
  await client.query('INSERT INTO user_credentials(user_id,password_hash) VALUES($1,$2)', [admin, await hash(old, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 })]);
  await client.query("INSERT INTO memberships(user_id,organization_id,workshop_id,role) VALUES($1,$2,$3,'mechanic')", [user, org, workshop]);
  await client.query("INSERT INTO memberships(user_id,organization_id,workshop_id,role) VALUES($1,$2,$3,'admin')", [admin, org, workshop]);
  await client.query("INSERT INTO sessions(id,user_id,organization_id,workshop_id,token_hash,expires_at) VALUES($1,$3,$4,$5,$6,now()+interval '1 day'),($2,$3,$4,$5,$7,now()+interval '1 day')", [s1, s2, user, org, workshop, randomUUID(), randomUUID()]);
  await client.query("INSERT INTO sessions(id,user_id,organization_id,workshop_id,token_hash,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '1 day')", [adminSession, admin, org, workshop, randomUUID()]);
  await client.query('COMMIT'); created = true;
  const session = { sessionId: s1, userId: user, name: 'TEST ACCOUNT INTEGRATION', organizationId: org, workshopId: workshop, role: 'mechanic' as const, mustChangePassword: false };
  await assert.rejects(changePasswordForSession(session, 'wrong-password', nextA));
  let result = await client.query('SELECT failed_attempts FROM user_credentials WHERE user_id=$1', [user]);
  assert.equal(result.rows[0].failed_attempts, 1);
  const attempts = await Promise.allSettled([changePasswordForSession(session, old, nextA), changePasswordForSession({ ...session, sessionId: s2 }, old, nextB)]);
  assert.equal(attempts.filter(x => x.status === 'fulfilled').length, 1);
  result = await client.query('SELECT password_hash, failed_attempts FROM user_credentials WHERE user_id=$1', [user]);
  assert.equal(await verify(result.rows[0].password_hash, old), false);
  assert.equal((await verify(result.rows[0].password_hash, nextA)) || (await verify(result.rows[0].password_hash, nextB)), true);
  const states = await client.query('SELECT id, revoked_at FROM sessions WHERE user_id=$1', [user]);
  assert.equal(states.rows.filter(row => row.revoked_at === null).length, 1);
  const audit = await client.query("SELECT count(*)::int AS n FROM audit_logs WHERE organization_id=$1 AND entity_id=$2 AND action='user.password_changed'", [org, user]);
  assert.equal(audit.rows[0].n, 1);
  const adminIdentity = { sessionId: adminSession, userId: admin, name: 'TEST ACCOUNT INTEGRATION', organizationId: org, workshopId: workshop, role: 'admin' as const, mustChangePassword: false };
  await assert.rejects(resetUserPasswordForSession(session, user, 'Test-temporary-password-224!'));
  await resetUserPasswordForSession(adminIdentity, user, 'Test-temporary-password-224!');
  result = await client.query('SELECT password_hash, must_change_password FROM user_credentials WHERE user_id=$1', [user]);
  assert.equal(result.rows[0].must_change_password, true);
  assert.equal(await verify(result.rows[0].password_hash, 'Test-temporary-password-224!'), true);
  const revoked = await client.query('SELECT count(*)::int AS n FROM sessions WHERE user_id=$1 AND revoked_at IS NULL', [user]);
  assert.equal(revoked.rows[0].n, 0);
  const resetAudit = await client.query("SELECT count(*)::int AS n FROM audit_logs WHERE organization_id=$1 AND entity_id=$2 AND action='user.password_reset'", [org, user]);
  assert.equal(resetAudit.rows[0].n, 1);
  await assert.rejects(changePasswordForSession(session, 'Test-temporary-password-224!', nextA));
  const forcedSession = randomUUID();
  await client.query("INSERT INTO sessions(id,user_id,organization_id,workshop_id,token_hash,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '1 day')", [forcedSession, user, org, workshop, randomUUID()]);
  await changePasswordForSession({ ...session, sessionId: forcedSession, mustChangePassword: true }, 'Test-temporary-password-224!', nextA);
  result = await client.query('SELECT must_change_password FROM user_credentials WHERE user_id=$1', [user]);
  assert.equal(result.rows[0].must_change_password, false);
  const racing = await Promise.allSettled([
    resetUserPasswordForSession(adminIdentity, user, 'Test-temporary-password-225!'),
    changePasswordForSession({ ...session, sessionId: forcedSession, mustChangePassword: false }, nextA, nextB),
  ]);
  assert.equal(racing[0].status, 'fulfilled');
  result = await client.query('SELECT password_hash, must_change_password FROM user_credentials WHERE user_id=$1', [user]);
  assert.equal(result.rows[0].must_change_password, true);
  assert.equal(await verify(result.rows[0].password_hash, 'Test-temporary-password-225!'), true);
  const afterRace = await client.query('SELECT count(*)::int AS n FROM sessions WHERE user_id=$1 AND revoked_at IS NULL', [user]);
  assert.equal(afterRace.rows[0].n, 0);
  console.log('Restablecimiento concurrente conserva la contraseña temporal y revoca todas las sesiones.');
  console.log('Restablecimiento: sólo administrador, contraseña temporal, revocación total y auditoría verificados.');
  console.log('Cambio real: contraseña incorrecta rechazada; dos cambios simultáneos producen un solo éxito, una sesión vigente y una auditoría.');
} finally {
  if (created) {
    await client.query('BEGIN');
    try {
      await client.query('DELETE FROM audit_logs WHERE organization_id=$1 AND actor_user_id IN ($2,$3)', [org, user, admin]);
      await client.query('DELETE FROM sessions WHERE user_id IN ($1,$2) AND organization_id=$3', [user, admin, org]);
      await client.query('DELETE FROM memberships WHERE user_id IN ($1,$2) AND organization_id=$3', [user, admin, org]);
      await client.query('DELETE FROM user_credentials WHERE user_id IN ($1,$2)', [user, admin]);
      await client.query('DELETE FROM users WHERE id IN ($1,$2) AND full_name=$3', [user, admin, 'TEST ACCOUNT INTEGRATION']);
      await client.query('DELETE FROM workshops WHERE id=$1 AND organization_id=$2', [workshop, org]);
      await client.query('DELETE FROM organizations WHERE id=$1 AND name=$2', [org, 'TEST ACCOUNT INTEGRATION']);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
  } else await client.query('ROLLBACK');
  client.release(); await pool.end();
}
