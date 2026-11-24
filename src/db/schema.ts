import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'workshop_manager', 'mechanic', 'cashier']);
export const repairStatusEnum = pgEnum('repair_status', [
  'received',
  'diagnosis',
  'in_progress',
  'waiting_parts',
  'ready',
  'delivered',
  'cancelled',
]);
export const repairPartSourceEnum = pgEnum('repair_part_source', ['inventory', 'direct_purchase', 'customer']);
export const saleStatusEnum = pgEnum('sale_status', ['draft', 'completed', 'voided']);
export const purchaseStatusEnum = pgEnum('purchase_status', ['draft', 'ordered', 'received', 'cancelled', 'voided']);
export const expenseStatusEnum = pgEnum('expense_status', ['pending', 'partially_paid', 'paid', 'voided', 'reversed']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'yape', 'plin', 'bank_transfer']);
export const paymentDirectionEnum = pgEnum('payment_direction', ['inbound', 'outbound']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'confirmed', 'voided', 'reversed']);
export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type', [
  'purchase_receipt',
  'repair_consumption',
  'sale',
  'sale_return',
  'purchase_return',
  'adjustment_in',
  'adjustment_out',
  'void_reversal',
]);
export const purchaseLineDestinationEnum = pgEnum('purchase_line_destination', ['inventory', 'repair_direct']);
export const returnStatusEnum = pgEnum('return_status', ['draft', 'completed', 'voided']);
export const documentTypeEnum = pgEnum('document_type', ['repair', 'sale', 'purchase', 'sale_return', 'purchase_return']);

const money = (name: string) => numeric(name, { precision: 14, scale: 2 });
const quantity = (name: string) => numeric(name, { precision: 14, scale: 3 });
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 160 }).notNull(),
  legalName: varchar('legal_name', { length: 200 }),
  taxId: varchar('tax_id', { length: 32 }),
  defaultCurrency: varchar('default_currency', { length: 3 }).notNull().default('PEN'),
  timezone: varchar('timezone', { length: 64 }).notNull().default('America/Lima'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex('organizations_tax_id_unique').on(table.taxId).where(sql`${table.taxId} is not null`),
]);

export const workshops = pgTable('workshops', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 160 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 32 }),
  email: varchar('email', { length: 320 }),
  businessHours: varchar('business_hours', { length: 160 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('workshops_organization_id_id_unique').on(table.organizationId, table.id),
  unique('workshops_organization_name_unique').on(table.organizationId, table.name),
  index('workshops_organization_id_idx').on(table.organizationId),
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: varchar('full_name', { length: 160 }).notNull(),
  email: varchar('email', { length: 320 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex('users_email_unique').on(sql`lower(${table.email})`)]);

export const userCredentials = pgTable('user_credentials', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }).notNull().defaultNow(),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
}, (table) => [check('user_credentials_failed_attempts_check', sql`${table.failedAttempts} >= 0`)]);

export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').references(() => workshops.id, { onDelete: 'restrict' }),
  role: userRoleEnum('role').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('memberships_organization_user_unique').on(table.organizationId, table.userId),
  index('memberships_user_id_idx').on(table.userId),
  index('memberships_organization_workshop_idx').on(table.organizationId, table.workshopId),
]);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').references(() => workshops.id, { onDelete: 'restrict' }),
  tokenHash: varchar('token_hash', { length: 128 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex('sessions_token_hash_unique').on(table.tokenHash),
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_active_expiry_idx').on(table.expiresAt).where(sql`${table.revokedAt} is null`),
]);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').references(() => workshops.id, { onDelete: 'restrict' }),
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 120 }).notNull(),
  entityType: varchar('entity_type', { length: 120 }).notNull(),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
  createdAt: createdAt(),
}, (table) => [
  index('audit_logs_tenant_created_at_idx').on(table.organizationId, table.workshopId, table.createdAt),
  index('audit_logs_entity_idx').on(table.entityType, table.entityId),
]);

