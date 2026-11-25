'use server';
import { changePassword } from '@/src/auth/change-password';

export async function changePasswordAction(_state: { message: string; success: boolean }, formData: FormData) {
  const current = formData.get('current');
  const next = formData.get('next');
  const confirm = formData.get('confirm');
  if (typeof next !== 'string' || next !== confirm) return { message: 'Las contraseñas nuevas no coinciden.', success: false };
  try {
    await changePassword(current, next);
    return { message: 'Contraseña actualizada. Las demás sesiones se cerraron.', success: true };
  } catch {
    return { message: 'No se pudo actualizar. Comprueba la contraseña actual y que la nueva tenga entre 12 y 1024 caracteres y sea distinta.', success: false };
  }
}
