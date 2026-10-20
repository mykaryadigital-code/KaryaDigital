import React, { useState } from 'react';
import {
  X,
  Building2,
  QrCode,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Lock,
  ArrowRight,
  Flame,
  BadgeCheck,
} from 'lucide-react';

interface BclPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  billData: {
    orderId: string;
    billCode: string;
    bookTitle: string;
    amount: number;
    paymentUrl: string;
    isSandbox: boolean;
    userEmail: string;
    gateway?: string;
  } | null;
  onPaymentSuccess: (orderId: string, billCode: string) => void;
}

const FPX_BANKS = [
  { id: 'MBB', name: 'Maybank2u', code: 'MBB0228', bg: 'bg-amber-400 text-slate-900 border-amber-500' },
  { id: 'CIMB', name: 'CIMB Clicks', code: 'BCBB0235', bg: 'bg-red-600 text-white border-red-700' },
  { id: 'BIMB', name: 'Bank Islam', code: 'BIMB0340', bg: 'bg-emerald-700 text-white border-emerald-800' },
  { id: 'RHB', name: 'RHB Now', code: 'RHB0218', bg: 'bg-blue-600 text-white border-blue-700' },
  { id: 'PBB', name: 'Public Bank', code: 'PBB0233', bg: 'bg-rose-600 text-white border-rose-700' },
  { id: 'HLB', name: 'Hong Leong', code: 'HLBB0224', bg: 'bg-blue-800 text-white border-blue-900' },
  { id: 'AMB', name: 'AmBank', code: 'AMBB0209', bg: 'bg-red-500 text-white border-red-600' },
  { id: 'BSN', name: 'Bank Simpanan Nasional', code: 'BSN0601', bg: 'bg-teal-600 text-white border-teal-700' },
];