export const documentSequences = pgTable('document_sequences', {
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  documentType: documentTypeEnum('document_type').notNull(),
  year: integer('year').notNull(),
  lastValue: integer('last_value').notNull().default(0),
  updatedAt: updatedAt(),
}, (table) => [
  primaryKey({ columns: [table.workshopId, table.documentType, table.year], name: 'document_sequences_pkey' }),
  check('document_sequences_year_check', sql`${table.year} between 2000 and 9999`),
  check('document_sequences_last_value_check', sql`${table.lastValue} >= 0`),
]);

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  fullName: varchar('full_name', { length: 160 }).notNull(),
  phone: varchar('phone', { length: 32 }),
  email: varchar('email', { length: 320 }),
  documentType: varchar('document_type', { length: 16 }),
  documentNumber: varchar('document_number', { length: 32 }),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('customers_organization_id_id_unique').on(table.organizationId, table.id),
  uniqueIndex('customers_document_number_unique').on(table.organizationId, table.documentNumber).where(sql`${table.documentNumber} is not null`),
  index('customers_workshop_name_idx').on(table.workshopId, table.fullName),
  index('customers_workshop_phone_idx').on(table.workshopId, table.phone),
]);

export const motorcycles = pgTable('motorcycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
  brand: varchar('brand', { length: 80 }).notNull(),
  model: varchar('model', { length: 120 }).notNull(),
  year: integer('year'),
  plate: varchar('plate', { length: 16 }),
  vin: varchar('vin', { length: 32 }),
  displacementCc: integer('displacement_cc'),
  color: varchar('color', { length: 48 }),
  mileageKm: integer('mileage_km').notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('motorcycles_organization_id_id_unique').on(table.organizationId, table.id),
  uniqueIndex('motorcycles_workshop_plate_unique').on(table.workshopId, table.plate).where(sql`${table.plate} is not null`),
  uniqueIndex('motorcycles_organization_vin_unique').on(table.organizationId, table.vin).where(sql`${table.vin} is not null`),
  index('motorcycles_customer_id_idx').on(table.customerId),
  check('motorcycles_mileage_check', sql`${table.mileageKm} >= 0`),
  check('motorcycles_displacement_check', sql`${table.displacementCc} is null or ${table.displacementCc} > 0`),
]);

export const productCategories = pgTable('product_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 120 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex('product_categories_workshop_name_unique').on(table.workshopId, sql`lower(${table.name})`)]);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  categoryId: uuid('category_id').references(() => productCategories.id, { onDelete: 'set null' }),
  sku: varchar('sku', { length: 80 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  brand: varchar('brand', { length: 120 }),
  salePrice: money('sale_price').notNull().default('0'),
  minStock: quantity('min_stock').notNull().default('0'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('products_organization_id_id_unique').on(table.organizationId, table.id),
  unique('products_workshop_id_id_unique').on(table.workshopId, table.id),
  unique('products_workshop_sku_unique').on(table.workshopId, table.sku),
  index('products_workshop_active_idx').on(table.workshopId, table.name).where(sql`${table.isActive}`),
  index('products_category_id_idx').on(table.categoryId),
  check('products_sale_price_check', sql`${table.salePrice} >= 0`),
  check('products_min_stock_check', sql`${table.minStock} >= 0`),
]);

export const stockLocations = pgTable('stock_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 120 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('stock_locations_workshop_name_unique').on(table.workshopId, table.name),
  unique('stock_locations_workshop_id_id_unique').on(table.workshopId, table.id),
  uniqueIndex('stock_locations_one_default_unique').on(table.workshopId).where(sql`${table.isDefault}`),
]);

export const inventoryBalances = pgTable('inventory_balances', {
  organizationId: uuid('organization_id').notNull(),
  workshopId: uuid('workshop_id').notNull(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  stockLocationId: uuid('stock_location_id').notNull().references(() => stockLocations.id, { onDelete: 'restrict' }),
  quantityOnHand: quantity('quantity_on_hand').notNull().default('0'),
  inventoryValue: money('inventory_value').notNull().default('0'),
  averageUnitCost: numeric('average_unit_cost', { precision: 18, scale: 6 }).notNull().default('0'),
  version: integer('version').notNull().default(0),
  updatedAt: updatedAt(),
}, (table) => [
  primaryKey({ columns: [table.productId, table.stockLocationId], name: 'inventory_balances_pkey' }),
  foreignKey({ columns: [table.organizationId, table.workshopId], foreignColumns: [workshops.organizationId, workshops.id], name: 'inventory_balances_workshop_tenant_fk' }),
  foreignKey({ columns: [table.organizationId, table.productId], foreignColumns: [products.organizationId, products.id], name: 'inventory_balances_product_tenant_fk' }),
  foreignKey({ columns: [table.workshopId, table.productId], foreignColumns: [products.workshopId, products.id], name: 'inventory_balances_product_workshop_fk' }),
  foreignKey({ columns: [table.workshopId, table.stockLocationId], foreignColumns: [stockLocations.workshopId, stockLocations.id], name: 'inventory_balances_location_workshop_fk' }),
  index('inventory_balances_location_idx').on(table.stockLocationId),
  check('inventory_balances_quantity_check', sql`${table.quantityOnHand} >= 0`),
  check('inventory_balances_value_check', sql`${table.inventoryValue} >= 0`),
  check('inventory_balances_average_cost_check', sql`${table.averageUnitCost} >= 0`),
  check('inventory_balances_version_check', sql`${table.version} >= 0`),
]);

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 160 }).notNull(),
  taxId: varchar('tax_id', { length: 32 }),
  contactName: varchar('contact_name', { length: 160 }),
  phone: varchar('phone', { length: 32 }),
  email: varchar('email', { length: 320 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('suppliers_organization_id_id_unique').on(table.organizationId, table.id),
  uniqueIndex('suppliers_organization_tax_id_unique').on(table.organizationId, table.taxId).where(sql`${table.taxId} is not null`),
  index('suppliers_organization_name_idx').on(table.organizationId, table.name),
]);

