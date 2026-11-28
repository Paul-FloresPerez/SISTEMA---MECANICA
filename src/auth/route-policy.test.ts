import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { canAccessRoute } from './route-policy';

test('route permissions distinguish read, write and profitability across roles', () => {
  for (const role of ['admin', 'workshop_manager', 'mechanic', 'cashier'] as const) {
    assert.equal(canAccessRoute(role, '/mi-cuenta'), true);
    assert.equal(canAccessRoute(role, '/unknown'), false);
  }
  assert.equal(canAccessRoute('admin', '/reportes'), true);
  assert.equal(canAccessRoute('workshop_manager', '/reportes'), false);
  assert.equal(canAccessRoute('mechanic', '/reparaciones/nueva'), true);
  assert.equal(canAccessRoute('cashier', '/reparaciones/nueva'), false);
  assert.equal(canAccessRoute('cashier', '/reparaciones/example'), true);
  assert.equal(canAccessRoute('mechanic', '/ventas'), false);
  assert.equal(canAccessRoute('workshop_manager', '/configuracion'), false);
  assert.equal(canAccessRoute('admin', '/configuracion-extra'), false);
});
