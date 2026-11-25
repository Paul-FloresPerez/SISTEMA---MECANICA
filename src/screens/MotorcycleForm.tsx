'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveMotorcycleAction } from '@/app/(taller)/clientes/motorcycle-actions';

export type MotorcycleView = { id: string; customerId: string; brand: string; model: string; plate: string | null; vin: string | null; year: number | null; displacementCc: number | null; color: string | null; mileageKm: number };
const style = 'mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-[#0F141C]';
export function MotorcycleForm({ customerId, motorcycle, onCancel }: { customerId: string; motorcycle?: MotorcycleView; onCancel: () => void }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? '');
    setError(''); setPending(true);
    try {
      const result = await saveMotorcycleAction({ id: motorcycle?.id, customerId, brand: value('brand'), model: value('model'), plate: value('plate'), vin: value('vin'), year: value('year'), displacementCc: value('displacementCc'), color: value('color'), mileageKm: value('mileageKm') });
      if (result.error) { setError(result.error); return; }
      onCancel(); router.refresh();
    } catch { setError('No se pudo conectar. Intenta nuevamente.'); } finally { setPending(false); }
  }
  return <form onSubmit={submit} className="space-y-4"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <label className="text-xs font-semibold">Marca<input name="brand" required maxLength={80} defaultValue={motorcycle?.brand ?? ''} className={style} /></label>
    <label className="text-xs font-semibold">Modelo<input name="model" required maxLength={120} defaultValue={motorcycle?.model ?? ''} className={style} /></label>
    <label className="text-xs font-semibold">Placa (opcional)<input name="plate" maxLength={16} defaultValue={motorcycle?.plate ?? ''} className={style} /></label>
    <label className="text-xs font-semibold">VIN (opcional)<input name="vin" maxLength={32} defaultValue={motorcycle?.vin ?? ''} className={style} /></label>
    <label className="text-xs font-semibold">Año<input name="year" type="number" min={1900} max={new Date().getFullYear() + 1} defaultValue={motorcycle?.year ?? ''} className={style} /></label>
    <label className="text-xs font-semibold">Cilindrada (cc)<input name="displacementCc" type="number" min={1} max={2147483647} defaultValue={motorcycle?.displacementCc ?? ''} className={style} /></label>
    <label className="text-xs font-semibold">Color<input name="color" maxLength={48} defaultValue={motorcycle?.color ?? ''} className={style} /></label>
    <label className="text-xs font-semibold">Kilometraje actual<input name="mileageKm" type="number" min={0} max={2147483647} defaultValue={motorcycle?.mileageKm ?? 0} className={style} /></label>
  </div>{error && <p role="alert" className="text-sm text-rose-600">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-xs font-semibold">Cancelar</button><button disabled={pending} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? 'Guardando…' : 'Guardar motocicleta'}</button></div></form>;
}
