'use server';
import { revalidatePath } from 'next/cache';
import { createUser, updateUser, resetUserPassword } from '@/src/users/service';

export async function createUserAction(input: { name: string; username: string; email: string; password: string; role: string }) {
  try {
    await createUser(input);
    revalidatePath('/configuracion');
    return { error: '' };
  } catch {
    return { error: 'No se pudo crear la cuenta. Revisa los datos, tus permisos y que el usuario o correo no estén registrados.' };
  }
}

export async function resetPasswordAction(id: string, password: string) {
  try {
    await resetUserPassword(id, password);
    revalidatePath('/configuracion');
    return { error: '' };
  } catch {
    return { error: 'No se pudo restablecer la contraseña. Revisa tus permisos y los datos ingresados.' };
  }
}

export async function updateUserAction(input: { id: string; name: string; email: string; role: string; active: boolean }) {
  try {
    await updateUser(input);
    revalidatePath('/configuracion');
    return { error: '' };
  } catch {
    return { error: 'No se pudo actualizar la cuenta. Revisa los datos, tus permisos y que quede un administrador activo.' };
  }
}
