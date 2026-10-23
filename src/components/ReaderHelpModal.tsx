import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
  Smartphone,
  Bookmark,
  SunMoon,
  FileText,
  CreditCard,
  Lock,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export type ReaderHelpTab = 'panduan' | 'faq' | 'privasi';

interface ReaderHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ReaderHelpTab;
  onExploreClick?: () => void;
}

export const ReaderHelpModal: React.FC<ReaderHelpModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'panduan',
  onExploreClick,
}) => {
  const [activeTab, setActiveTab] = useState<ReaderHelpTab>(initialTab);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const faqs = [
    {
      q: 'Bagaimana cara pembayaran dibuat, adakah secara manual atau automatik?',
      a: 'Pembayaran disahkan secara 100% automatik melalui gerbang pembayaran rasmi Malaysia (FPX, DuitNow QR, ToyyibPay & BCL/Bayarcash). Sebaik sahaja transaksi berjaya di bank atau aplikasi perbankan anda, buku dimasukkan serta-merta ke dalam "Rak Saya" tanpa perlu menghantar resit WhatsApp secara manual.',
      tag: 'Bayaran',
    },
    {
      q: 'Bagaimana buku disimpan dalam akaun setiap pengguna?',
      a: 'Buku yang dibeli dihubungkan secara kekal dengan ID akaun pembaca anda di pangkalan data awan selamat (Cloud Firestore). Anda boleh log masuk di mana-mana peranti (telefon pintar, tablet, atau komputer riba) menggunakan akaun Google yang sama dan buku anda sentiasa sedia untuk dibaca.',
      tag: 'Akaun & Storan',
    },
    {
      q: 'Adakah aplikasi ini sudah boleh digunakan untuk jual beli sebenar?',
      a: 'Ya! Sistem KaryaDigital telah dilengkapi dengan integrasi gerbang FPX, kad perbankan, dan DuitNow QR serta sistem DRM penyulitan fail selamat. Transaksi disokong dalam mod Sandbox (untuk ujian tanpa risiko) dan mod Pengeluaran Sebenar (Live Production).',
      tag: 'Platform',
    },
    {
      q: 'Bolehkah saya membaca terus e-buku dalam pelayar tanpa pasang aplikasi?',
      a: 'Tepat sekali! Pembaca web bersepadu kami direka khas agar anda boleh membaca serta-merta terus melalui pelayar web kegemaran anda (Google Chrome, Safari, Firefox, Edge) tanpa perlu memuat turun aplikasi fail APK pihak ketiga yang membebankan memori peranti.',
      tag: 'Pembacaan',
    },
    {
      q: 'Apakah perbezaan format e-Buku Interaktif dan fail PDF?',
      a: 'KaryaDigital menyokong kedua-duanya: (1) Format Web Dinamik yang membolehkan penukaran saiz teks, mod malam, dan paparan responsif mengikut skrin telefon; dan (2) Format PDF Bersepadu dengan kawalan zum resolusi tinggi serta penomboran halaman tepat sesuai untuk buku rujukan, ilustrasi penuh, atau komik.',
      tag: 'Format Buku',
    },
    {
      q: 'Bolehkah saya mencuba membaca bab permulaan sebelum membeli?',
      a: 'Boleh! Semua naskhah di KaryaDigital menyediakan pilihan "Sampel" percuma supaya anda boleh membaca bab pengenalan terlebih dahulu sebelum membuat keputusan pembelian.',
      tag: 'Sampel Percuma',
    },
    {
      q: 'Adakah pembelian ini dikenakan langganan bulanan berulang?',
      a: 'Tidak. Setiap pembelian e-buku di KaryaDigital adalah bayaran sekali sahaja (One-Time Purchase) untuk hak akses kekal selamanya di bawah akaun anda.',
      tag: 'Harga & Nilai',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-help-modal-title"
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Dark Indigo Gradient */}
        <div className="relative bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Tutup tetingkap bantuan pembaca"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-600/60 border border-indigo-400/40 flex items-center justify-center text-amber-400 shadow-md">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="reader-help-modal-title" className="text-lg sm:text-xl font-black text-white">
                  Pusat Bantuan Pembaca
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  KaryaDigital
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Panduan menyeluruh penggunaan pembaca web, transaksi perbankan, dan hak pengguna.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 sm:gap-3 mt-5 border-b border-white/10 pb-0 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('panduan')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'panduan'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Panduan Membaca</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'faq'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Soalan Lazim & Bayaran</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privasi')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'privasi'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Privasi & Terma</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 bg-slate-50/50">
          {/* TAB 1: PANDUAN MEMBACA DALAM PELAYAR */}
          {activeTab === 'panduan' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Smartphone className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-950">
                    Pengalaman Membaca Pantas Tanpa Pemasangan
                  </h3>
                  <p className="text-xs text-indigo-900/80 leading-relaxed mt-1">
                    Anda tidak perlu memuat turun aplikasi yang membebankan ruang telefon. Cukup buka laman web KaryaDigital pada pelayar Chrome atau Safari, dan terus nikmati e-buku anda pada bila-bila masa.
                  </p>
                </div>
              </div>

              {/* Grid of Reader Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <SunMoon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Pilihan Tema & Mod Malam</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Tukar antara tema Putih Segar, Sepia Menenangkan, atau Mod Malam Gelap untuk keselesaan mata membaca dalam gelap.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Penanda Buku Pintar (Bookmarks)</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Tandakan halaman dan ayat kegemaran anda dengan sekali sentuh. Kedudukan bacaan terakhir disimpan secara automatik.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Sokongan Fail PDF & Web ePub</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    KaryaDigital menyokong pembacaan PDF terus dalam pelayar dengan kawalan pembesar (zoom), navigasi muka surat, dan paparan jelas.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Perlindungan Hak Cipta DRM</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Sistem dilengkapi keselamatan anti-cetak rompak, tera air digital dinamik, dan enkripsi pelayan untuk melindungi karya penulis Malaysia.
                  </p>
                </div>
              </div>

              {/* Step-by-step reading flow */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Langkah Mudah Membaca:
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-slate-700">
                      Pilih mana-mana buku dari katalog atau buka buku dari <strong>"Rak Saya"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-slate-700">
                      Klik butang <strong>"Baca Sekarang"</strong> atau <strong>"Sampel Percuma"</strong> untuk melancarkan pembaca web.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-slate-700">
                      Gunakan butang anak panah di bawah atau leret skrin (*swipe*) untuk menyelak halaman bab demi bab.
                    </p>
                  </div>
                </div>
              </div>

              {onExploreClick && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={onExploreClick}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <span>Mula Terokai Koleksi Buku</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SOALAN LAZIM (FAQ) & BAYARAN */}
          {activeTab === 'faq' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950">
                  <p className="font-bold">Gerbang Perbankan Selamat Malaysia</p>
                  <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                    Sokongan penuh FPX (Maybank, CIMB, Bank Islam, RHB, dll.), DuitNow QR, Kad Debit/Kredit, ToyyibPay & Bayarcash.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {faqs.map((faq, idx) => {
                  const isExpanded = expandedFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-200"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                        className="w-full p-3.5 sm:p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="space-y-1">
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {faq.tag}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {faq.q}
                          </h4>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-indigo-600' : ''
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="px-3.5 pb-4 sm:px-4 pt-1 border-t border-slate-100 text-xs text-slate-600 leading-relaxed bg-slate-50/50">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100 text-center text-xs text-slate-600 border border-slate-200/80">
                Ada pertanyaan lain atau perlukan bantuan pembayaran? Hubungi kami di{' '}
                <a
                  href="mailto:mykaryadigital@gmail.com"
                  className="font-bold text-indigo-600 hover:underline"
                >
                  mykaryadigital@gmail.com
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: POLISI PRIVASI & TERMA PENGGUNAAN */}
          {activeTab === 'privasi' && (
            <div className="space-y-5 animate-in fade-in duration-200 text-xs text-slate-700 leading-relaxed">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Polisi Privasi & Perlindungan Data Peribadi (PDPA)
                  </h3>
                </div>
                <p>
                  KaryaDigital Malaysia komited melindungi kerahsiaan dan privasi pengguna mengikut peruntukan Akta Perlindungan Data Peribadi 2010 (PDPA).
                </p>
                <ul className="space-y-1.5 pl-4 list-disc text-slate-600">
                  <li>
                    <strong>Data yang dikumpul:</strong> Nama pengguna, alamat e-mel berdaftar, rekod buku yang dibeli, dan penanda bacaan (*reading progress*).
                  </li>
                  <li>
                    <strong>Keselamatan Perbankan:</strong> Kami tidak pernah menyimpan kata laluan bank atau butiran kad kredit. Pembayaran diproses terus oleh gerbang perbankan berlesen BNM.
                  </li>
                  <li>
                    <strong>Tiada Penjualan Data:</strong> Data anda tidak akan sekali-kali dijual, disewakan, atau dikongsi kepada pihak pengiklan pihak ketiga.
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Terma Penggunaan & Hak Cipta Terpelihara
                  </h3>
                </div>
                <p>
                  Dengan mengakses dan membaca di KaryaDigital, anda bersetuju dengan terma berikut:
                </p>
                <ul className="space-y-1.5 pl-4 list-disc text-slate-600">
                  <li>
                    <strong>Hak Cipta Penulis:</strong> Semua manuskrip, ilustrasi, komik, dan kandungan adalah hak cipta mutlak penulis/penerbit Malaysia yang berdaftar di bawah Akta Hakcipta 1987.
                  </li>
                  <li>
                    <strong>Larangan Pengedaran Haram:</strong> Sebarang cubaan menyalin teks (*copy-paste*), mencetak cetak rompak, atau menyebarkan semula fail secara haram adalah dilarang sama sekali.
                  </li>
                  <li>
                    <strong>Hak Akses Digital:</strong> Pembelian e-buku memberikan hak akses bacaan digital peribadi tanpa had tempoh masa di bawah akaun anda.
                  </li>
                  <li>
                    <strong>Dasar Pemulangan:</strong> Oleh kerana kandungan digital boleh diakses serta-merta selepas transaksi disahkan, bayaran balik tidak dibenarkan melainkan berlaku kesilapan pemotongan berganda (*double billing*).
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">E-mel Khidmat Sokongan Rasmi</h4>
                  <p className="text-[11px] text-indigo-800">
                    Sebarang maklum balas, bantahan hak cipta, atau bantuan pengguna:
                  </p>
                </div>
                <a
                  href="mailto:mykaryadigital@gmail.com"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 transition-colors"
                >
                  mykaryadigital@gmail.com
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 sm:px-6 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            KaryaDigital Malaysia • Platform E-Buku & Komik Tempatan
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
