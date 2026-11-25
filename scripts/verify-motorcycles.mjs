import nextEnv from '@next/env';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import assert from 'node:assert/strict';
nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('Falta DATABASE_URL_UNPOOLED');
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED, max: 1 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  const org = (await client.query("INSERT INTO organizations (name) VALUES ('TEST motorcycles') RETURNING id")).rows[0].id;
  const wa = (await client.query("INSERT INTO workshops (organization_id,name) VALUES ($1,'TEST moto A') RETURNING id", [org])).rows[0].id;
  const wb = (await client.query("INSERT INTO workshops (organization_id,name) VALUES ($1,'TEST moto B') RETURNING id", [org])).rows[0].id;
  const customer = (await client.query("INSERT INTO customers (organization_id,workshop_id,full_name) VALUES ($1,$2,'TEST moto customer') RETURNING id", [org, wa])).rows[0].id;
  const insert = "INSERT INTO motorcycles (organization_id,workshop_id,customer_id,brand,model,plate) VALUES ($1,$2,$3,'TEST','Model',$4) RETURNING id";
  const first = (await client.query(insert, [org, wa, customer, null])).rows[0].id;
  await client.query(insert, [org, wa, customer, null]);
  await client.query(insert, [org, wa, customer, 'TEST-123']);
  await client.query('SAVEPOINT duplicate_plate');
  let duplicateRejected = false;
  try { await client.query(insert, [org, wa, customer, 'TEST-123']); } catch (error) { duplicateRejected = error.code === '23505' && error.constraint === 'motorcycles_workshop_plate_unique'; await client.query('ROLLBACK TO SAVEPOINT duplicate_plate'); }
  assert.ok(duplicateRejected, 'Se debe rechazar una placa duplicada');
  const other = await client.query("UPDATE motorcycles SET brand='WRONG' WHERE id=$1 AND organization_id=$2 AND workshop_id=$3 AND customer_id=$4 RETURNING id", [first, org, wb, customer]);
  assert.equal(other.rowCount, 0);
  const changed = await client.query("UPDATE motorcycles SET model='Updated' WHERE id=$1 AND organization_id=$2 AND workshop_id=$3 AND customer_id=$4 RETURNING model", [first, org, wa, customer]);
  assert.equal(changed.rows[0].model, 'Updated');
  const rows = await client.query('SELECT id FROM motorcycles WHERE organization_id=$1 AND workshop_id=$2 AND customer_id=$3', [org, wa, customer]);
  assert.equal(rows.rowCount, 3);
  await client.query('ROLLBACK');
  console.log('PostgreSQL: múltiples motos sin placa, placa duplicada, edición y aislamiento comprobados; fixtures revertidos.');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
