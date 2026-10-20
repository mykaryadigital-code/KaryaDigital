import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';

interface ToyyibPayModalProps {
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
  } | null;
  onPaymentSuccess: (orderId: string, billCode: string) => void;
}

const FPX_BANKS = [
  { id: 'MBB', name: 'Maybank2u', code: 'MBB0228', color: 'from-amber-400 to-yellow-500 text-slate-900' },
  { id: 'CIMB', name: 'CIMB Clicks', code: 'BCBB0235', color: 'from-red-600 to-red-800 text-white' },
  { id: 'BIMB', name: 'Bank Islam', code: 'BIMB0340', color: 'from-emerald-700 to-teal-900 text-white' },
  { id: 'RHB', name: 'RHB Now', code: 'RHB0218', color: 'from-blue-600 to-indigo-800 text-white' },
  { id: 'PBB', name: 'Public Bank', code: 'PBB0233', color: 'from-rose-600 to-red-700 text-white' },
  { id: 'HLB', name: 'Hong Leong', code: 'HLBB0224', color: 'from-blue-700 to-blue-900 text-white' },
];

export const ToyyibPayModal: React.FC<ToyyibPayModalProps> = ({
  isOpen,
  onClose,
  billData,
  onPaymentSuccess,
}) => {
  const [selectedBank, setSelectedBank] = useState('MBB');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen || !billData) return null;

  // Hantar Webhook ToyyibPay (status_id = '1' untuk SUCCESS)
  const handleSimulateToyyibPaySuccess = async () => {
    setIsProcessing(true);
    setStatusMessage('Menghantar callback ke pelayan ToyyibPay Webhook...');

    try {
      const response = await fetch('/api/payment/simulate-test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billCode: billData.billCode,
          status_id: '1', // Status 1 = SUCCESS dalam ToyyibPay
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentStatus('success');
        setStatusMessage('Respon Webhook ToyyibPay status_id=1 berjaya! Database Supabase telah dikemas kini.');
        onPaymentSuccess(billData.orderId, billData.billCode);
      } else {
        setPaymentStatus('failed');
        setStatusMessage(data.error || 'Gagal memproses pengesahan bayaran.');
      }
    } catch (err: any) {
      setPaymentStatus('failed');
      setStatusMessage('Ralat rangkaian: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="ToyyibPay Payment Gateway"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* ToyyibPay Official Branded Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-red-700 flex items-center justify-center font-black text-xl shadow-md">
              TP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight">ToyyibPay Payment Portal</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {billData.isSandbox ? 'Sandbox FPX' : 'FPX Rasmi'}
                </span>
              </div>
              <p className="text-xs text-rose-200">Gerbang Pembayaran Dalam Talian Malaysia</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
            aria-label="Tutup tetingkap pembayaran"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Summary Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium">No. Invois Bil:</span>
            <span className="font-mono font-bold text-slate-900 ml-1.5">{billData.billCode}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-medium">Jumlah:</span>
            <span className="text-base font-black text-red-700 ml-1.5">
              RM {billData.amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {paymentStatus === 'success' ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-slate-900">Bayaran FPX Berjaya Disahkan!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                ToyyibPay telah menghantar callback <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">status_id: 1</code> ke pelayan backend. Naskhah telah dibuka secara automatik dalam pangkalan data!
              </p>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left text-xs space-y-1.5">
                <div className="font-bold text-emerald-900">Perincian Transaksi:</div>
                <div className="flex justify-between text-slate-600">
                  <span>ID Pesanan:</span>
                  <span className="font-mono font-bold text-slate-900">{billData.orderId}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Kod Bil ToyyibPay:</span>
                  <span className="font-mono font-bold text-slate-900">{billData.billCode}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Penerima Hak:</span>
                  <span className="font-bold text-slate-900">{billData.userEmail}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Kembali ke Aplikasi & Baca Buku
              </button>
            </div>
          ) : (
            <>
              {/* Product Info */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Item Pembelian:</div>
                <div className="font-extrabold text-sm text-slate-900">{billData.bookTitle}</div>
                <div className="text-slate-500 text-[11px]">Pembeli: {billData.userEmail}</div>
              </div>

              {/* Malaysian FPX Bank Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Pilih Bank Perbankan Dalam Talian (FPX):</span>
                  <span className="text-[10px] text-slate-400 font-normal">B2C Internet Banking</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FPX_BANKS.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBank(bank.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                        selectedBank === bank.id
                          ? 'border-red-600 bg-red-50/50 shadow-2xs font-bold text-red-950'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${bank.color} flex items-center justify-center text-[9px] font-black shrink-0`}>
                        {bank.id.substring(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs truncate">{bank.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Message if any */}
              {statusMessage && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  paymentStatus === 'failed' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Actions: Simulate ToyyibPay Webhook Callback */}
              <div className="pt-2 space-y-2.5">
                <button
                  onClick={handleSimulateToyyibPaySuccess}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-xl bg-red-700 hover:bg-red-600 disabled:bg-slate-400 text-white font-bold text-xs shadow-lg shadow-red-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memproses Pengesahan Webhook ToyyibPay...</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" />
                      <span>Sahkan Bayaran FPX (Simulasi Callback ToyyibPay)</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Gerbang Pembayaran Diiktiraf PayNet & Bank Negara Malaysia</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
