import env from '@next/env';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { hash, verify } from '@node-rs/argon2';
import ws from 'ws';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

env.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('Falta DATABASE_URL_UNPOOLED');
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED, max: 1 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const org = (await client.query('INSERT INTO organizations (name) VALUES ($1) RETURNING id', ['TEST usuarios'])).rows[0].id;
  const workshop = (await client.query('INSERT INTO workshops (organization_id,name) VALUES ($1,$2) RETURNING id', [org, 'TEST usuarios'])).rows[0].id;
  const password = 'Test-only-password-9!';
  const passwordHash = await hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  for (const role of ['admin', 'workshop_manager', 'mechanic', 'cashier']) {
    const username = `test-${randomUUID()}`;
    const id = (await client.query('INSERT INTO users (full_name,username) VALUES ($1,$2) RETURNING id', ['TEST usuario', username])).rows[0].id;
    await client.query('INSERT INTO user_credentials (user_id,password_hash) VALUES ($1,$2)', [id, passwordHash]);
    await client.query('INSERT INTO memberships (user_id,organization_id,workshop_id,role) VALUES ($1,$2,$3,$4)', [id, org, workshop, role]);
    const rows = await client.query('SELECT c.password_hash, m.role FROM user_credentials c JOIN users u ON u.id=c.user_id JOIN memberships m ON m.user_id=u.id JOIN workshops w ON w.id=m.workshop_id AND w.organization_id=m.organization_id WHERE u.username=$1 AND u.is_active AND m.is_active AND w.is_active', [username]);
    assert.equal(rows.rows[0].role, role);
    assert.equal(await verify(rows.rows[0].password_hash, password), true);
    assert.equal(await verify(rows.rows[0].password_hash, 'incorrecta'), false);
  }
  await client.query('ROLLBACK');
  console.log('Credenciales Argon2id y membresías verificadas para los cuatro roles; datos revertidos.');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
