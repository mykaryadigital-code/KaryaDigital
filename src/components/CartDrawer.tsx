import React, { useState } from 'react';
import {
  X,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Tag,
  CreditCard,
  Building2,
  QrCode,
  Wallet,
} from 'lucide-react';
import { CartItem, EBook } from '../types/ebook.ts';
import { calculateCartTotals, formatMYR } from '../utils/ebookLogic.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (bookId: string) => void;
  onCheckoutSuccess: (purchasedBooks: EBook[]) => void;
  voucherCode: string;
  onApplyVoucher: (code: string) => void;
  onTriggerToyyibPay: (billData: any) => void;
  onTriggerBclPayment: (billData: any) => void;
  currentUserEmail?: string;
  currentUserName?: string;
  isLoggedIn?: boolean;
  onOpenAuthModal?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onCheckoutSuccess,
  voucherCode,
  onApplyVoucher,
  onTriggerToyyibPay,
  onTriggerBclPayment,
  currentUserEmail = '',
  currentUserName = '',
  isLoggedIn = false,
  onOpenAuthModal,
}) => {
  const [inputCode, setInputCode] = useState(voucherCode);
  const [voucherError, setVoucherError] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<'bcl' | 'toyyibpay'>('bcl');
  const [selectedPayment, setSelectedPayment] = useState<'fpx' | 'duitnow' | 'tng'>('fpx');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [completedBooks, setCompletedBooks] = useState<EBook[]>([]);

  if (!isOpen) return null;

  const totals = calculateCartTotals(cartItems, voucherCode);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) {
      setVoucherError('Sila masukkan kod baucar.');
      return;
    }
    const clean = inputCode.trim().toUpperCase();
    if (clean === 'KARYALOKAL' || clean === 'PESTA10' || clean === 'KOMIKLOKAL') {
      onApplyVoucher(clean);
      setVoucherError('');
    } else {
      setVoucherError('Kod tidak sah. Cuba "KARYALOKAL" untuk potongan RM5.');
    }
  };

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const firstBook = cartItems[0]?.book;
      const combinedTitle = cartItems.map((i) => i.book.title).join(', ');

      if (selectedGateway === 'bcl') {
        // Hantar permohonan ke API BCL (Bayarcash Commerce Layer)
        const response = await fetch('/api/payment/bcl-create-bill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId: firstBook?.id || 'cart-bundle',
            bookTitle: combinedTitle,
            amount: totals.total,
            userName: currentUserName,
            userEmail: currentUserEmail,
            userPhone: '0123456789',
            channel: selectedPayment,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setIsProcessing(false);
          onClose();
          onTriggerBclPayment({
            orderId: data.orderId,
            billCode: data.billCode,
            bookTitle: combinedTitle,
            amount: totals.total,
            paymentUrl: data.paymentUrl,
            isSandbox: data.isSandbox,
            userEmail: currentUserEmail,
            gateway: 'bcl',
            purchasedBooks: cartItems.map((i) => i.book),
          });
          return;
        } else {
          throw new Error(data.error || 'Gagal cipta bil BCL');
        }
      } else {
        // Panggil backend API untuk menjana bil invois ToyyibPay
        const response = await fetch('/api/payment/create-bill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId: firstBook?.id || 'cart-bundle',
            bookTitle: combinedTitle,
            amount: totals.total,
            userName: currentUserName,
            userEmail: currentUserEmail,
            userPhone: '0123456789',
          }),
        });

        const data = await response.json();

        if (data.success) {
          setIsProcessing(false);
          onClose();
          onTriggerToyyibPay({
            orderId: data.orderId,
            billCode: data.billCode,
            bookTitle: combinedTitle,
            amount: totals.total,
            paymentUrl: data.paymentUrl,
            isSandbox: data.isSandbox,
            userEmail: currentUserEmail,
            purchasedBooks: cartItems.map((i) => i.book),
          });
          return;
        } else {
          throw new Error(data.error || 'Gagal cipta bil ToyyibPay');
        }
      }
    } catch (err: any) {
      console.error('[Pembayaran Ralat]:', err);
      setIsProcessing(false);
      alert(err?.message || 'Ralat semasa memproses invois pembayaran FPX. Sila cuba sebentar lagi.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Bakul Belian E-Buku"
    >
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Cart Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Bakul Belanja</h3>
              <p className="text-xs text-slate-500">{cartItems.length} e-buku dipilih</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Tutup bakul belian"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {checkoutComplete ? (
            /* Success State */
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-slate-900">Pembayaran Berjaya!</h4>
              <p className="text-sm text-slate-600 max-w-xs mx-auto">
                Terima kasih kerana menyokong penulis tempatan Malaysia. Sebanyak{' '}
                <strong>{completedBooks.length} naskhah</strong> telah ditambahkan terus ke Rak Perpustakaan anda.
              </p>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 mt-4">
                <div className="text-xs font-bold text-slate-500 uppercase">Buku Yang Diperoleh:</div>
                {completedBooks.map((b) => (
                  <div key={b.id} className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="text-emerald-600">✓</span>
                    <span className="truncate">{b.title}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setCheckoutComplete(false);
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Tutup & Mula Membaca
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Bakul Anda Kosong</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Terokai katalog novel dan komik tempatan kami dan tambah naskhah kegemaran anda ke dalam bakul.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
              >
                Mula Jelajah Sekarang
              </button>
            </div>
          ) : (
            /* Item List */
            <div className="space-y-4">
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <div key={item.book.id} className="py-3 flex items-start gap-3">
                    <div
                      className={`w-12 h-16 rounded-lg bg-gradient-to-br ${item.book.coverGradient} flex items-center justify-center text-white shrink-0 shadow-xs p-1 text-center`}
                    >
                      <span className="text-[9px] font-black leading-tight line-clamp-2">
                        {item.book.title}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.book.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">{item.book.author}</p>
                      <div className="text-xs font-black text-slate-900 mt-1">
                        {formatMYR(item.book.price)}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.book.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      aria-label={`Buang ${item.book.title} dari bakul`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Voucher Input */}
              <div className="pt-2">
                <form onSubmit={handleApply} className="space-y-1.5">
                  <label htmlFor="voucher-code" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    Kod Baucar Diskaun:
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="voucher-code"
                      type="text"
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value);
                        setVoucherError('');
                      }}
                      placeholder="Contoh: KARYALOKAL"
                      className="flex-1 px-3 py-2 text-xs uppercase font-mono font-bold bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-600"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Guna
                    </button>
                  </div>
                  {totals.voucherApplied && (
                    <div className="text-xs font-semibold text-emerald-600">
                      ✓ {totals.voucherApplied} berjaya ditebus!
                    </div>
                  )}
                  {voucherError && (
                    <div className="text-xs font-medium text-rose-600">{voucherError}</div>
                  )}
                </form>
              </div>

              {/* Gateway & Payment Selector */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Pilih Gerbang Pembayaran (Payment Gateway):
                </label>
                
                {/* Gateway Options */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('bcl')}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      selectedGateway === 'bcl'
                        ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-300/40 text-slate-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-800">BCL (Bayarcash)</span>
                      <span className="text-[9px] bg-sky-200/70 text-sky-800 font-extrabold px-1.5 py-0.2 rounded-full">
                        Disyorkan
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      FPX, DuitNow QR & e-Wallet
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway('toyyibpay')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedGateway === 'toyyibpay'
                        ? 'border-red-500 bg-red-50/70 ring-2 ring-red-300/40 text-slate-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-800">ToyyibPay</span>
                      <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">
                        FPX
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Perbankan FPX Sahaja
                    </div>
                  </button>
                </div>

                {/* Sub-channel for BCL */}
                {selectedGateway === 'bcl' && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      Saluran Bayaran BCL:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment('fpx')}
                        className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                          selectedPayment === 'fpx'
                            ? 'border-sky-600 bg-sky-100/60 text-sky-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-sky-600" />
                        <span className="text-[10px]">FPX Bank</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPayment('duitnow')}
                        className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                          selectedPayment === 'duitnow'
                            ? 'border-sky-600 bg-sky-100/60 text-sky-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5 text-pink-600" />
                        <span className="text-[10px]">DuitNow QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPayment('tng')}
                        className={`p-2 rounded-lg border text-center transition flex flex-col items-center gap-1 ${
                          selectedPayment === 'tng'
                            ? 'border-sky-600 bg-sky-100/60 text-sky-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[10px]">TNG eWallet</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Cart Footer Summary & Checkout Button */}
        {!checkoutComplete && cartItems.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3.5">
            {/* User Login Context Banner */}
            {isLoggedIn ? (
              <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white border border-slate-200 p-2 rounded-xl">
                <span className="truncate max-w-[200px]">
                  Akaun: <strong className="text-slate-900">{currentUserEmail}</strong>
                </span>
                <span className="text-emerald-700 font-bold shrink-0">✓ Segerak Awan</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-2 text-xs">
                <div className="text-[11px] text-amber-900 leading-tight">
                  <span className="font-bold block">💡 Petua Pembaca:</span>
                  Log masuk untuk simpan buku ke rak awan anda.
                </div>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuthModal();
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-lg transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    Log Masuk
                  </button>
                )}
              </div>
            )}

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Jumlah Kasar:</span>
                <span className="font-semibold text-slate-900">
                  RM {totals.subtotal.toFixed(2)}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskaun Baucar:</span>
                  <span>- RM {totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Cukai Digital (SST Pendidikan):</span>
                <span className="text-slate-400 font-mono">Dikecualikan (0%)</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Jumlah Bersih:</span>
                <span className="text-indigo-900">RM {totals.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses Transaksi Selamat...</span>
                </>
              ) : (
                <>
                  <span>Bayar Sekarang (RM {totals.total.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Penyulitan 256-bit FPX Malaysia yang disahkan Bank Negara</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
