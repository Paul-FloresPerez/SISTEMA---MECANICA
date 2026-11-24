import 'server-only';
import { and, eq, or, ilike } from 'drizzle-orm';
import { dbQuery, dbTx } from '../db/client';
import { customers } from '../db/schema';
import { requirePermission } from '../auth/authorization';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listCustomers(search = '') {
  const session = await requirePermission('customers:read');
  const q = search.trim().slice(0, 100).replace(/[\\%_]/g, '\\$&');
  return dbQuery.select({ id: customers.id, name: customers.fullName, phone: customers.phone, email: customers.email, documentId: customers.documentNumber, notes: customers.notes, createdAt: customers.createdAt }).from(customers).where(and(eq(customers.organizationId, session.organizationId), eq(customers.workshopId, session.workshopId), eq(customers.isActive, true), q ? or(ilike(customers.fullName, `%${q}%`), ilike(customers.phone, `%${q}%`), ilike(customers.documentNumber, `%${q}%`), ilike(customers.email, `%${q}%`)) : undefined)).orderBy(customers.fullName);
}

export async function getCustomer(id: string) {
  const session = await requirePermission('customers:read');
  if (!uuid.test(id)) return null;
  const rows = await dbQuery.select({ id: customers.id, name: customers.fullName, phone: customers.phone, email: customers.email, documentId: customers.documentNumber, notes: customers.notes, createdAt: customers.createdAt }).from(customers).where(and(eq(customers.id, id), eq(customers.organizationId, session.organizationId), eq(customers.workshopId, session.workshopId), eq(customers.isActive, true))).limit(1);
  return rows[0] ?? null;
}

export async function saveCustomer(input: { id?: string; name: string; phone: string; email: string; documentId: string; notes: string }) {
  const session = await requirePermission('customers:write');
  if (typeof input !== 'object' || !input || (input.id !== undefined && (typeof input.id !== 'string' || !uuid.test(input.id)))) throw new Error('Datos inválidos.');
  const fields = ['name', 'phone', 'email', 'documentId', 'notes'] as const;
  if (fields.some(key => typeof input[key] !== 'string')) throw new Error('Datos inválidos.');
  const name = input.name.trim(), phone = input.phone.trim(), email = input.email.trim(), documentId = input.documentId.trim(), notes = input.notes.trim();
  if (!name || name.length > 160 || phone.length > 32 || email.length > 320 || documentId.length > 32 || notes.length > 2000 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error('Comprueba los datos ingresados.');
  const values = { fullName: name, phone: phone || null, email: email || null, documentNumber: documentId || null, notes: notes || null };
  if (input.id) {
    const rows = await dbTx.update(customers).set({ ...values, updatedAt: new Date() }).where(and(eq(customers.id, input.id), eq(customers.organizationId, session.organizationId), eq(customers.workshopId, session.workshopId), eq(customers.isActive, true))).returning({ id: customers.id });
    if (!rows[0]) throw new Error('Cliente no encontrado.');
    return rows[0];
  }
  const rows = await dbTx.insert(customers).values({ ...values, organizationId: session.organizationId, workshopId: session.workshopId, createdBy: session.userId }).returning({ id: customers.id });
  return rows[0];
}
