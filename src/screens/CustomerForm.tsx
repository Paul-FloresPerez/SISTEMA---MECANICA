'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCustomerAction } from '@/app/(taller)/clientes/actions';

export type CustomerView = { id: string; name: string; phone: string | null; email: string | null; documentId: string | null; notes: string | null; createdAt: Date };
const fieldClass = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-[#0F141C]';

export function CustomerForm({ customer, onCancel }: { customer?: CustomerView; onCancel: () => void }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true); setError('');
    try {
      const result = await saveCustomerAction({ id: customer?.id, name: String(data.get('name') ?? ''), phone: String(data.get('phone') ?? ''), email: String(data.get('email') ?? ''), documentId: String(data.get('documentId') ?? ''), notes: String(data.get('notes') ?? '') });
      if (result.error) { setError(result.error); return; }
      onCancel(); router.push(`/clientes/${result.id}`); router.refresh();
    } catch { setError('No se pudo conectar. Intenta nuevamente.'); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="space-y-4"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <label className="block text-xs font-semibold">Nombre completo<input name="name" required maxLength={160} defaultValue={customer?.name ?? ''} className={`${fieldClass} mt-1`} /></label>
    <label className="block text-xs font-semibold">Teléfono / WhatsApp<input name="phone" type="tel" maxLength={32} defaultValue={customer?.phone ?? ''} className={`${fieldClass} mt-1`} /></label>
    <label className="block text-xs font-semibold">DNI / Documento<input name="documentId" maxLength={32} defaultValue={customer?.documentId ?? ''} className={`${fieldClass} mt-1`} /></label>
    <label className="block text-xs font-semibold">Correo electrónico<input name="email" type="email" maxLength={320} defaultValue={customer?.email ?? ''} className={`${fieldClass} mt-1`} /></label>
  </div><label className="block text-xs font-semibold">Notas del cliente<textarea name="notes" maxLength={2000} defaultValue={customer?.notes ?? ''} className={`${fieldClass} mt-1`} /></label>
  {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
  <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-xs font-semibold">Cancelar</button><button disabled={pending} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? 'Guardando…' : 'Guardar cliente'}</button></div></form>;
}
