'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Modal } from '../components/common/Modal';
import { CustomerForm, type CustomerView } from './CustomerForm';

export function ClientDetailPage({ customer, canWrite }: { customer: CustomerView; canWrite: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className="mx-auto max-w-5xl space-y-6"><div className="flex items-center justify-between"><Link href="/clientes" className="text-xs font-semibold text-slate-600 dark:text-slate-300">← Volver a clientes</Link>{canWrite && <button onClick={() => setOpen(true)} className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white">Editar cliente</button>}</div>
  <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#131822]"><p className="text-xs text-slate-500">Doc. {customer.documentId || 'No registrado'}</p><h2 className="mt-2 text-xl font-bold">{customer.name}</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{customer.phone || 'Sin teléfono'}{customer.email ? ` · ${customer.email}` : ''}</p>{customer.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-slate-500">{customer.notes}</p>}</section>
  <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#131822]"><h3 className="text-sm font-bold">Motocicletas y reparaciones</h3><p className="mt-2 text-xs text-slate-500">La información de motocicletas y reparaciones estará disponible cuando se conecten esos módulos.</p></section>
  <Modal open={open} onClose={() => setOpen(false)} title="Editar cliente"><CustomerForm customer={customer} onCancel={() => setOpen(false)} /></Modal></div>;
}
