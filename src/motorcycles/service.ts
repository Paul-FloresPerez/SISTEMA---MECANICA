import 'server-only';
import { and, eq } from 'drizzle-orm';
import { dbQuery, dbTx } from '../db/client';
import { customers, motorcycles } from '../db/schema';
import { requirePermission } from '../auth/authorization';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type MotorcycleInput = { id?: string; customerId: string; brand: string; model: string; plate: string; vin: string; year: string; displacementCc: string; color: string; mileageKm: string };

export async function listMotorcycles(customerId: string) {
  const session = await requirePermission('motorcycles:read');
  if (!uuid.test(customerId)) return [];
  return dbQuery.select({ id: motorcycles.id, customerId: motorcycles.customerId, brand: motorcycles.brand, model: motorcycles.model, plate: motorcycles.plate, vin: motorcycles.vin, year: motorcycles.year, displacementCc: motorcycles.displacementCc, color: motorcycles.color, mileageKm: motorcycles.mileageKm }).from(motorcycles).innerJoin(customers, and(eq(customers.id, motorcycles.customerId), eq(customers.organizationId, motorcycles.organizationId), eq(customers.workshopId, motorcycles.workshopId), eq(customers.isActive, true))).where(and(eq(motorcycles.customerId, customerId), eq(motorcycles.organizationId, session.organizationId), eq(motorcycles.workshopId, session.workshopId))).orderBy(motorcycles.brand, motorcycles.model);
}

export async function saveMotorcycle(input: MotorcycleInput) {
  const session = await requirePermission('motorcycles:write');
  if (!input || typeof input !== 'object' || typeof input.customerId !== 'string' || !uuid.test(input.customerId) || (input.id !== undefined && (typeof input.id !== 'string' || !uuid.test(input.id)))) throw new Error('Datos inválidos.');
  const fields = ['brand', 'model', 'plate', 'vin', 'year', 'displacementCc', 'color', 'mileageKm'] as const;
  if (fields.some(key => typeof input[key] !== 'string')) throw new Error('Datos inválidos.');
  const brand = input.brand.trim(), model = input.model.trim(), plate = input.plate.trim().toUpperCase(), vin = input.vin.trim().toUpperCase(), color = input.color.trim();
  const parseInteger = (value: string) => /^\d+$/.test(value) ? Number(value) : NaN;
  const year = input.year.trim() ? parseInteger(input.year.trim()) : null;
  const displacementCc = input.displacementCc.trim() ? parseInteger(input.displacementCc.trim()) : null;
  const mileageKm = input.mileageKm.trim() ? parseInteger(input.mileageKm.trim()) : 0;
  if (!brand || brand.length > 80 || !model || model.length > 120 || plate.length > 16 || vin.length > 32 || color.length > 48 || (year !== null && (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1)) || (displacementCc !== null && (!Number.isInteger(displacementCc) || displacementCc < 1 || displacementCc > 2147483647)) || !Number.isInteger(mileageKm) || mileageKm < 0 || mileageKm > 2147483647) throw new Error('Comprueba los datos de la motocicleta.');
  return dbTx.transaction(async tx => {
    const owner = await tx.select({ id: customers.id }).from(customers).where(and(eq(customers.id, input.customerId), eq(customers.organizationId, session.organizationId), eq(customers.workshopId, session.workshopId), eq(customers.isActive, true))).limit(1).for('update');
    if (!owner[0]) throw new Error('Cliente no encontrado.');
    const values = { brand, model, plate: plate || null, vin: vin || null, year, displacementCc, color: color || null, mileageKm };
    if (input.id) {
      const rows = await tx.update(motorcycles).set({ ...values, updatedAt: new Date() }).where(and(eq(motorcycles.id, input.id), eq(motorcycles.customerId, input.customerId), eq(motorcycles.organizationId, session.organizationId), eq(motorcycles.workshopId, session.workshopId))).returning({ id: motorcycles.id });
      if (!rows[0]) throw new Error('Motocicleta no encontrada.');
      return rows[0];
    }
    return (await tx.insert(motorcycles).values({ ...values, customerId: input.customerId, organizationId: session.organizationId, workshopId: session.workshopId }).returning({ id: motorcycles.id }))[0];
  });
}
