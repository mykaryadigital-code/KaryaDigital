import React, { useState } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  FileCode,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface SecureAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle: string;
  userEmail: string;
}

export const SecureAssetModal: React.FC<SecureAssetModalProps> = ({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  userEmail,
}) => {
  const [signedUrl, setSignedUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Jana Signed URL daripada pelayan Backend
  const handleGenerateUrl = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setTestResult(null);

    try {
      const response = await fetch('/api/books/generate-signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, userEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setSignedUrl(data.signedUrl);
        setExpiresAt(data.expiresAt);
      } else {
        setErrorMessage(data.error || 'Gagal menjana pautan sementara.');
      }
    } catch (err: any) {
      setErrorMessage('Ralat rangkaian: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Uji pengesahan pautan sementara
  const handleTestLink = async () => {
    if (!signedUrl) return;

    try {
      const response = await fetch(signedUrl);
      const data = await response.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ error: 'Ralat menguji pautan: ' + err.message });
    }
  };

  const handleCopy = () => {
    if (!signedUrl) return;
    navigator.clipboard.writeText(window.location.origin + signedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Pautan Sementara Cloudflare R2"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-amber-300 flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight">Perlindungan Pautan Aset (Cloudflare R2)</h3>
              <p className="text-xs text-slate-300">Signed URL & Akses Masa Terhad (Anti-Pencurian)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Naskhah Terlindung:</div>
            <div className="font-extrabold text-sm text-slate-900">{bookTitle}</div>
            <div className="text-slate-500">Terikat kepada pembeli: <strong className="text-slate-800">{userEmail}</strong></div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2 text-indigo-950">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Bagaimana Ciri Ini Melindungi Hak Cipta Anda?</span>
            </div>
            <p className="leading-relaxed text-indigo-900/80">
              Pengguna tidak dibenarkan mengakses fail mentah e-book secara terbuka. Pautan yang dijana mengandungi token tandatangan kriptografi <strong>HMAC SHA-256</strong> atau <strong>AWS S3 Presigned URL</strong> yang sah selama <strong>30 minit sahaja</strong>. Sekiranya pautan disalin ke pihak ketiga selepas tamat tempoh, pelayan akan menolak capaian secara automatik.
            </p>
          </div>

          {/* Action to Generate */}
          {!signedUrl ? (
            <button
              onClick={handleGenerateUrl}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menjana Signed URL Cloudflare R2...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Jana Signed URL Sementara (Sah 30 Minit)</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-600 font-bold">
                  <span>Pautan Sementara yang Dijana:</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Sah selama 30 minit
                  </span>
                </div>
                <div className="p-3 bg-slate-900 text-amber-300 rounded-xl font-mono text-[11px] break-all border border-slate-800 select-all">
                  {signedUrl}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleCopy}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Pautan</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleTestLink}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Uji Pengesahan Token</span>
                </button>
              </div>

              {testResult && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1 animate-in fade-in duration-200">
                  <div className="font-bold flex items-center gap-1 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Status Pautan: {testResult.status || 'SAH'}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Mesej Pelayan: {testResult.message || JSON.stringify(testResult)}
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
