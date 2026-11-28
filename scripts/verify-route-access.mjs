// Run against a local development server and the authorized development database.
import env from '@next/env';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';

env.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('Falta DATABASE_URL_UNPOOLED');
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED, max: 1 });
const client = await pool.connect();
const org = randomUUID(), workshop = randomUUID();
const ids = [];
const paths = ['/', '/mi-cuenta', '/clientes', '/reparaciones', '/reparaciones/nueva', '/reparaciones/example', '/inventario', '/ventas', '/compras-gastos', '/reportes', '/configuracion'];
const allowed = {
  admin: paths,
  workshop_manager: paths.filter(p => !['/reportes', '/configuracion'].includes(p)),
  mechanic: paths.filter(p => !['/ventas', '/compras-gastos', '/reportes', '/configuracion'].includes(p)),
  cashier: paths.filter(p => !['/reparaciones/nueva', '/compras-gastos', '/reportes', '/configuracion'].includes(p)),
};
let created = false;
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO organizations(id,name) VALUES($1,$2)', [org, 'TEST ROUTE ACCESS']);
  await client.query('INSERT INTO workshops(id,organization_id,name) VALUES($1,$2,$3)', [workshop, org, 'TEST ROUTE ACCESS']);
  for (const role of Object.keys(allowed)) {
    const id = randomUUID(), token = randomBytes(32).toString('hex');
    ids.push({ id, role, token });
    await client.query('INSERT INTO users(id,full_name,username) VALUES($1,$2,$3)', [id, 'TEST ROUTE ACCESS', `test-${id}`]);
    await client.query('INSERT INTO user_credentials(user_id,password_hash) VALUES($1,$2)', [id, 'not-used']);
    await client.query('INSERT INTO memberships(user_id,organization_id,workshop_id,role) VALUES($1,$2,$3,$4)', [id, org, workshop, role]);
    await client.query("INSERT INTO sessions(user_id,organization_id,workshop_id,token_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval '1 day')", [id, org, workshop, createHash('sha256').update(token).digest('hex')]);
  }
  await client.query('COMMIT');
  created = true;
  for (const { role, token } of ids) {
    for (const path of paths) {
      const response = await fetch(`http://127.0.0.1:3109${path}`, { headers: { cookie: `zr_session=${token}` }, redirect: 'manual' });
      const body = await response.text();
      const denied = response.headers.get('location')?.includes('/mi-cuenta') || body.includes('NEXT_REDIRECT;replace;/mi-cuenta;');
      if (allowed[role].includes(path)) {
        assert.equal(denied, false, `${role} debería acceder a ${path}`);
        assert.ok(response.status < 400, `${role} ${path}: HTTP ${response.status}`);
        if (path === '/') {
          const sidebar = body.match(/<aside aria-label="Navegación principal"[\s\S]*?<\/aside>/)?.[0];
          const mobile = body.match(/<nav aria-label="Navegación móvil inferior"[\s\S]*?<\/nav>/)?.[0];
          assert.ok(sidebar && mobile, 'Deben existir ambas navegaciones');
          for (const destination of ['/ventas', '/compras-gastos', '/reportes', '/configuracion']) {
            const link = `href="${destination}"`;
            assert.equal(sidebar.includes(link), allowed[role].includes(destination), `${role}: menú de escritorio ${destination}`);
            if (!allowed[role].includes(destination)) assert.equal(mobile.includes(link), false, `${role}: menú móvil ${destination}`);
          }
          assert.equal(body.includes('Nueva reparación'), role !== 'cashier', `${role}: acceso rápido de reparación`);
          assert.equal(body.includes('Abrir POS'), role !== 'mechanic', `${role}: acceso rápido de ventas`);
          assert.equal(body.includes('Registrar gasto'), ['admin', 'workshop_manager'].includes(role), `${role}: acceso rápido de gastos`);
        }
      } else {
        assert.ok(denied, `${role} debería ser redirigido desde ${path} (HTTP ${response.status})`);
      }
    }
  }
  console.log('Accesos HTTP permitidos y denegados verificados para los cuatro roles.');
} catch (error) {
  if (!created) await client.query('ROLLBACK');
  throw error;
} finally {
  if (created) {
    await client.query('DELETE FROM sessions WHERE organization_id=$1', [org]);
    await client.query('DELETE FROM memberships WHERE organization_id=$1', [org]);
    await client.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [ids.map(({ id }) => id)]);
    await client.query('DELETE FROM workshops WHERE id=$1', [workshop]);
    await client.query('DELETE FROM organizations WHERE id=$1', [org]);
  }
  client.release();
  await pool.end();
}
