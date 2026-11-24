'use client';

import React from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useWorkshop } from '../../context/WorkshopContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useWorkshop();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 lg:bottom-5 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-80 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.tone === 'warning'
            ? AlertTriangle
            : toast.tone === 'info'
            ? Info
            : CheckCircle2;
        const accentClass =
          toast.tone === 'warning'
            ? 'text-amber-600 dark:text-amber-400'
            : toast.tone === 'info'
            ? 'text-sky-600 dark:text-sky-400'
            : 'text-emerald-600 dark:text-emerald-400';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-[#131822] border border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${accentClass}`} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {toast.title}
              </p>
              {toast.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Cerrar notificación"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
