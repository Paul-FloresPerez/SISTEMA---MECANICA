'use server';
import { revalidatePath } from 'next/cache';
import { saveCustomer } from '@/src/customers/service';

export async function saveCustomerAction(input: { id?: string; name: string; phone: string; email: string; documentId: string; notes: string }) {
  try {
    const result = await saveCustomer(input);
    revalidatePath('/clientes');
    return { id: result.id, error: '' };
  } catch (error) {
    console.error('Error al guardar cliente:', error instanceof Error ? error.name : 'UnknownError');
    return { id: '', error: 'No se pudo guardar. Verifica los datos, el documento y tus permisos.' };
  }
}
