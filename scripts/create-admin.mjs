import nextEnv from '@next/env';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { hash, Algorithm } from '@node-rs/argon2';
import ws from 'ws';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('DATABASE_URL_UNPOOLED es obligatorio.');
if (!stdin.isTTY) throw new Error('Ejecute este comando en una terminal interactiva.');
const rl = readline.createInterface({ input: stdin, output: stdout });
const name = (await rl.question('Nombre del administrador: ')).trim();
const email = (await rl.question('Correo del administrador: ')).trim().toLowerCase();
rl.close();
const prompt = readline.createInterface({ input: stdin, output: stdout, terminal: true });
prompt._writeToOutput = function () {};
stdout.write('Contraseña (mínimo 12 caracteres): ');
const password = await prompt.question('');
stdout.write('\nRepite la contraseña: ');
const confirmation = await prompt.question('');
stdout.write('\n');
prompt.close();
if (name.length < 2 || name.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320 || password.length < 12 || password.length > 1024 || password !== confirmation) throw new Error('Datos inválidos o contraseñas distintas.');
const passwordHash = await hash(password, { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED, max: 1 });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(908372091)');
  const existing = await client.query('SELECT EXISTS (SELECT 1 FROM users) OR EXISTS (SELECT 1 FROM organizations) AS initialized');
  if (existing.rows[0].initialized) throw new Error('La base ya fue inicializada; no se creará otra cuenta.');
  const org = await client.query('INSERT INTO organizations (name) VALUES ($1) RETURNING id', ['ZONA RACING']);
  const workshop = await client.query('INSERT INTO workshops (organization_id, name) VALUES ($1,$2) RETURNING id', [org.rows[0].id, 'ZONA RACING']);
  const user = await client.query('INSERT INTO users (full_name, email) VALUES ($1,$2) RETURNING id', [name, email]);
  await client.query('INSERT INTO user_credentials (user_id, password_hash) VALUES ($1,$2)', [user.rows[0].id, passwordHash]);
  await client.query('INSERT INTO memberships (organization_id, workshop_id, user_id, role) VALUES ($1,$2,$3,$4)', [org.rows[0].id, workshop.rows[0].id, user.rows[0].id, 'admin']);
  await client.query('COMMIT');
  console.log('Administrador y taller creados.');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { client.release(); await pool.end(); }
