'use server';
import { revalidatePath } from 'next/cache';
import { createUser } from '@/src/users/service';

export async function createUserAction(input: { name: string; username: string; email: string; password: string; role: string }) {
  try {
    await createUser(input);
    revalidatePath('/configuracion');
    return { error: '' };
  } catch {
    return { error: 'No se pudo crear la cuenta. Revisa los datos, tus permisos y que el usuario o correo no estén registrados.' };
  }
}
