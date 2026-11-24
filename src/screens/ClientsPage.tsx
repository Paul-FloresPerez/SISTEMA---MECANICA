'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, User } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { CustomerForm, type CustomerView } from './CustomerForm';

export function ClientsPage({ customers, query, canWrite }: { customers: CustomerView[]; query: string; canWrite: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><form className="relative flex max-w-md flex-1" action="/clientes"><label htmlFor="client-search" className="sr-only">Buscar cliente</label><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input id="client-search" name="q" type="search" defaultValue={query} placeholder="Buscar nombre, teléfono o documento..." className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-800 dark:bg-[#131822]" /><button className="ml-2 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700">Buscar</button></form>{canWrite && <button onClick={() => setOpen(true)} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" />Nuevo cliente</button>}</div>
  {customers.length === 0 ? <EmptyState icon={User} title={query ? 'No se encontraron clientes' : 'Aún no hay clientes'} description={query ? 'Prueba otra búsqueda.' : 'Registra el primer cliente del taller.'} {...(canWrite && !query ? { actionLabel: 'Nuevo cliente', onAction: () => setOpen(true) } : {})} /> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{customers.map(customer => <article key={customer.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#131822]"><div><h2 className="text-sm font-bold">{customer.name}</h2><p className="mt-1 text-xs text-slate-500">{customer.phone || 'Sin teléfono'} · Doc. {customer.documentId || 'No registrado'}</p></div><Link href={`/clientes/${customer.id}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold dark:border-slate-700 dark:bg-[#0F141C]">Ver perfil →</Link></article>)}</div>}
  <Modal open={open} onClose={() => setOpen(false)} title="Registrar nuevo cliente"><CustomerForm onCancel={() => setOpen(false)} /></Modal></div>;
}
