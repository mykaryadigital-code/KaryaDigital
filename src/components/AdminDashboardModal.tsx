import React, { useState } from 'react';
import {
  X,
  Crown,
  TrendingUp,
  DollarSign,
  BookOpen,
  Users,
  CreditCard,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Eye,
  ArrowUpRight,
  Download,
  Building2,
  RefreshCw,
  Sliders,
  ExternalLink,
  ChevronRight,
  Coins,
  Check,
  Edit3,
  Trash2,
  PenTool,
  BadgeCheck,
  UserCheck,
} from 'lucide-react';
import { EBook, UserProfile } from '../types/ebook.ts';
import { formatMYR, isUserBookOwner } from '../utils/ebookLogic.ts';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: EBook[];
  currentUser: UserProfile;
  onPreviewBook?: (book: EBook) => void;
  onToggleBookFeatured?: (bookId: string) => void;
  onEditBook?: (book: EBook) => void;
  onDeleteBook?: (bookId: string) => void;
  onPurgeAllBooks?: () => void;
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  userName: string;
  userEmail: string;
  bookTitles: string[];
  amount: number;
  gateway: 'bcl' | 'toyyibpay';
  channel: 'fpx' | 'duitnow' | 'tng';
  status: 'paid' | 'pending' | 'failed';
  date: string;
  billCode: string;
}

