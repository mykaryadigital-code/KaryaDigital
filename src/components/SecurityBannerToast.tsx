import React from 'react';
import { ShieldAlert, Lock, AlertTriangle, X } from 'lucide-react';
import { SecurityToastEvent } from '../types/ebook.ts';

interface SecurityBannerToastProps {
  toasts: SecurityToastEvent[];
  onDismiss: (id: string) => void;
}

export const SecurityBannerToast: React.FC<SecurityBannerToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-[calc(100vw-3rem)] pointer-events-none">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'shield' ? ShieldAlert : toast.type === 'warning' ? AlertTriangle : Lock;

        return (
          <div
            key={toast.id}
            role="alert"
            className="pointer-events-auto flex items-start gap-3 p-4 bg-slate-900/95 text-white border border-rose-500/40 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300"
          >
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-rose-400 tracking-wide uppercase">
                Perlindungan Hak Cipta Tempatan
              </div>
              <p className="text-sm text-slate-200 mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors shrink-0"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
