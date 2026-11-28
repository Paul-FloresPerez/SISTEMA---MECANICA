import nextEnv from '@next/env';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { hash, verify } from '@node-rs/argon2';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import ws from 'ws';
import { resetAdmin } from './lib/reset-admin.mjs';

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('Falta DATABASE_URL_UNPOOLED');
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED, max: 4 });
const client = await pool.connect();
const org = randomUUID(), workshop = randomUUID(), admin = randomUUID(), other = randomUUID();
const adminName = `test-${admin}`, otherName = `test-${other}`;
const oldPassword = 'Test-only-old-384!';
const newPassword = 'Test-only-new-385!';
let created = false;
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO organizations(id,name) VALUES($1,$2)', [org, 'TEST RESET ADMIN']);
  await client.query('INSERT INTO workshops(id,organization_id,name) VALUES($1,$2,$3)', [workshop, org, 'TEST RESET ADMIN']);
  await client.query('INSERT INTO users(id,full_name,username) VALUES($1,$2,$3),($4,$2,$5)', [admin, 'TEST RESET ADMIN', adminName, other, otherName]);
  const originalHash = await hash(oldPassword, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  await client.query('INSERT INTO user_credentials(user_id,password_hash) VALUES($1,$3),($2,$3)', [admin, other, originalHash]);
  await client.query("INSERT INTO memberships(user_id,organization_id,workshop_id,role) VALUES($1,$3,$4,'admin'),($2,$3,$4,'mechanic')", [admin, other, org, workshop]);
  await client.query("INSERT INTO sessions(user_id,organization_id,workshop_id,token_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval '1 day'),($1,$2,$3,$5,now()+interval '1 day')", [admin, org, workshop, randomUUID(), randomUUID()]);
  await client.query('COMMIT'); created = true;
  await assert.rejects(resetAdmin(pool, randomUUID(), adminName, newPassword));
  await assert.rejects(resetAdmin(pool, org, otherName, newPassword));
  await assert.rejects(resetAdmin(pool, org, adminName, 'corta'));
  await resetAdmin(pool, org, adminName, newPassword);
  const credential = (await client.query('SELECT password_hash,must_change_password FROM user_credentials WHERE user_id=$1', [admin])).rows[0];
  assert.equal(credential.must_change_password, true);
  assert.equal(await verify(credential.password_hash, newPassword), true);
  assert.equal(await verify(credential.password_hash, oldPassword), false);
  const remaining = await client.query('SELECT count(*)::int AS n FROM sessions WHERE user_id=$1 AND revoked_at IS NULL', [admin]);
  assert.equal(remaining.rows[0].n, 0);
  const audit = await client.query("SELECT actor_user_id,metadata FROM audit_logs WHERE organization_id=$1 AND entity_id=$2 AND action='user.emergency_password_reset'", [org, admin]);
  assert.equal(audit.rowCount, 1);
  assert.equal(audit.rows[0].actor_user_id, null);
  assert.deepEqual(audit.rows[0].metadata, { method: 'private_terminal' });
  const untouched = await client.query('SELECT password_hash,must_change_password FROM user_credentials WHERE user_id=$1', [other]);
  assert.equal(untouched.rows[0].must_change_password, false);
  assert.equal(await verify(untouched.rows[0].password_hash, oldPassword), true);
  console.log('Restablecimiento real: identidad, rol, hash, sesiones, obligatoriedad, auditoría y aislamiento verificados.');
} finally {
  if (created) {
    await client.query('BEGIN');
    try {
      await client.query('DELETE FROM audit_logs WHERE organization_id=$1 AND entity_id=$2', [org, admin]);
      await client.query('DELETE FROM sessions WHERE organization_id=$1 AND user_id=$2', [org, admin]);
      await client.query('DELETE FROM memberships WHERE organization_id=$1 AND user_id IN ($2,$3)', [org, admin, other]);
      await client.query('DELETE FROM user_credentials WHERE user_id IN ($1,$2)', [admin, other]);
      await client.query('DELETE FROM users WHERE id IN ($1,$2) AND full_name=$3', [admin, other, 'TEST RESET ADMIN']);
      await client.query('DELETE FROM workshops WHERE id=$1 AND organization_id=$2', [workshop, org]);
      await client.query('DELETE FROM organizations WHERE id=$1 AND name=$2', [org, 'TEST RESET ADMIN']);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
  } else await client.query('ROLLBACK');
  client.release(); await pool.end();
}
