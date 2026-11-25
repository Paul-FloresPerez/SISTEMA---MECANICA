import env from '@next/env';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
env.loadEnvConfig(process.cwd());
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED, max: 4 });
const org = randomUUID(), workshop = randomUUID(), a = randomUUID(), b = randomUUID();
const c = await pool.connect();
try {
  await c.query('BEGIN');
  await c.query("INSERT INTO organizations(id,name) VALUES ($1,'TEST ADMIN LOCK')", [org]);
  await c.query("INSERT INTO workshops(id,organization_id,name) VALUES ($1,$2,'TEST ADMIN LOCK')", [workshop, org]);
  await c.query("INSERT INTO users(id,full_name,username) VALUES ($1,'TEST ADMIN LOCK',$2),($3,'TEST ADMIN LOCK',$4)", [a, `test-${a}`, b, `test-${b}`]);
  await c.query("INSERT INTO memberships(user_id,organization_id,workshop_id,role) VALUES ($1,$3,$4,'admin'),($2,$3,$4,'admin')", [a, b, org, workshop]);
  await c.query('COMMIT');
  async function downgrade(userId) {
    const x = await pool.connect();
    try {
      await x.query('BEGIN');
      await x.query('SELECT id FROM organizations WHERE id=$1 FOR UPDATE', [org]);
      const rows = await x.query("SELECT m.id FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=$1 AND m.workshop_id=$2 AND m.role='admin' AND m.is_active AND u.is_active", [org, workshop]);
      if (rows.rowCount <= 1) { await x.query('ROLLBACK'); return false; }
      await x.query("UPDATE memberships SET role='mechanic' WHERE organization_id=$1 AND user_id=$2", [org, userId]);
      await x.query('COMMIT'); return true;
    } catch (error) { await x.query('ROLLBACK'); throw error; } finally { x.release(); }
  }
  const results = await Promise.all([downgrade(a), downgrade(b)]);
  assert.equal(results.filter(Boolean).length, 1);
  console.log('Bloqueo concurrente: uno de dos cambios se rechaza y permanece un administrador.');
} finally {
  await c.query('BEGIN');
  await c.query('DELETE FROM memberships WHERE organization_id=$1 AND user_id IN ($2,$3)', [org, a, b]);
  await c.query('DELETE FROM users WHERE id IN ($1,$2)', [a, b]);
  await c.query('DELETE FROM workshops WHERE id=$1 AND organization_id=$2', [workshop, org]);
  await c.query('DELETE FROM organizations WHERE id=$1 AND name=$2', [org, 'TEST ADMIN LOCK']);
  await c.query('COMMIT');
  c.release(); await pool.end();
}