export const repairOrders = pgTable('repair_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
  motorcycleId: uuid('motorcycle_id').notNull().references(() => motorcycles.id, { onDelete: 'restrict' }),
  code: varchar('code', { length: 40 }).notNull(),
  status: repairStatusEnum('status').notNull().default('received'),
  customerNameSnapshot: varchar('customer_name_snapshot', { length: 160 }).notNull(),
  motorcycleSnapshot: varchar('motorcycle_snapshot', { length: 320 }).notNull(),
  plateSnapshot: varchar('plate_snapshot', { length: 16 }),
  reportedProblem: text('reported_problem').notNull(),
  diagnosisNotes: text('diagnosis_notes'),
  mechanicName: varchar('mechanic_name', { length: 160 }),
  mileageAtEntry: integer('mileage_at_entry').notNull().default(0),
  quotedTotal: money('quoted_total'),
  estimatedDeliveryDate: date('estimated_delivery_date'),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelledBy: uuid('cancelled_by').references(() => users.id, { onDelete: 'set null' }),
  cancellationReason: text('cancellation_reason'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('repair_orders_organization_id_id_unique').on(table.organizationId, table.id),
  unique('repair_orders_workshop_code_unique').on(table.workshopId, table.code),
  index('repair_orders_workshop_status_created_idx').on(table.workshopId, table.status, table.createdAt),
  index('repair_orders_customer_id_idx').on(table.customerId),
  index('repair_orders_motorcycle_id_idx').on(table.motorcycleId),
  check('repair_orders_mileage_check', sql`${table.mileageAtEntry} >= 0`),
  check('repair_orders_quote_check', sql`${table.quotedTotal} is null or ${table.quotedTotal} >= 0`),
]);

export const repairStatusHistory = pgTable('repair_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  repairOrderId: uuid('repair_order_id').notNull().references(() => repairOrders.id, { onDelete: 'restrict' }),
  previousStatus: repairStatusEnum('previous_status'),
  nextStatus: repairStatusEnum('next_status').notNull(),
  note: text('note'),
  changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
}, (table) => [index('repair_status_history_repair_created_idx').on(table.repairOrderId, table.createdAt)]);

