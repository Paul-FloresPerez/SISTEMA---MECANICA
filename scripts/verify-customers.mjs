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
  const a = (await client.query("INSERT INTO organizations (name) VALUES ('TEST customer A') RETURNING id")).rows[0].id;
  const b = (await client.query("INSERT INTO organizations (name) VALUES ('TEST customer B') RETURNING id")).rows[0].id;
  const wa = (await client.query("INSERT INTO workshops (organization_id,name) VALUES ($1,'TEST A') RETURNING id", [a])).rows[0].id;
  const wb = (await client.query("INSERT INTO workshops (organization_id,name) VALUES ($1,'TEST B') RETURNING id", [b])).rows[0].id;
  const id = (await client.query("INSERT INTO customers (organization_id,workshop_id,full_name,phone) VALUES ($1,$2,'TEST Cliente','999000111') RETURNING id", [a, wa])).rows[0].id;
  const own = await client.query("SELECT id FROM customers WHERE id=$1 AND organization_id=$2 AND workshop_id=$3 AND is_active=true", [id, a, wa]);
  assert.equal(own.rowCount, 1);
  const other = await client.query("UPDATE customers SET full_name='NO' WHERE id=$1 AND organization_id=$2 AND workshop_id=$3 RETURNING id", [id, b, wb]);
  assert.equal(other.rowCount, 0);
  const updated = await client.query("UPDATE customers SET full_name='TEST Editado' WHERE id=$1 AND organization_id=$2 AND workshop_id=$3 RETURNING full_name", [id, a, wa]);
  assert.equal(updated.rows[0].full_name, 'TEST Editado');
  const search = await client.query("SELECT id FROM customers WHERE organization_id=$1 AND workshop_id=$2 AND full_name ILIKE $3", [a, wa, '%editado%']);
  assert.equal(search.rows[0].id, id);
  await client.query('ROLLBACK');
  console.log('PostgreSQL: creación, edición, búsqueda y aislamiento comprobados; datos de prueba revertidos.');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
