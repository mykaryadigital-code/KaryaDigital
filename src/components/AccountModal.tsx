import React, { useState } from 'react';
import {
  X,
  User,
  Wallet,
  Library,
  BookOpen,
  Shield,
  Plus,
  CheckCircle2,
  Bookmark,
  Award,
  LogIn,
  LogOut,
  Crown,
  PenTool,
  Edit3,
} from 'lucide-react';
import { UserProfile, EBook } from '../types/ebook.ts';
import { isUserBookOwner } from '../utils/ebookLogic.ts';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  allBooks: EBook[];
  onTopUpBalance: (amount: number) => void;
  onReadBook: (book: EBook, initialPage?: number) => void;
  onViewSecureAsset?: (bookId: string, bookTitle: string) => void;
  onEditBook?: (book: EBook) => void;
  firebaseUser?: any;
  onSignInGoogle?: () => Promise<any>;
  onSignOut?: () => Promise<void>;
  onOpenAuthModal?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenAuthorPortal?: (tab?: 'register' | 'guide' | 'royalty' | 'dashboard') => void;
  isAuthor?: boolean;
  onToggleAuthorRole?: () => void;
  onOpenReaderHelp?: (tab?: 'panduan' | 'faq' | 'privasi') => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  allBooks,
  onTopUpBalance,
  onReadBook,
  onViewSecureAsset,
  onEditBook,
  firebaseUser,
  onSignInGoogle,
  onSignOut,
  onOpenAuthModal,
  onOpenAdminDashboard,
  onOpenAuthorPortal,
  isAuthor = false,
  onToggleAuthorRole,
  onOpenReaderHelp,
}) => {
  const [activeTab, setActiveTab] = useState<'profil' | 'rak' | 'karya' | 'baki'>('profil');
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  if (!isOpen) return null;

  // Naskhah karya asli pengarang yang log masuk (contoh: Janda Bukan Akhir)
  const authoredBooks = allBooks.filter((b) => isUserBookOwner(b, user));
  // Naskhah dalam koleksi rak (gabungan naskhah dibeli + naskhah karya sendiri yang sah)
  const ownedBooks = allBooks.filter(
    (b) => user.ownedBookIds.includes(b.id) || isUserBookOwner(b, user)
  );

  const handleTopUp = (amount: number) => {
    onTopUpBalance(amount);
    setTopUpSuccess(true);
    setTimeout(() => setTopUpSuccess(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Profil Akaun Pengguna"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="relative bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Tutup profil akaun"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white/20">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-white">{user.name}</h3>
                {user.email?.toLowerCase() === 'mykaryadigital@gmail.com' && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3 text-slate-950" />
                    Super Admin
                  </span>
                )}
                {user.isLoggedIn ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Disahkan
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/30 text-slate-300 border border-slate-400/30">
                    Mod Tetamu
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  {user.tier}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{user.email}</p>
              <p className="text-xs text-emerald-400 font-bold mt-1">
                Baki Dompet: RM {user.balance.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6 border-b border-white/10 pb-0">
            <button
              onClick={() => setActiveTab('profil')}
              className={`pb-2 px-3 text-xs font-bold transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'profil'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Maklumat Akaun
            </button>
            <button
              onClick={() => setActiveTab('rak')}
              className={`pb-2 px-3 text-xs font-bold transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'rak'
                  ? 'border-amber-400 text-amber-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Koleksi / Rak ({ownedBooks.length})
            </button>
            {(authoredBooks.length > 0 || isAuthor) && (
              <button
                onClick={() => setActiveTab('karya')}
                className={`pb-2 px-3 text-xs font-bold transition-colors border-b-2 -mb-[2px] flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'karya'
                    ? 'border-amber-400 text-amber-300 font-black'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-amber-400" />
                <span>Karya Penulis ({authoredBooks.length})</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('baki')}
              className={`pb-2 px-3 text-xs font-bold transition-colors border-b-2 -mb-[2px] ${
                activeTab === 'baki'
                  ? 'border-amber-400 text-amber-300 font-black'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Tambah Nilai e-Dompet
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'profil' && (
            <div className="space-y-4">
              <div className={`grid ${authoredBooks.length > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500">Naskhah Dimiliki</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {ownedBooks.length}
                  </div>
                  <div className="text-[11px] text-slate-400">Akses tanpa had</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500">Kredit Tersedia</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    RM {user.balance.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400">Boleh guna terus</div>
                </div>

                {authoredBooks.length > 0 && (
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                    <div className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                      <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Karya Penulis</span>
                    </div>
                    <div className="text-2xl font-black text-indigo-950 mt-1">
                      {authoredBooks.length}
                    </div>
                    <div className="text-[11px] text-indigo-600 font-medium">Hak Milik Sah</div>
                  </div>
                )}
              </div>

              {/* Author Showcase Card for author accounts */}
              {authoredBooks.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50/50 to-slate-50 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        ✍️
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">
                          Karya Anda di Katalog ({authoredBooks.length} Naskhah)
                        </div>
                        <div className="text-[11px] text-indigo-700 font-medium">
                          {user.email === 'bangkarim79@gmail.com' ? 'Akaun Penulis: Bang Karim' : 'Karya Asli Pengarang'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('karya')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      Urus Karya →
                    </button>
                  </div>

                  <div className="space-y-2">
                    {authoredBooks.map((bk) => (
                      <div
                        key={bk.id}
                        className="p-3 rounded-xl bg-white border border-indigo-100 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-12 rounded-md bg-slate-900 overflow-hidden shrink-0 shadow-2xs relative">
                            {bk.coverImage ? (
                              <img src={bk.coverImage} alt={bk.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-slate-900 p-0.5 text-[6px] text-white flex items-center justify-center text-center font-bold">
                                {bk.title.slice(0, 8)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{bk.title}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-700">{bk.genre}</span>
                              <span>•</span>
                              <span className="font-bold text-indigo-600">RM {bk.price.toFixed(2)}</span>
                              <span>•</span>
                              <span className="text-emerald-600 font-semibold">Royalti: RM {(bk.price * 0.7).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onEditBook && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onEditBook(bk);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                              title="Sunting Naskhah"
                            >
                              <Edit3 className="w-3 h-3 text-amber-700" />
                              <span className="hidden sm:inline">Sunting</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onReadBook(bk);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                          >
                            Baca
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Super Admin Control Panel Card */}
              {(user.email?.toLowerCase() === 'mykaryadigital@gmail.com' || user.role === 'admin') && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-300 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-xs">
                        <Crown className="w-4 h-4 text-slate-950" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Pusat Kawalan Super Admin Platform
                        </div>
                        <div className="text-[11px] text-amber-800 font-semibold">
                          Akses Penuh Pemilik (mykaryadigital@gmail.com)
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                      Super Admin
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pantau jumlah jualan kasar platform, audit transaksi bayaran BCL & ToyyibPay masa nyata, luluskan permohonan pengeluaran royalti penulis 70%, dan urus seluruh katalog naskhah.
                  </p>

                  {onOpenAdminDashboard && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAdminDashboard();
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Crown className="w-4 h-4 text-slate-950" />
                      <span>Buka Pusat Kawalan Super Admin</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              )}

              {/* Portal Penulis & Dashboard Penulis */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      ✍️
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {isAuthor ? 'Dashboard Penulis KaryaDigital' : 'Program Penulis (Jadi Penulis)'}
                      </div>
                      <div className="text-[11px] text-indigo-700 font-semibold">
                        {isAuthor ? 'Peranan: Penulis Sah (70% Royalti Aktif)' : 'Daftar & Terbit Karya (70% Royalti)'}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isAuthor ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-indigo-200 text-indigo-900'}`}>
                    {isAuthor ? 'Penulis Sah' : 'Terbuka'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAuthor
                    ? 'Anda berdaftar sebagai penulis KaryaDigital. Pantau statistik jualan, royalti terkumpul 70%, dan muat naik karya baharu dalam format e-buku atau komik.'
                    : 'Ingin menulis atau menerbitkan karya anda ke pasaran Malaysia? Terbitkan karya sulung anda untuk menerima 70% royalti terus ke akaun bank.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  {onOpenAuthorPortal && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuthorPortal(isAuthor ? 'dashboard' : 'register');
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{isAuthor ? 'Buka Dashboard Penulis' : 'Daftar Penulis (Jadi Penulis)'}</span>
                      <span>→</span>
                    </button>
                  )}
                  {(user.email?.toLowerCase() === 'mykaryadigital@gmail.com' || user.role === 'admin') && onToggleAuthorRole && (
                    <button
                      type="button"
                      onClick={onToggleAuthorRole}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer shrink-0"
                      title="Uji pertukaran peranan (Hanya dipaparkan kepada Super Admin)"
                    >
                      Tukar Status: {isAuthor ? 'Jadikan Pembaca' : 'Jadikan Penulis'}
                    </button>
                  )}
                </div>
              </div>

              {/* Sesi Pengguna & Log Keluar (Bersih, ringkas & selamat) */}
              {user.isLoggedIn || firebaseUser ? (
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200/90 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {user.name || 'Pembaca KaryaDigital'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        {user.email || firebaseUser?.email}
                      </div>
                    </div>
                  </div>
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('Adakah anda pasti ingin log keluar dari akaun ini?')) {
                          await onSignOut();
                        }
                      }}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Keluar</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
                  <div className="text-xs font-bold text-slate-900">Akaun Pembaca KaryaDigital</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Log masuk untuk menyimpan naskhah digital yang telah dibeli dan menyambung bacaan pada bila-bila masa dari sebarang peranti.
                  </p>
                  {onOpenAuthModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuthModal();
                      }}
                      className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-white" />
                      <span>Log Masuk / Daftar Akaun</span>
                    </button>
                  )}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Ciri Keselamatan Hak Cipta Peribadi</span>
                </div>
                <p className="text-xs text-indigo-800/80 leading-relaxed">
                  Akaun anda dilindungi dengan enkripsi lesen pembaca digital dan pautan masa terhad Cloudflare R2.
                </p>
              </div>

              {onOpenReaderHelp && (
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span>Perlukan bantuan atau soalan bayaran?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenReaderHelp('faq');
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    Bantuan Pembaca & FAQ →
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rak' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Semua E-Buku & Komik Anda ({ownedBooks.length})
                </h4>
              </div>

              {ownedBooks.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Anda belum memiliki e-buku lagi. Terokai katalog atau dapatkan e-buku percuma sekarang!
                </div>
              ) : (
                <div className="space-y-3">
                  {ownedBooks.map((book) => (
                    <div
                      key={book.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-14 rounded-lg bg-gradient-to-br ${book.coverGradient} flex items-center justify-center text-white shrink-0 shadow-xs`}
                        >
                          <BookOpen className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {book.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 truncate">Oleh {book.author}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-semibold text-indigo-600">
                              {book.category === 'novel' ? 'Novel Teks' : 'Komik Grafik'}
                            </span>
                            {isUserBookOwner(book, user) && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Karya Anda (Penulis)
                              </span>
                            )}
                            {user.bookmarks[book.id]?.length > 0 && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-0.5">
                                📌 Hlm {user.bookmarks[book.id][user.bookmarks[book.id].length - 1].pageNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isUserBookOwner(book, user) && onEditBook && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditBook(book);
                            }}
                            className="px-2.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Sunting Naskhah Anda"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span className="hidden sm:inline">Sunting</span>
                          </button>
                        )}
                        {onViewSecureAsset && (
                          <button
                            onClick={() => onViewSecureAsset(book.id, book.title)}
                            className="px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-colors"
                            title="Jana pautan masa terhad Cloudflare R2 (Signed URL)"
                          >
                            🔒 Pautan R2
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const bookBms = user.bookmarks[book.id] || [];
                            const resumePage = bookBms.length > 0 ? bookBms[bookBms.length - 1].pageNumber : 1;
                            onReadBook(book, resumePage);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-2xs"
                        >
                          {user.bookmarks[book.id]?.length > 0
                            ? `Sambung (Hlm ${user.bookmarks[book.id][user.bookmarks[book.id].length - 1].pageNumber})`
                            : 'Buka & Baca'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'karya' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Karya Anda di Katalog KaryaDigital ({authoredBooks.length})
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Naskhah yang diterbitkan dan dipautkan secara rasmi kepada akaun anda.
                  </p>
                </div>
                {onOpenAuthorPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuthorPortal('dashboard');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Dashboard Penulis</span>
                    <span>→</span>
                  </button>
                )}
              </div>

              {authoredBooks.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <PenTool className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Tiada Naskhah Diterbitkan Lagi</h5>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Karya yang anda terbitkan akan dipaparkan di sini dengan hak pengurusan penuh.
                    </p>
                  </div>
                  {onOpenAuthorPortal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuthorPortal('register');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition cursor-pointer"
                    >
                      Terbit Naskhah Sekarang
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {authoredBooks.map((bk) => (
                    <div
                      key={bk.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0 shadow-2xs relative border border-slate-200">
                          {bk.coverImage ? (
                            <img src={bk.coverImage} alt={bk.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-slate-900 p-1 flex flex-col justify-between text-white text-[7px] text-center">
                              <span className="text-amber-400 font-bold uppercase">{bk.category}</span>
                              <span className="line-clamp-2 font-bold leading-tight">{bk.title}</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900 text-sm truncate">{bk.title}</h5>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Aktif
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">Penulis: {bk.author}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-600">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">{bk.genre}</span>
                            <span>•</span>
                            <span className="font-bold text-indigo-600">RM {bk.price.toFixed(2)}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-semibold">Royalti: RM {(bk.price * 0.7).toFixed(2)} (70%)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {onEditBook && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditBook(bk);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                            title="Sunting & Kemas Kini Maklumat Naskhah"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>Sunting</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onReadBook(bk);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Baca Naskhah</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'baki' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-800">Baki e-Dompet Semasa</div>
                  <div className="text-2xl font-black text-emerald-700">
                    RM {user.balance.toFixed(2)}
                  </div>
                </div>
                <Wallet className="w-8 h-8 text-emerald-600" />
              </div>

              {topUpSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tambah nilai berjaya dikreditkan ke e-dompet anda!</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Pilih Nilai Tambah Nilai Segera (FPX / DuitNow):
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleTopUp(10)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 text-center font-bold text-sm text-slate-900 transition-colors"
                  >
                    + RM 10.00
                  </button>
                  <button
                    onClick={() => handleTopUp(30)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 text-center font-bold text-sm text-slate-900 transition-colors"
                  >
                    + RM 30.00
                  </button>
                  <button
                    onClick={() => handleTopUp(50)}
                    className="p-3 rounded-xl border-2 border-indigo-600 bg-indigo-50 text-center font-black text-sm text-indigo-950 transition-colors"
                  >
                    + RM 50.00
                    <span className="block text-[10px] text-indigo-700 font-medium">Disyorkan</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
