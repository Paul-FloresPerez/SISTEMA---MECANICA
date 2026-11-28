import nextEnv from '@next/env';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { resetAdmin } from './lib/reset-admin.mjs';

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('DATABASE_URL_UNPOOLED es obligatorio.');
if (!stdin.isTTY || !stdout.isTTY || typeof stdin.setRawMode !== 'function') throw new Error('Se requiere una terminal privada interactiva.');
const rl = readline.createInterface({ input: stdin, output: stdout });
const organizationId = (await rl.question('UUID de la organización: ')).trim();
const username = (await rl.question('Nombre de usuario del administrador: ')).trim().toLowerCase();
const confirmation = (await rl.question(`Se cerrarán todas las sesiones de ${username} en la organización ${organizationId}. Escribe RESTABLECER: `)).trim();
rl.close();
if (confirmation !== 'RESTABLECER') throw new Error('Operación cancelada.');

async function secretQuestion(message) {
  stdout.write(message);
  stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
  return new Promise((resolve, reject) => {
    let value = '';
    function cleanup() { stdin.off('data', onData); stdin.setRawMode(false); stdin.pause(); }
    function onData(chunk) {
      for (const character of chunk) {
        if (character === '\u0003') { cleanup(); reject(new Error('Operación cancelada.')); return; }
        if (character === '\r' || character === '\n') { cleanup(); stdout.write('\n'); resolve(value); return; }
        if (character === '\u007f' || character === '\b') value = value.slice(0, -1);
        else if (character >= ' ') value += character;
      }
    }
    stdin.on('data', onData);
  });
}

const password = await secretQuestion('Contraseña temporal (12 a 1024 caracteres): ');
const repeat = await secretQuestion('Repite la contraseña temporal: ');
if (password !== repeat) throw new Error('Las contraseñas no coinciden.');
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED, max: 1 });
try {
  await resetAdmin(pool, organizationId, username, password);
  console.log('Contraseña temporal asignada; sesiones revocadas y auditoría registrada.');
} finally { await pool.end(); }