export const repairLines = pgTable('repair_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  repairOrderId: uuid('repair_order_id').notNull().references(() => repairOrders.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  source: repairPartSourceEnum('source').notNull(),
  nameSnapshot: varchar('name_snapshot', { length: 200 }).notNull(),
  skuSnapshot: varchar('sku_snapshot', { length: 80 }),
  quantity: quantity('quantity').notNull(),
  unitCostSnapshot: money('unit_cost_snapshot').notNull().default('0'),
  unitPrice: money('unit_price').notNull().default('0'),
  supplierName: varchar('supplier_name', { length: 160 }),
  notes: text('notes'),
  inventoryMovementId: uuid('inventory_movement_id'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index('repair_lines_repair_order_id_idx').on(table.repairOrderId),
  index('repair_lines_product_id_idx').on(table.productId),
  check('repair_lines_quantity_check', sql`${table.quantity} > 0`),
  check('repair_lines_cost_check', sql`${table.unitCostSnapshot} >= 0`),
  check('repair_lines_price_check', sql`${table.unitPrice} >= 0`),
]);

export const repairExpenses = pgTable('repair_expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  workshopId: uuid('workshop_id').notNull(),
  repairOrderId: uuid('repair_order_id').notNull().references(() => repairOrders.id, { onDelete: 'restrict' }),
  purchaseLineId: uuid('purchase_line_id'),
  description: varchar('description', { length: 240 }).notNull(),
  category: varchar('category', { length: 120 }).notNull(),
  amount: money('amount').notNull(),
  incurredOn: date('incurred_on').notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  foreignKey({ columns: [table.organizationId, table.workshopId], foreignColumns: [workshops.organizationId, workshops.id], name: 'repair_expenses_workshop_tenant_fk' }),
  foreignKey({ columns: [table.organizationId, table.repairOrderId], foreignColumns: [repairOrders.organizationId, repairOrders.id], name: 'repair_expenses_repair_tenant_fk' }),
  uniqueIndex('repair_expenses_purchase_line_unique').on(table.purchaseLineId).where(sql`${table.purchaseLineId} is not null`),
  index('repair_expenses_repair_order_id_idx').on(table.repairOrderId),
  check('repair_expenses_amount_check', sql`${table.amount} >= 0`),
]);

export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  code: varchar('code', { length: 40 }).notNull(),
  status: saleStatusEnum('status').notNull().default('draft'),
  subtotal: money('subtotal').notNull().default('0'),
  discount: money('discount').notNull().default('0'),
  total: money('total').notNull().default('0'),
  soldAt: timestamp('sold_at', { withTimezone: true }).notNull().defaultNow(),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidedBy: uuid('voided_by').references(() => users.id, { onDelete: 'set null' }),
  voidReason: text('void_reason'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('sales_organization_id_id_unique').on(table.organizationId, table.id),
  unique('sales_workshop_code_unique').on(table.workshopId, table.code),
  index('sales_workshop_status_sold_at_idx').on(table.workshopId, table.status, table.soldAt),
  index('sales_customer_id_idx').on(table.customerId),
  check('sales_amounts_check', sql`${table.subtotal} >= 0 and ${table.discount} >= 0 and ${table.total} >= 0 and ${table.total} = ${table.subtotal} - ${table.discount}`),
]);

export const saleLines = pgTable('sale_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleId: uuid('sale_id').notNull().references(() => sales.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  skuSnapshot: varchar('sku_snapshot', { length: 80 }),
  nameSnapshot: varchar('name_snapshot', { length: 200 }).notNull(),
  quantity: quantity('quantity').notNull(),
  unitPrice: money('unit_price').notNull(),
  discount: money('discount').notNull().default('0'),
  unitCostSnapshot: money('unit_cost_snapshot').notNull().default('0'),
  inventoryMovementId: uuid('inventory_movement_id'),
  createdAt: createdAt(),
}, (table) => [
  index('sale_lines_sale_id_idx').on(table.saleId),
  index('sale_lines_product_id_idx').on(table.productId),
  check('sale_lines_quantity_check', sql`${table.quantity} > 0`),
  check('sale_lines_money_check', sql`${table.unitPrice} >= 0 and ${table.discount} >= 0 and ${table.unitCostSnapshot} >= 0`),
]);

