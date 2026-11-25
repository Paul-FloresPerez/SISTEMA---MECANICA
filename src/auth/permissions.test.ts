import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { hasPermission } from './permissions';

test('roles grant only their intended permissions', () => {
  assert.equal(hasPermission('admin', 'profitability:read'), true);
  assert.equal(hasPermission('workshop_manager', 'profitability:read'), false);
  assert.equal(hasPermission('workshop_manager', 'repairs:write'), true);
  assert.equal(hasPermission('mechanic', 'repairs:write'), true);
  assert.equal(hasPermission('mechanic', 'payments:write'), false);
  assert.equal(hasPermission('cashier', 'cash:write'), true);
  assert.equal(hasPermission('cashier', 'repairs:write'), false);
  assert.equal(hasPermission('mechanic', 'customers:write'), true);
  assert.equal(hasPermission('mechanic', 'motorcycles:write'), true);
  assert.equal(hasPermission('cashier', 'inventory:read'), true);
  assert.equal(hasPermission('cashier', 'repairs:read'), true);
  assert.equal(hasPermission('workshop_manager', 'cash:write'), true);
});