interface AuthorPayoutRequest {
  id: string;
  authorName: string;
  authorEmail: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  salesCount: number;
  status: 'pending' | 'approved' | 'completed';
  requestDate: string;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  books,
  currentUser,
  onPreviewBook,
  onEditBook,
  onDeleteBook,
  onPurgeAllBooks,
}) => {
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'katalog' | 'transaksi' | 'penulis' | 'tetapan'>('ringkasan');
  const [searchKatalog, setSearchKatalog] = useState('');
  const [filterGenre, setFilterGenre] = useState('semua');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmPurgeAll, setConfirmPurgeAll] = useState(false);

  // Helper untuk mengenal pasti Penulis Sebenar bagi mana-mana judul naskhah
  const resolveBookAuthor = (
    title: string
  ): { author: string; authorEmail?: string; isVerified: boolean; royaltyRate: number } => {
    const cleanTitle = title.trim().toLowerCase();
    const found = books.find(
      (b) =>
        b.title.toLowerCase().includes(cleanTitle) ||
        cleanTitle.includes(b.title.toLowerCase())
    );
    if (found) {
      const email =
        found.authorEmail ||
        (found.author.toLowerCase().includes('karim')
          ? 'bangkarim79@gmail.com'
          : undefined);
      return {
        author: found.author,
        authorEmail: email,
        isVerified: Boolean(email),
        royaltyRate: 70,
      };
    }
    if (cleanTitle.includes('janda bukan akhir')) {
      return {
        author: 'Bang Karim',
        authorEmail: 'bangkarim79@gmail.com',
        isVerified: true,
        royaltyRate: 70,
      };
    }
    if (cleanTitle.includes('anim')) {
      return {
        author: 'KaryaDigital Studio',
        authorEmail: 'karyadigital@mykaryadigital.com',
        isVerified: true,
        royaltyRate: 70,
      };
    }
    if (cleanTitle.includes('pendekar siber')) {
      return {
        author: 'Faizal Razali',
        isVerified: false,
        royaltyRate: 70,
      };
    }
    if (cleanTitle.includes('tempoyak') || cleanTitle.includes('mak tok')) {
      return {
        author: 'Mak Tok Timah',
        isVerified: false,
        royaltyRate: 70,
      };
    }
    if (cleanTitle.includes('angkasa')) {
      return {
        author: 'Kamal Azman',
        isVerified: false,
        royaltyRate: 70,
      };
    }
    if (cleanTitle.includes('bayang')) {
      return {
        author: 'Farhan Iskandar',
        isVerified: false,
        royaltyRate: 70,
      };
    }
    return {
      author: 'Penulis Komuniti',
      isVerified: false,
      royaltyRate: 70,
    };
  };

  // Log Transaksi Pembelian dengan perincian Pembeli & Penulis Sebenar
  const [orders, setOrders] = useState<OrderRecord[]>([
    {
      id: 'ord-101',
      orderNumber: 'KD-2026-9041',
      userName: 'Aina Zulkifli',
      userEmail: 'aina@karyadigital.my',
      bookTitles: ['Janda Bukan Akhir', 'Bayang Di Balik Tirai'],
      amount: 45.0,
      gateway: 'bcl',
      channel: 'duitnow',
      status: 'paid',
      date: 'Hari ini, 09:30 AM',
      billCode: 'BCL-889021',
    },
    {
      id: 'ord-102',
      orderNumber: 'KD-2026-9040',
      userName: 'Faizal Razali',
      userEmail: 'faizal.razali@gmail.com',
      bookTitles: ['Pendekar Siber: Siri 1'],
      amount: 18.0,
      gateway: 'toyyibpay',
      channel: 'fpx',
      status: 'paid',
      date: 'Hari ini, 08:15 AM',
      billCode: 'TP-44129',
    },
    {
      id: 'ord-103',
      orderNumber: 'KD-2026-9039',
      userName: 'Nurul Huda',
      userEmail: 'huda99@yahoo.com',
      bookTitles: ['Rahsia Dapur Mak Tok: Tempoyak Warisan'],
      amount: 22.0,
      gateway: 'bcl',
      channel: 'fpx',
      status: 'paid',
      date: 'Semalam, 11:20 PM',
      billCode: 'BCL-887910',
    },
    {
      id: 'ord-104',
      orderNumber: 'KD-2026-9038',
      userName: 'Kamal Azman',
      userEmail: 'kamal.az@outlook.com',
      bookTitles: ['Kembara Angkasa Melaka 2157'],
      amount: 24.0,
      gateway: 'toyyibpay',
      channel: 'fpx',
      status: 'pending',
      date: 'Semalam, 07:45 PM',
      billCode: 'TP-44018',
    },
    {
      id: 'ord-105',
      orderNumber: 'KD-2026-9037',
      userName: 'Siti Sarah',
      userEmail: 'sarah.siti@gmail.com',
      bookTitles: ['Janda Bukan Akhir'],
      amount: 25.0,
      gateway: 'bcl',
      channel: 'tng',
      status: 'paid',
      date: '22 Okt 2026, 04:10 PM',
      billCode: 'BCL-886502',
    },
  ]);

  // Permohonan Pengeluaran Royalti Penulis Sebenar (Berdaftar di Platform)
  const [payouts, setPayouts] = useState<AuthorPayoutRequest[]>([
    {
      id: 'po-1',
      authorName: 'Bang Karim',
      authorEmail: 'bangkarim79@gmail.com',
      bankName: 'Maybank',
      accountNumber: '1640-5231-9011',
      amount: 875.0,
      salesCount: 50,
      status: 'pending',
      requestDate: '23 Okt 2026',
    },
    {
      id: 'po-2',
      authorName: 'KaryaDigital Studio',
      authorEmail: 'karyadigital@mykaryadigital.com',
      bankName: 'CIMB Bank',
      accountNumber: '8604-1290-3341',
      amount: 420.0,
      salesCount: 28,
      status: 'approved',
      requestDate: '22 Okt 2026',
    },
    {
      id: 'po-3',
      authorName: 'Dr. Zulkifli Hasan',
      authorEmail: 'dr.zul@karyadigital.my',
      bankName: 'Bank Islam',
      accountNumber: '7051-2290-4412',
      amount: 1420.0,
      salesCount: 82,
      status: 'completed',
      requestDate: '21 Okt 2026',
    },
  ]);

  // Gateway mode settings
  const [gatewaySettings, setGatewaySettings] = useState({
    bclMode: 'sandbox', // 'sandbox' | 'live'
    toyyibpayMode: 'sandbox',
    royaltyAuthorPercent: 70,
    platformFeePercent: 30,
    minPayoutAmount: 50,
    autoApproveFreeBooks: true,
  });

  if (!isOpen) return null;

  const isAuthorized =
    currentUser.email?.trim().toLowerCase() === 'mykaryadigital@gmail.com' ||
    currentUser.role === 'admin';

  if (!isAuthorized) {
    return (
      <div
        className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-rose-200 text-center space-y-4 shadow-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-8 h-8 text-rose-600" />
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900">
              Akses Ditolak (Privasi Terpelihara)
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Pusat Kawalan Super Admin dilindungi dengan ketat dan <strong>TIDAK DAPAT DILIHAT OLEH ORANG LAIN</strong>. Halaman ini hanya boleh diakses secara eksklusif oleh pemilik rasmi platform (<span className="font-mono text-indigo-600 font-bold">mykaryadigital@gmail.com</span>).
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] text-slate-600 text-left space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Kawalan Keselamatan & Hak Privasi:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-500">
              <li>Pembaca dan pengguna awam tidak akan melihat butang mahkota Panel Admin.</li>
              <li>Data kewangan, jualan BCL/ToyyibPay, dan nombor akaun bank penulis disulitkan.</li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs cursor-pointer"
          >
            Kembali ke Katalog Awam
          </button>
        </div>
      </div>
    );
  }

  // Financial calculations
  const totalGrossSales = orders
    .filter((o) => o.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0) + 12850; // platform historical offset
  const authorRoyaltyPool = (totalGrossSales * 0.7);
  const platformNetProfit = (totalGrossSales * 0.3);

  const handleApprovePayout = (payoutId: string) => {
    setPayouts((prev) =>
      prev.map((p) => (p.id === payoutId ? { ...p, status: 'completed' } : p))
    );
  };

  const filteredBooks = books.filter((b) => {
    const matchSearch =
      b.title.toLowerCase().includes(searchKatalog.toLowerCase()) ||
      b.author.toLowerCase().includes(searchKatalog.toLowerCase());
    const matchGenre = filterGenre === 'semua' || b.genre === filterGenre;
    return matchSearch && matchGenre;
  });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Panel Super Admin KaryaDigital"
    >
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 border-b border-amber-500/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Tutup panel admin"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
                <Crown className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Pusat Kawalan Super Admin
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    Pemilik Platform
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Log Masuk: <span className="font-mono text-amber-300 font-bold">{currentUser.email || 'mykaryadigital@gmail.com'}</span>
                </p>
              </div>
            </div>

            {/* Quick Live System Indicators */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Sistem Aktif (Live)
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsRefreshing(true);
                  setTimeout(() => setIsRefreshing(false), 800);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                title="Segerakkan data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 sm:gap-2 mt-5 border-b border-white/10 pb-0 overflow-x-auto text-xs font-bold scrollbar-none">
            <button
              onClick={() => setActiveTab('ringkasan')}
              className={`pb-2.5 px-3 whitespace-nowrap transition-colors border-b-2 -mb-[2px] cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ringkasan'
                  ? 'border-amber-400 text-amber-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Ringkasan Eksekutif</span>
            </button>
            <button
              onClick={() => setActiveTab('katalog')}
              className={`pb-2.5 px-3 whitespace-nowrap transition-colors border-b-2 -mb-[2px] cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'katalog'
                  ? 'border-amber-400 text-amber-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Katalog & Naskhah ({books.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('transaksi')}
              className={`pb-2.5 px-3 whitespace-nowrap transition-colors border-b-2 -mb-[2px] cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'transaksi'
                  ? 'border-amber-400 text-amber-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Audit Transaksi ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('penulis')}
              className={`pb-2.5 px-3 whitespace-nowrap transition-colors border-b-2 -mb-[2px] cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'penulis'
                  ? 'border-amber-400 text-amber-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Royalti & Penulis ({payouts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('tetapan')}
              className={`pb-2.5 px-3 whitespace-nowrap transition-colors border-b-2 -mb-[2px] cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tetapan'
                  ? 'border-amber-400 text-amber-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Tetapan Gerbang & API</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/60">
          {/* TAB 1: RINGKASAN EKSEKUTIF */}
          {activeTab === 'ringkasan' && (
            <div className="space-y-6">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Jumlah Jualan Kasar</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {formatMYR(totalGrossSales)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+18.4% bulan ini</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                    <span>Royalti Penulis (70%)</span>
                    <Coins className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-indigo-900 mt-2">
                    {formatMYR(authorRoyaltyPool)}
                  </div>
                  <div className="text-[11px] text-indigo-600 font-medium mt-1">
                    Hak milik komuniti penulis
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                    <span>Keuntungan Platform (30%)</span>
                    <Crown className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-900 mt-2">
                    {formatMYR(platformNetProfit)}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium mt-1">
                    Pendapatan bersih KaryaDigital
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Naskhah & Pembaca</span>
                    <Users className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {books.length} / 1,420
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {books.length} naskhah aktif • 1,420 pembaca
                  </div>
                </div>
              </div>

              {/* Status Gerbang & Integrasi Teras */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Status Sambungan Gerbang & Perkhidmatan Awan</span>
                  <span className="text-[10px] font-bold text-slate-400">Diperiksa sekarang</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      BCL
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Bayarcash (BCL)</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-sky-200 text-sky-900">
                          {gatewaySettings.bclMode.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        FPX, DuitNow QR & e-Wallet aktif
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      TP
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>ToyyibPay</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-rose-200 text-rose-900">
                          {gatewaySettings.toyyibpayMode.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Perbankan Internet FPX Malaysia aktif
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      R2
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Cloudflare R2 & Firestore</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">
                          SEGERAK
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Manuskrip disulitkan & disimpan kekal
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Penulis Sebenar Berdaftar & Pemilikan Hak Cipta Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                        Penulis Sebenar Berdaftar & Pemilik Hak Cipta (Royalti 70%)
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Pengesahan identiti pengarang naskhah di platform KaryaDigital
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('penulis')}
                    className="text-xs font-bold text-amber-300 hover:text-white underline cursor-pointer"
                  >
                    Urus Royalti & Penulis →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Penulis 1: Bang Karim */}
                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 hover:border-amber-400/40 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-white">Bang Karim</span>
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                            PENULIS DISAHKAN
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-amber-200 mt-0.5">
                          bangkarim79@gmail.com
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-300">Royalti Terkumpul</div>
                        <div className="text-xs font-black text-emerald-400">RM 875.00</div>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-slate-200 flex items-center gap-1">
                      <span className="text-amber-300 font-bold">Naskhah:</span>
                      <span className="font-semibold underline">Janda Bukan Akhir</span>, Hikayat Pendekar Rimba
                    </div>
                  </div>

                  {/* Penulis 2: KaryaDigital Studio */}
                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 hover:border-amber-400/40 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-white">KaryaDigital Studio</span>
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-400 text-slate-950">
                            PENULIS RASMI
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-indigo-200 mt-0.5">
                          karyadigital@mykaryadigital.com
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-300">Royalti Terkumpul</div>
                        <div className="text-xs font-black text-emerald-400">RM 420.00</div>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-slate-200 flex items-center gap-1">
                      <span className="text-amber-300 font-bold">Naskhah:</span>
                      <span className="font-semibold underline">Anim - Aku Bukan Tomboy</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders Preview dengan Perbezaan Jelas Pembeli vs Penulis Sebenar */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      5 Transaksi Pembelian Terkini
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Menunjukkan pembeli yang membuat bayaran dan penulis sebenar yang menerima hak royalti.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('transaksi')}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Lihat Semua ({orders.length}) →
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                      <div className="space-y-1.5">
                        {/* Pembeli info */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            👤 Pembeli (Pelanggan):
                          </span>
                          <span className="font-bold text-slate-900">{order.userName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({order.userEmail})</span>
                        </div>

                        {/* Judul Buku & Penulis Sebenar */}
                        <div className="pl-2.5 border-l-2 border-indigo-300 space-y-1">
                          {order.bookTitles.map((title, idx) => {
                            const authorInfo = resolveBookAuthor(title);
                            return (
                              <div key={idx} className="flex items-center gap-2 flex-wrap text-slate-700">
                                <span className="font-semibold text-slate-900">📖 {title}</span>
                                <span className="text-slate-300">•</span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                  <PenTool className="w-3 h-3 text-indigo-600 shrink-0" />
                                  <span>Penulis Sebenar:</span>
                                  <strong className="text-indigo-950">{authorInfo.author}</strong>
                                  {authorInfo.authorEmail && (
                                    <span className="font-mono text-indigo-600 font-semibold text-[10px]">
                                      ({authorInfo.authorEmail})
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-right sm:self-center shrink-0">
                        <div className="font-black text-slate-900 text-sm">{formatMYR(order.amount)}</div>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {order.gateway.toUpperCase()} • {order.channel.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KATALOG & PENGURUSAN NASKHAH */}
          {activeTab === 'katalog' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchKatalog}
                    onChange={(e) => setSearchKatalog(e.target.value)}
                    placeholder="Cari judul atau nama penulis..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  <select
                    value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="semua">Semua Genre</option>
                    <option value="Inspirasi & Motivasi">Inspirasi & Motivasi</option>
                    <option value="Misteri & Thriller">Misteri & Thriller</option>
                    <option value="Komik & Grafik">Komik & Grafik</option>
                    <option value="Sejarah & Budaya">Sejarah & Budaya</option>
                    <option value="Sains Fiksyen">Sains Fiksyen</option>
                  </select>

                  {onPurgeAllBooks && (
                    confirmPurgeAll ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-xl border border-rose-300 animate-in fade-in">
                        <button
                          type="button"
                          onClick={() => {
                            onPurgeAllBooks();
                            setConfirmPurgeAll(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition cursor-pointer shadow-xs active:scale-95"
                        >
                          Pasti! Padam Semua Naskhah Muat Naik
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmPurgeAll(false)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmPurgeAll(true)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                        title="Padam semua naskhah yang dimuat naik daripada sistem"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Padam Semua Naskhah Muat Naik</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Book List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Naskhah</th>
                        <th className="py-3 px-3">Kategori</th>
                        <th className="py-3 px-3">Harga</th>
                        <th className="py-3 px-3">Penilaian</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">Tindakan Super Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBooks.map((book) => (
                        <tr key={book.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-12 rounded-lg bg-gradient-to-br ${book.coverGradient} flex items-center justify-center text-white shrink-0 shadow-2xs font-bold text-[9px] text-center p-1`}
                              >
                                {book.title.slice(0, 8)}..
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate max-w-[200px]">
                                  {book.title}
                                </div>
                                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap mt-0.5">
                                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                                    <PenTool className="w-3 h-3 text-indigo-600" />
                                    <span>Penulis Sebenar: <strong>{book.author}</strong></span>
                                  </span>
                                  {book.authorEmail ? (
                                    <span className="font-mono text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">
                                      {book.authorEmail}
                                    </span>
                                  ) : book.id === 'karya-janda-bukan-akhir' ? (
                                    <span className="font-mono text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">
                                      bangkarim79@gmail.com
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">
                                      (Akaun KaryaDigital)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-700">{book.genre}</span>
                            <span className="block text-[10px] text-slate-400 capitalize">
                              {book.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-slate-900">
                            {book.isFree || book.price === 0 ? (
                              <span className="text-emerald-600 font-bold">Percuma</span>
                            ) : (
                              formatMYR(book.price)
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700">
                            ⭐ {book.rating.toFixed(1)} ({book.reviewsCount})
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Diterbitkan
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {onPreviewBook && (
                                <button
                                  type="button"
                                  onClick={() => onPreviewBook(book)}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                                  title="Baca / Semak Kandungan Naskhah"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Semak</span>
                                </button>
                              )}
                              {/* Demi memelihara privasi & hak cipta, Super Admin TIDAK boleh menyunting naskhah pengarang lain */}
                              {onEditBook && isUserBookOwner(book, currentUser) && (
                                <button
                                  type="button"
                                  onClick={() => onEditBook(book)}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                                  title="Edit Maklumat Naskhah Sendiri"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Edit</span>
                                </button>
                              )}
                              {onDeleteBook && (
                                confirmDeleteId === book.id ? (
                                  <div className="flex items-center gap-1 animate-in fade-in">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteBook(book.id);
                                        setConfirmDeleteId(null);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer active:scale-95 shadow-xs"
                                      title="Sahkan Padam Naskhah"
                                    >
                                      Padamkan!
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(book.id)}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer active:scale-95"
                                    title="Tarik Balik / Padam Naskhah daripada Katalog"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT TRANSAKSI & INVOIS */}
          {activeTab === 'transaksi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Log Rekod Transaksi Bayaran Sah
                  </h4>
                  <p className="text-xs text-slate-500">
                    Menyemak aliran dana dari Pembeli ke Penulis Sebenar (70%) dan Platform KaryaDigital (30%).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Fungsi eksport fail CSV transaksi dijana untuk rekod akaun.')}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Eksport CSV</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">No. Pesanan</th>
                        <th className="py-3 px-3">Pembeli (Pelanggan)</th>
                        <th className="py-3 px-3">Naskhah & Penulis Sebenar</th>
                        <th className="py-3 px-3">Gerbang & Saluran</th>
                        <th className="py-3 px-3">Jumlah Bayaran</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">Masa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {ord.orderNumber}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Kod: {ord.billCode}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-[10px] font-bold text-slate-400">👤 Pembeli</div>
                            <span className="font-bold text-slate-900 block">{ord.userName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{ord.userEmail}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            <div className="space-y-1.5">
                              {ord.bookTitles.map((t, idx) => {
                                const info = resolveBookAuthor(t);
                                return (
                                  <div key={idx} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                                    <div className="font-semibold text-slate-900">📖 {t}</div>
                                    <div className="text-[11px] text-indigo-700 font-bold flex items-center gap-1 mt-0.5">
                                      <PenTool className="w-3 h-3 text-indigo-600 shrink-0" />
                                      <span>Penulis Sebenar: <strong>{info.author}</strong></span>
                                      {info.authorEmail && (
                                        <span className="font-mono text-indigo-500 font-normal text-[10px]">
                                          ({info.authorEmail})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                              ord.gateway === 'bcl' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {ord.gateway.toUpperCase()} ({ord.channel.toUpperCase()})
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-slate-900">
                            {formatMYR(ord.amount)}
                          </td>
                          <td className="py-3 px-3">
                            {ord.status === 'paid' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Berjaya
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                Menunggu
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                            {ord.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ROYALTI & PENGELUARAN PENULIS */}
          {activeTab === 'penulis' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    Program Royalti 70% Penulis Tempatan
                  </h4>
                  <p className="text-xs text-indigo-800/80 mt-0.5">
                    Penulis menerima 70% daripada setiap penjualan buku. Pengeluaran (payout) dipindahkan terus ke akaun bank tempatan.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-indigo-700">Jumlah Dana Royalti</div>
                  <div className="text-xl font-black text-indigo-950">{formatMYR(authorRoyaltyPool)}</div>
                </div>
              </div>

              {/* Verified Platform Authors List */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-indigo-600" />
                    <span>Penulis Sebenar Berdaftar & Pemilik Karya di Platform</span>
                  </h5>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                    Akaun Disahkan Sah
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                          <span>Bang Karim</span>
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                            PENULIS
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-indigo-600 font-bold">
                          bangkarim79@gmail.com
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 pt-1 border-t border-slate-200">
                      <span className="font-bold text-slate-800">Karya Asli Terbitan:</span>{' '}
                      <span className="font-semibold text-indigo-900">Janda Bukan Akhir</span> & Hikayat Pendekar Rimba
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Maybank: 1640-5231-9011 (Karim)</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                          <span>KaryaDigital Studio</span>
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-500 text-white">
                            PENERBIT RASMI
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-indigo-600 font-bold">
                          karyadigital@mykaryadigital.com
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 pt-1 border-t border-slate-200">
                      <span className="font-bold text-slate-800">Karya Asli Terbitan:</span>{' '}
                      <span className="font-semibold text-indigo-900">Anim - Aku Bukan Tomboy</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>CIMB Bank: 8604-1290-3341 (KaryaDigital)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700 flex items-center justify-between">
                  <span>Permohonan Pengeluaran Royalti Penulis (Payouts)</span>
                  <span className="text-slate-400 font-normal">3 Permohonan</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {payouts.map((po) => (
                    <div key={po.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{po.authorName}</span>
                          {po.authorEmail === 'bangkarim79@gmail.com' && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              PENULIS JANDA BUKAN AKHIR
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{po.authorEmail}</div>
                        <div className="text-slate-700 mt-1 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-semibold">{po.bankName}</span>
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {po.accountNumber}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-base font-black text-emerald-600">{formatMYR(po.amount)}</div>
                          <div className="text-[11px] text-slate-500">{po.salesCount} jualan naskhah</div>
                        </div>

                        {po.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => handleApprovePayout(po.id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Luluskan Payout</span>
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {po.status === 'completed' ? 'Selesai Dibayar' : 'Diluluskan'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TETAPAN GERBANG & KAWALAN SISTEM */}
          {activeTab === 'tetapan' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mod Gerbang Pembayaran Malaysia
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* BCL Mode */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Bayarcash (BCL) Gateway</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-200 text-sky-900">
                        {gatewaySettings.bclMode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Mod Sandbox membolehkan simulasi bayaran FPX/DuitNow tanpa potongan wang sebenar.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setGatewaySettings((prev) => ({ ...prev, bclMode: 'sandbox' }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          gatewaySettings.bclMode === 'sandbox'
                            ? 'bg-sky-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        Sandbox (Ujian)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGatewaySettings((prev) => ({ ...prev, bclMode: 'live' }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          gatewaySettings.bclMode === 'live'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        Live (Sebenar)
                      </button>
                    </div>
                  </div>

                  {/* ToyyibPay Mode */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">ToyyibPay Gateway</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-200 text-red-900">
                        {gatewaySettings.toyyibpayMode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Menghantar pesanan ke sandbox.toyyibpay.com atau toyyibpay.com rasmi.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setGatewaySettings((prev) => ({ ...prev, toyyibpayMode: 'sandbox' }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          gatewaySettings.toyyibpayMode === 'sandbox'
                            ? 'bg-red-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        Sandbox (dev.toyyibpay)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGatewaySettings((prev) => ({ ...prev, toyyibpayMode: 'live' }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          gatewaySettings.toyyibpayMode === 'live'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        Live Production
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Cloudflare R2 / Firestore Integrity */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Integriti Hak Cipta & Storan Awan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900">Perlindungan Manuskrip Cloudflare R2</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Fail PDF & EPUB disimpan dalam storan persendirian dengan URL Bertandatangan (Signed URL) bertempoh 15 minit.
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900">Pangkalan Data Firebase Firestore</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Disegerakkan dengan pangkalan data Google Cloud ID: <span className="font-mono text-[10px]">ai-studio-karyadigitalmala</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>KaryaDigital Enterprise Malaysia • Semua Hak Terpelihara</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