export const saleReturns = pgTable('sale_returns', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  saleId: uuid('sale_id').notNull().references(() => sales.id, { onDelete: 'restrict' }),
  code: varchar('code', { length: 40 }).notNull(),
  status: returnStatusEnum('status').notNull().default('draft'),
  reason: text('reason').notNull(),
  returnedAt: timestamp('returned_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('sale_returns_organization_id_id_unique').on(table.organizationId, table.id),
  unique('sale_returns_workshop_code_unique').on(table.workshopId, table.code),
  index('sale_returns_sale_id_idx').on(table.saleId),
]);

export const saleReturnLines = pgTable('sale_return_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleReturnId: uuid('sale_return_id').notNull().references(() => saleReturns.id, { onDelete: 'restrict' }),
  saleLineId: uuid('sale_line_id').notNull().references(() => saleLines.id, { onDelete: 'restrict' }),
  quantity: quantity('quantity').notNull(),
  unitPriceSnapshot: money('unit_price_snapshot').notNull(),
  unitCostSnapshot: money('unit_cost_snapshot').notNull(),
  inventoryMovementId: uuid('inventory_movement_id'),
  createdAt: createdAt(),
}, (table) => [
  index('sale_return_lines_return_id_idx').on(table.saleReturnId),
  index('sale_return_lines_sale_line_id_idx').on(table.saleLineId),
  check('sale_return_lines_quantity_check', sql`${table.quantity} > 0`),
  check('sale_return_lines_costs_check', sql`${table.unitPriceSnapshot} >= 0 and ${table.unitCostSnapshot} >= 0`),
]);

export const purchases = pgTable('purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  code: varchar('code', { length: 40 }).notNull(),
  status: purchaseStatusEnum('status').notNull().default('draft'),
  purchasedOn: date('purchased_on').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  subtotal: money('subtotal').notNull().default('0'),
  discount: money('discount').notNull().default('0'),
  total: money('total').notNull().default('0'),
  notes: text('notes'),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidedBy: uuid('voided_by').references(() => users.id, { onDelete: 'set null' }),
  voidReason: text('void_reason'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('purchases_organization_id_id_unique').on(table.organizationId, table.id),
  unique('purchases_workshop_code_unique').on(table.workshopId, table.code),
  index('purchases_workshop_status_date_idx').on(table.workshopId, table.status, table.purchasedOn),
  index('purchases_supplier_id_idx').on(table.supplierId),
  check('purchases_amounts_check', sql`${table.subtotal} >= 0 and ${table.discount} >= 0 and ${table.total} >= 0 and ${table.total} = ${table.subtotal} - ${table.discount}`),
]);

export const purchaseLines = pgTable('purchase_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  workshopId: uuid('workshop_id').notNull(),
  purchaseId: uuid('purchase_id').notNull().references(() => purchases.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  repairOrderId: uuid('repair_order_id').references(() => repairOrders.id, { onDelete: 'restrict' }),
  destination: purchaseLineDestinationEnum('destination').notNull(),
  description: varchar('description', { length: 240 }).notNull(),
  quantity: quantity('quantity').notNull(),
  unitCost: money('unit_cost').notNull(),
  inventoryMovementId: uuid('inventory_movement_id'),
  createdAt: createdAt(),
}, (table) => [
  foreignKey({ columns: [table.organizationId, table.workshopId], foreignColumns: [workshops.organizationId, workshops.id], name: 'purchase_lines_workshop_tenant_fk' }),
  foreignKey({ columns: [table.organizationId, table.purchaseId], foreignColumns: [purchases.organizationId, purchases.id], name: 'purchase_lines_purchase_tenant_fk' }),
  foreignKey({ columns: [table.organizationId, table.repairOrderId], foreignColumns: [repairOrders.organizationId, repairOrders.id], name: 'purchase_lines_repair_tenant_fk' }),
  foreignKey({ columns: [table.workshopId, table.productId], foreignColumns: [products.workshopId, products.id], name: 'purchase_lines_product_workshop_fk' }),
  unique('purchase_lines_organization_id_id_unique').on(table.organizationId, table.id),
  index('purchase_lines_purchase_id_idx').on(table.purchaseId),
  index('purchase_lines_product_id_idx').on(table.productId),
  index('purchase_lines_repair_order_id_idx').on(table.repairOrderId),
  check('purchase_lines_quantity_check', sql`${table.quantity} > 0`),
  check('purchase_lines_unit_cost_check', sql`${table.unitCost} >= 0`),
  check('purchase_lines_destination_check', sql`(${table.destination} = 'inventory' and ${table.repairOrderId} is null) or (${table.destination} = 'repair_direct' and ${table.repairOrderId} is not null)`),
]);

