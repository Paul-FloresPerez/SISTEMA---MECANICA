'use server';
import { changePassword } from '@/src/auth/change-password';
import { getSession } from '@/src/auth/session';
import { redirect } from 'next/navigation';

export async function changePasswordAction(_state: { message: string; success: boolean }, formData: FormData) {
  const current = formData.get('current');
  const next = formData.get('next');
  const confirm = formData.get('confirm');
  if (typeof next !== 'string' || next !== confirm) return { message: 'Las contraseñas nuevas no coinciden.', success: false };
  const session = await getSession();
  let changed = false;
  try {
    await changePassword(current, next);
    changed = true;
  } catch {
    return { message: 'No se pudo actualizar. Comprueba la contraseña actual y que la nueva tenga entre 12 y 1024 caracteres y sea distinta.', success: false };
  }
  if (changed && session?.mustChangePassword) redirect('/');
  return { message: 'Contraseña actualizada. Las demás sesiones se cerraron.', success: true };
}
