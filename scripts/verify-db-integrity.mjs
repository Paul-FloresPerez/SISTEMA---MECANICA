import nextEnv from '@next/env';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { randomUUID } from 'node:crypto';

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('DATABASE_URL_UNPOOLED is required');
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED, max: 1 });
const client = await pool.connect();
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const expectConstraint = async (constraint, query, params) => {
  await client.query('SAVEPOINT expected_violation');
  try {
    await client.query(query, params);
    throw new Error(`Expected constraint ${constraint} to reject the test row`);
  } catch (error) {
    if (error.message.startsWith('Expected constraint')) throw error;
    const expected = Array.isArray(constraint) ? constraint : [constraint];
    assert(expected.includes(error.constraint), `Expected ${expected.join(' or ')}, got ${error.constraint ?? error.code}`);
    await client.query('ROLLBACK TO SAVEPOINT expected_violation');
  }
  await client.query('RELEASE SAVEPOINT expected_violation');
};

try {
  await client.query('BEGIN');
  const organizationId = randomUUID();
  const otherOrganizationId = randomUUID();
  const workshopId = randomUUID();
  const otherWorkshopId = randomUUID();
  const productId = randomUUID();
  const locationId = randomUUID();
  const otherLocationId = randomUUID();
  const movementId = randomUUID();
  const paymentId = randomUUID();
  const expenseId = randomUUID();

  await client.query('INSERT INTO organizations (id, name) VALUES ($1, $2), ($3, $4)', [organizationId, 'DB integrity test', otherOrganizationId, 'DB integrity test other']);
  await client.query('INSERT INTO workshops (id, organization_id, name) VALUES ($1, $2, $3), ($4, $5, $6)', [workshopId, organizationId, 'Integrity workshop', otherWorkshopId, otherOrganizationId, 'Other workshop']);
  await client.query('INSERT INTO products (id, organization_id, workshop_id, sku, name) VALUES ($1, $2, $3, $4, $5)', [productId, organizationId, workshopId, `TEST-${productId}`, 'Weighted cost test']);
  await client.query('INSERT INTO stock_locations (id, workshop_id, name) VALUES ($1, $2, $3), ($4, $5, $6)', [locationId, workshopId, 'Main test', otherLocationId, otherWorkshopId, 'Other test']);
  await client.query('INSERT INTO inventory_balances (organization_id, workshop_id, product_id, stock_location_id, quantity_on_hand, inventory_value, average_unit_cost) VALUES ($1, $2, $3, $4, 3, 10.00, 3.333333)', [organizationId, workshopId, productId, locationId]);

  await expectConstraint('inventory_balances_location_workshop_fk', 'INSERT INTO inventory_balances (organization_id, workshop_id, product_id, stock_location_id) VALUES ($1, $2, $3, $4)', [organizationId, workshopId, productId, otherLocationId]);
  await expectConstraint(['inventory_balances_product_tenant_fk', 'inventory_balances_product_workshop_fk'], 'INSERT INTO inventory_balances (organization_id, workshop_id, product_id, stock_location_id) VALUES ($1, $2, $3, $4)', [otherOrganizationId, otherWorkshopId, productId, otherLocationId]);

  const balance = await client.query('SELECT quantity_on_hand, inventory_value, average_unit_cost FROM inventory_balances WHERE product_id = $1 AND stock_location_id = $2', [productId, locationId]);
  assert(balance.rows[0].average_unit_cost === '3.333333', 'Weighted average precision was not retained');
  await client.query('INSERT INTO inventory_movements (id, organization_id, workshop_id, product_id, stock_location_id, movement_type, quantity_delta, unit_cost_applied, total_cost_applied, quantity_before, quantity_after, inventory_value_before, inventory_value_after, reason, reference_type, reference_id) VALUES ($1,$2,$3,$4,$5,$6,1,3.333333,3.33,3,4,10.00,13.33,$7,$8,$9)', [movementId, organizationId, workshopId, productId, locationId, 'purchase_receipt', 'integration test', 'test', randomUUID()]);
  await client.query('INSERT INTO inventory_movements (organization_id, workshop_id, product_id, stock_location_id, movement_type, quantity_delta, unit_cost_applied, total_cost_applied, quantity_before, quantity_after, inventory_value_before, inventory_value_after, reason, reference_type, reference_id, reverses_movement_id) VALUES ($1,$2,$3,$4,$5,-1,3.333333,3.33,4,3,13.33,10.00,$6,$7,$8,$9)', [organizationId, workshopId, productId, locationId, 'void_reversal', 'rollback test', 'test_reversal', randomUUID(), movementId]);
  await expectConstraint('inventory_movements_single_reversal_unique', 'INSERT INTO inventory_movements (organization_id, workshop_id, product_id, stock_location_id, movement_type, quantity_delta, unit_cost_applied, total_cost_applied, quantity_before, quantity_after, inventory_value_before, inventory_value_after, reason, reference_type, reference_id, reverses_movement_id) VALUES ($1,$2,$3,$4,$5,-1,3.333333,3.33,4,3,13.33,10.00,$6,$7,$8,$9)', [organizationId, workshopId, productId, locationId, 'void_reversal', 'duplicate reversal test', 'test_reversal', randomUUID(), movementId]);

  await client.query('INSERT INTO operating_expenses (id, organization_id, workshop_id, category, description, amount, incurred_on) VALUES ($1,$2,$3,$4,$5,12.50,current_date)', [expenseId, organizationId, workshopId, 'test', 'payment allocation test']);
  await client.query('INSERT INTO payments (id, organization_id, workshop_id, direction, method, amount, status, idempotency_key) VALUES ($1,$2,$3,$4,$5,12.50,$6,$7)', [paymentId, organizationId, workshopId, 'outbound', 'cash', 'confirmed', `test-${paymentId}`]);
  await client.query('INSERT INTO payment_allocations (payment_id, operating_expense_id, amount) VALUES ($1,$2,12.50)', [paymentId, expenseId]);
  await expectConstraint('payment_allocations_one_document_check', 'INSERT INTO payment_allocations (payment_id, operating_expense_id, purchase_id, amount) VALUES ($1,$2,$3,1.00)', [paymentId, expenseId, randomUUID()]);
  await expectConstraint('payments_reversal_same_tenant_fk', 'INSERT INTO payments (organization_id, workshop_id, direction, method, amount, idempotency_key, reversed_payment_id) VALUES ($1,$2,$3,$4,1.00,$5,$6)', [organizationId, workshopId, 'inbound', 'cash', `cross-${randomUUID()}`, randomUUID()]);

  await client.query('ROLLBACK');
  console.log('PostgreSQL integration checks passed: tenant FKs, weighted cost precision, movement reversals, payment allocations, and payment reversal integrity. Test fixtures rolled back.');
} catch (error) {
  try { await client.query('ROLLBACK'); } catch {}
  throw error;
} finally {
  client.release();
  await pool.end();
}
