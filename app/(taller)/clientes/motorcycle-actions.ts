'use server';
import { revalidatePath } from 'next/cache';
import { saveMotorcycle, type MotorcycleInput } from '@/src/motorcycles/service';

export async function saveMotorcycleAction(input: MotorcycleInput) {
  try {
    await saveMotorcycle(input);
    revalidatePath(`/clientes/${input.customerId}`);
    return { error: '' };
  } catch {
    return { error: 'No se pudo guardar. Verifica los datos, que la placa o el VIN no estén registrados y tus permisos.' };
  }
}