export const BclPaymentModal: React.FC<BclPaymentModalProps> = ({
  isOpen,
  onClose,
  billData,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'fpx' | 'duitnow' | 'ewallet'>('fpx');
  const [selectedBank, setSelectedBank] = useState('MBB');
  const [selectedWallet, setSelectedWallet] = useState('tng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [transactionRef, setTransactionRef] = useState('');

  if (!isOpen || !billData) return null;

  // Hantar Webhook BCL (Bayarcash Commerce Layer Callback)
  const handleSimulateBclSuccess = async () => {
    setIsProcessing(true);
    setStatusMessage('Menghubungi Webhook Pelayan BCL (Bayarcash Commerce Layer)...');

    try {
      const response = await fetch('/api/payment/bcl-simulate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billCode: billData.billCode,
          orderId: billData.orderId,
          status: 'SUCCESS',
        }),
      });

      const data = await response.json();

      if (data.success) {
        const txnId = `BCL-TXN-${Date.now().toString().slice(-6)}`;
        setTransactionRef(txnId);
        setPaymentStatus('success');
        setStatusMessage('Bayaran BCL berjaya disahkan! Rekod telah disimpan secara automatik dalam Firebase & pangkalan data.');
        onPaymentSuccess(billData.orderId, billData.billCode);
      } else {
        setPaymentStatus('failed');
        setStatusMessage(data.error || 'Pengesahan bayaran BCL tidak berjaya.');
      }
    } catch (err: any) {
      setPaymentStatus('failed');
      setStatusMessage('Ralat rangkaian semasa menghubungi BCL: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="BCL Bayarcash Commerce Layer Gateway"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* BCL Branded Header */}
        <div className="bg-gradient-to-r from-sky-700 via-blue-800 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-sky-700 flex items-center justify-center font-black text-xl shadow-md tracking-tighter">
              BCL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">Bayarcash Commerce Layer</h3>
                <span className="text-[10px] font-semibold bg-sky-400/20 text-sky-200 border border-sky-300/30 px-2 py-0.5 rounded-full">
                  bcl.my
                </span>
              </div>
              <p className="text-xs text-sky-200 flex items-center gap-1 mt-0.5">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-300" />
                Patuh Syariah &bull; Real-time FPX &bull; DuitNow QR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-sky-200 hover:text-white hover:bg-white/10 rounded-xl transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ringkasan Bil Pembelian */}
        <div className="bg-sky-50/70 border-b border-sky-100 p-4 px-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-sky-800 uppercase tracking-wider">Invois BCL</div>
            <div className="text-sm font-bold text-slate-800 truncate max-w-[220px]">
              {billData.bookTitle}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              Ref: {billData.billCode}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-slate-500">Jumlah Bayaran</div>
            <div className="text-2xl font-black text-sky-700 font-mono">
              RM {billData.amount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Kandungan Mengikut Status Bayaran */}
        <div className="p-6">
          {paymentStatus === 'idle' && (
            <div>
              {/* Tab Kaedah Bayaran BCL */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('fpx')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'fpx'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  FPX Bank
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('duitnow')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'duitnow'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  DuitNow QR
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ewallet')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'ewallet'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  E-Wallet
                </button>
              </div>

              {/* Tab 1: FPX Online Banking */}
              {activeTab === 'fpx' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Pilih Bank Tempatan:</span>
                    <span className="font-semibold text-sky-600">FPX Direct Debit</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {FPX_BANKS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBank(b.id)}
                        className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                          selectedBank === b.id
                            ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-400/30'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">{b.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{b.code}</div>
                        </div>
                        {selectedBank === b.id && (
                          <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: DuitNow QR */}
              {activeTab === 'duitnow' && (
                <div className="text-center space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="inline-block bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    {/* Mock DuitNow QR Frame */}
                    <div className="w-44 h-44 bg-pink-50 border-2 border-pink-500 rounded-lg flex flex-col items-center justify-center p-2 relative">
                      <div className="text-[10px] font-black text-pink-600 tracking-wider uppercase mb-1">
                        DuitNow QR
                      </div>
                      <div className="w-32 h-32 bg-white rounded border border-pink-200 flex items-center justify-center p-1">
                        <QrCode className="w-28 h-28 text-slate-800" />
                      </div>
                      <div className="text-[8px] text-slate-500 mt-1 font-mono">
                        BCL-{billData.billCode.slice(-6)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">
                    Imbas menggunakan sebarang aplikasi perbankan (Maybank, CIMB, TNG, dll.)
                  </div>
                </div>
              )}

              {/* Tab 3: E-Wallet */}
              {activeTab === 'ewallet' && (
                <div className="space-y-2">
                  {[
                    { id: 'tng', name: "Touch 'n Go eWallet", desc: 'Bayaran pantas imbas PIN / Kod BCL' },
                    { id: 'boost', name: 'Boost eWallet', desc: 'Bayaran segera melalui aplikasi Boost' },
                    { id: 'grab', name: 'GrabPay', desc: 'Gunakan baki GrabPay Wallet anda' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWallet(w.id)}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        selectedWallet === w.id
                          ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-300/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-800">{w.name}</div>
                        <div className="text-xs text-slate-500">{w.desc}</div>
                      </div>
                      {selectedWallet === w.id && (
                        <CheckCircle2 className="w-4 h-4 text-sky-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Butang Sahkan Bayaran (Simulasi BCL) */}
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleSimulateBclSuccess}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/25 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mengesahkan Bayaran BCL...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Sahkan Bayaran BCL (Simulasi FPX)</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                {billData.paymentUrl && !billData.isSandbox && (
                  <a
                    href={billData.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition flex items-center justify-center gap-1.5 text-xs text-center"
                  >
                    <span>Buka Portal Rasmi Bayarcash (bcl.my)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>Disulitkan SSL 256-bit &bull; Patuh Standard BNM & BCL Malaysia</span>
              </div>
            </div>
          )}

          {/* Status Berjaya */}
          {paymentStatus === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900">Bayaran BCL Berjaya!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {statusMessage}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Gerbang Bayaran:</span>
                  <span className="font-bold text-sky-700">BCL (Bayarcash)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">ID Pesanan:</span>
                  <span className="font-bold">{billData.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">No. Rujukan TXN:</span>
                  <span className="font-bold text-slate-900">{transactionRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Pangkalan Data:</span>
                  <span className="text-emerald-700 font-bold font-sans flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Firebase Firestore & Supabase
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
              >
                <span>Buka & Baca E-Buku Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Status Gagal */}
          {paymentStatus === 'failed' && (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Transaksi BCL Tidak Berjaya</h4>
              <p className="text-xs text-rose-600">{statusMessage}</p>
              <button
                type="button"
                onClick={() => setPaymentStatus('idle')}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Cuba Sekali Lagi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