export const purchaseReturns = pgTable('purchase_returns', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  purchaseId: uuid('purchase_id').notNull().references(() => purchases.id, { onDelete: 'restrict' }),
  code: varchar('code', { length: 40 }).notNull(),
  status: returnStatusEnum('status').notNull().default('draft'),
  reason: text('reason').notNull(),
  returnedAt: timestamp('returned_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('purchase_returns_organization_id_id_unique').on(table.organizationId, table.id),
  unique('purchase_returns_workshop_code_unique').on(table.workshopId, table.code),
  index('purchase_returns_purchase_id_idx').on(table.purchaseId),
]);

export const purchaseReturnLines = pgTable('purchase_return_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseReturnId: uuid('purchase_return_id').notNull().references(() => purchaseReturns.id, { onDelete: 'restrict' }),
  purchaseLineId: uuid('purchase_line_id').notNull().references(() => purchaseLines.id, { onDelete: 'restrict' }),
  quantity: quantity('quantity').notNull(),
  unitCostSnapshot: money('unit_cost_snapshot').notNull(),
  inventoryMovementId: uuid('inventory_movement_id'),
  createdAt: createdAt(),
}, (table) => [
  index('purchase_return_lines_return_id_idx').on(table.purchaseReturnId),
  index('purchase_return_lines_purchase_line_id_idx').on(table.purchaseLineId),
  check('purchase_return_lines_quantity_check', sql`${table.quantity} > 0`),
  check('purchase_return_lines_cost_check', sql`${table.unitCostSnapshot} >= 0`),
]);

