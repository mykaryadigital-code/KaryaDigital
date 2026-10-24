import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2, WifiOff } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'badge' | 'full' | 'nav';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showGenericModal, setShowGenericModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running inside installed standalone PWA app, hide install CTA
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowGenericModal(true);
    }
  };

  if (installSuccess) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-semibold">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span>Berjaya Dipasang!</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'nav' ? (
        <button
          onClick={handleInstallClick}
          className={`group relative flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs sm:text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0 border border-indigo-400/30 ${className}`}
          title="Pasang aplikasi KaryaDigital pada telefon bimbit atau komputer anda"
          aria-label="Pasang Aplikasi Web KaryaDigital"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          </span>
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:-translate-y-0.5 transition-transform" />
          <span className="hidden xs:inline">Pasang App</span>
          <span className="xs:hidden">App</span>
          <span className="hidden md:inline-block text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-900/60 text-amber-300 border border-indigo-400/40 uppercase">
            PWA
          </span>
        </button>
      ) : variant === 'full' ? (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md hover:from-indigo-500 hover:to-indigo-700 transition active:scale-[0.99] cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4 text-amber-300" />
          <span>Pasang Aplikasi KaryaDigital (PWA)</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 text-xs font-semibold transition active:scale-95 cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
          <span>Pasang App</span>
        </button>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-800">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Smartphone className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pasang di iPhone / iPad</h3>
                <p className="text-xs text-slate-500">Akses pantas terus dari skrin utama</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              KaryaDigital boleh dipasang sebagai webapp tanpa perlu muat turun melalui App Store:
            </p>

            <ol className="space-y-3 text-xs text-slate-700 mb-6">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  Ketik butang <strong className="text-slate-900">Kongsi (Share)</strong>{' '}
                  <Share className="inline w-3.5 h-3.5 text-indigo-600 align-text-bottom mx-0.5" /> di bar bawah pelayar Safari anda.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold shrink-0 text-[11px]">
                  2
                </span>
                <div>
                  Skrol senarai tindakan ke bawah dan ketik{' '}
                  <strong className="text-slate-900">"Tambah ke Skrin Utama"</strong>{' '}
                  <PlusSquare className="inline w-3.5 h-3.5 text-indigo-600 align-text-bottom mx-0.5" /> (Add to Home Screen).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold shrink-0 text-[11px]">
                  3
                </span>
                <div>
                  Ketik <strong className="text-slate-900">"Tambah" (Add)</strong> di penjuru atas kanan skrin. Ikon KaryaDigital akan muncul di telefon anda!
                </div>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Faham, Terima Kasih
            </button>
          </div>
        </div>
      )}

      {/* Android & Desktop Guide Modal (When ambient prompt hasn't triggered or user clicks manual button) */}
      {showGenericModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-800">
            <button
              onClick={() => setShowGenericModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Download className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pasang KaryaDigital</h3>
                <p className="text-xs text-slate-500">Progressive Web App (PWA)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Anda boleh memasang aplikasi KaryaDigital terus ke skrin telefon Android atau komputer anda untuk bacaan luar talian dan pengalaman seperti app sebenar tanpa melalui Google Play Store.
            </p>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-4 space-y-2 text-xs text-slate-700">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pengguna Android (Chrome / Brave / Edge):</span>
              </div>
              <p className="text-slate-600 pl-5">
                Ketik menu <strong className="text-slate-900">tiga titik (⋮)</strong> di penjuru atas kanan pelayar, kemudian pilih <strong className="text-indigo-600">"Pasang aplikasi" (Install app)</strong> atau <strong className="text-indigo-600">"Tambah ke skrin Utama"</strong>.
              </p>
            </div>

            <button
              onClick={() => setShowGenericModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Faham & Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/40 animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
      <span>Mod Luar Talian — Buku yang telah dimuat turun sedia dibaca.</span>
    </div>
  );
};