export const operatingExpenses = pgTable('operating_expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  category: varchar('category', { length: 120 }).notNull(),
  payee: varchar('payee', { length: 160 }),
  description: varchar('description', { length: 240 }).notNull(),
  amount: money('amount').notNull(),
  incurredOn: date('incurred_on').notNull(),
  costCenter: varchar('cost_center', { length: 120 }),
  status: expenseStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidedBy: uuid('voided_by').references(() => users.id, { onDelete: 'set null' }),
  voidReason: text('void_reason'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('operating_expenses_organization_id_id_unique').on(table.organizationId, table.id),
  index('operating_expenses_workshop_status_date_idx').on(table.workshopId, table.status, table.incurredOn),
  check('operating_expenses_amount_check', sql`${table.amount} > 0`),
]);

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  code: paymentMethodEnum('code').notNull(),
  label: varchar('label', { length: 80 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  accountReference: varchar('account_reference', { length: 160 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [unique('payment_methods_workshop_code_unique').on(table.workshopId, table.code)]);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  direction: paymentDirectionEnum('direction').notNull(),
  method: paymentMethodEnum('method').notNull(),
  amount: money('amount').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  externalReference: varchar('external_reference', { length: 160 }),
  status: paymentStatusEnum('status').notNull().default('pending'),
  note: text('note'),
  idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull(),
  reversedPaymentId: uuid('reversed_payment_id'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  unique('payments_organization_id_id_unique').on(table.organizationId, table.id),
  unique('payments_workshop_idempotency_key_unique').on(table.workshopId, table.idempotencyKey),
  index('payments_workshop_status_paid_at_idx').on(table.workshopId, table.status, table.paidAt),
  index('payments_reversed_payment_id_idx').on(table.reversedPaymentId),
  foreignKey({ columns: [table.organizationId, table.reversedPaymentId], foreignColumns: [table.organizationId, table.id], name: 'payments_reversal_same_tenant_fk' }),
  uniqueIndex('payments_single_reversal_unique').on(table.reversedPaymentId).where(sql`${table.reversedPaymentId} is not null`),
  check('payments_amount_check', sql`${table.amount} > 0`),
]);

export const paymentAllocations = pgTable('payment_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'restrict' }),
  repairOrderId: uuid('repair_order_id').references(() => repairOrders.id, { onDelete: 'restrict' }),
  saleId: uuid('sale_id').references(() => sales.id, { onDelete: 'restrict' }),
  purchaseId: uuid('purchase_id').references(() => purchases.id, { onDelete: 'restrict' }),
  operatingExpenseId: uuid('operating_expense_id').references(() => operatingExpenses.id, { onDelete: 'restrict' }),
  purchaseLineId: uuid('purchase_line_id'),
  repairExpenseId: uuid('repair_expense_id'),
  amount: money('amount').notNull(),
  createdAt: createdAt(),
}, (table) => [
  index('payment_allocations_payment_id_idx').on(table.paymentId),
  index('payment_allocations_repair_order_id_idx').on(table.repairOrderId),
  index('payment_allocations_sale_id_idx').on(table.saleId),
  index('payment_allocations_purchase_id_idx').on(table.purchaseId),
  index('payment_allocations_expense_id_idx').on(table.operatingExpenseId),
  index('payment_allocations_purchase_line_id_idx').on(table.purchaseLineId),
  index('payment_allocations_repair_expense_id_idx').on(table.repairExpenseId),
  foreignKey({ columns: [table.purchaseLineId], foreignColumns: [purchaseLines.id], name: 'payment_allocations_purchase_line_fk' }),
  foreignKey({ columns: [table.repairExpenseId], foreignColumns: [repairExpenses.id], name: 'payment_allocations_repair_expense_fk' }),
  check('payment_allocations_amount_check', sql`${table.amount} > 0`),
  check('payment_allocations_one_document_check', sql`(case when ${table.repairOrderId} is not null then 1 else 0 end + case when ${table.saleId} is not null then 1 else 0 end + case when ${table.purchaseId} is not null then 1 else 0 end + case when ${table.operatingExpenseId} is not null then 1 else 0 end + case when ${table.purchaseLineId} is not null then 1 else 0 end + case when ${table.repairExpenseId} is not null then 1 else 0 end) = 1`),
]);

export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'restrict' }),
  workshopId: uuid('workshop_id').notNull().references(() => workshops.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  stockLocationId: uuid('stock_location_id').notNull().references(() => stockLocations.id, { onDelete: 'restrict' }),
  movementType: inventoryMovementTypeEnum('movement_type').notNull(),
  quantityDelta: quantity('quantity_delta').notNull(),
  unitCostApplied: numeric('unit_cost_applied', { precision: 18, scale: 6 }).notNull(),
  totalCostApplied: money('total_cost_applied').notNull(),
  quantityBefore: quantity('quantity_before').notNull(),
  quantityAfter: quantity('quantity_after').notNull(),
  inventoryValueBefore: money('inventory_value_before').notNull(),
  inventoryValueAfter: money('inventory_value_after').notNull(),
  reason: varchar('reason', { length: 240 }).notNull(),
  referenceType: varchar('reference_type', { length: 64 }).notNull(),
  referenceId: uuid('reference_id').notNull(),
  reversesMovementId: uuid('reverses_movement_id'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
}, (table) => [
  index('inventory_movements_product_created_idx').on(table.productId, table.createdAt),
  index('inventory_movements_location_created_idx').on(table.stockLocationId, table.createdAt),
  index('inventory_movements_reference_idx').on(table.referenceType, table.referenceId),
  unique('inventory_movements_reference_unique').on(table.referenceType, table.referenceId, table.productId, table.stockLocationId),
  uniqueIndex('inventory_movements_single_reversal_unique').on(table.reversesMovementId).where(sql`${table.reversesMovementId} is not null`),
  foreignKey({ columns: [table.reversesMovementId], foreignColumns: [table.id], name: 'inventory_movements_reversal_fk' }),
  check('inventory_movements_costs_check', sql`${table.unitCostApplied} >= 0 and ${table.totalCostApplied} >= 0 and ${table.inventoryValueBefore} >= 0 and ${table.inventoryValueAfter} >= 0`),
  check('inventory_movements_balance_check', sql`${table.quantityAfter} >= 0`),
]);
