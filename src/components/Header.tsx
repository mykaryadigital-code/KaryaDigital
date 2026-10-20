import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ShoppingCart,
  User,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  Library,
} from 'lucide-react';
import { BookCategory, UserProfile } from '../types/ebook.ts';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  activeCategory: 'semua' | BookCategory | 'percuma' | 'koleksi';
  onSelectCategory: (cat: 'semua' | BookCategory | 'percuma' | 'koleksi') => void;
  user: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  onOpenAccount,
  activeCategory,
  onSelectCategory,
  user,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Banner Bar: Malaysian Local Content Guarantee */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium">Pesta Buku Digital Malaysia 2026</span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="hidden sm:inline text-slate-300">
              Guna kod <strong className="text-amber-300 font-mono">KARYALOKAL</strong> untuk diskaun RM5.00
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-300 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Hak Cipta Penulis Terpelihara
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Brand Logo */}
          <button
            onClick={() => {
              onSelectCategory('semua');
              onSearchChange('');
            }}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg p-1"
            aria-label="KaryaDigital Malaysia - Laman Utama"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-amber-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-indigo-900 transition-colors">
                  Karya<span className="text-amber-600">Digital</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-sm bg-indigo-100 text-indigo-800 border border-indigo-200">
                  MY
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide -mt-0.5 hidden xs:block">
                Platform E-Buku & Komik Tempatan Malaysia
              </p>
            </div>
          </button>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari tajuk novel, komik, seram, motivasi, atau penulis tempatan..."
                className="w-full pl-10 pr-9 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label="Kosongkan carian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons (Coins Balance, Cart, Account, Mobile Menu Toggle) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Syiling / Kredit & Butang Top-Up */}
            <div className="flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 shadow-xs">
              <span className="text-base select-none">🪙</span>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase font-bold text-amber-700 leading-none">
                  Baki Syiling
                </span>
                <span className="text-xs font-black text-amber-950 leading-tight">
                  {Math.round(user.balance * 10)} Syiling
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenAccount}
                className="ml-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-[11px] shadow-xs transition cursor-pointer"
                title="Tambah Nilai Syiling"
              >
                + Top-Up
              </button>
            </div>

            {/* Standalone HTML Prototype Direct Link */}
            <a
              href="/homepage.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/90 transition-colors"
              title="Buka fail HTML tunggal KaryaDigital"
            >
              <span>📄 Fail Tunggal HTML</span>
            </a>

            {/* Perpustakaan Saya Quick Link (Desktop) */}
            <button
              onClick={() => onSelectCategory('koleksi')}
              className={`hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeCategory === 'koleksi'
                  ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Library className="w-4 h-4 text-indigo-600" />
              <span>Rak Buku ({user.ownedBookIds.length})</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 transition-colors flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              aria-label={`Bakul Belian, ${cartCount} buku dipilih`}
            >
              <ShoppingCart className="w-5 h-5 text-slate-700" />
              <span className="hidden sm:inline text-xs font-bold text-slate-800">Bakul</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 sm:top-1 sm:right-2 sm:relative sm:top-0 sm:right-0 bg-rose-600 text-white text-[11px] font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Account Profile Button */}
            <button
              onClick={onOpenAccount}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              aria-label="Buka profil akaun pengguna"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-700 to-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">
                  {user.name}
                </p>
                <p className="text-[11px] font-semibold text-emerald-600">
                  RM {user.balance.toFixed(2)}
                </p>
              </div>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (under header for small devices) */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari novel, komik, atau penulis tempatan..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 text-sm text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-600"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                aria-label="Kosongkan carian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Category Navigation Tab Links */}
        <nav className="hidden md:flex items-center space-x-1 border-t border-slate-100 py-2.5">
          <button
            onClick={() => onSelectCategory('semua')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeCategory === 'semua'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Semua Katalog
          </button>
          <button
            onClick={() => onSelectCategory('novel')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeCategory === 'novel'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            📖 Novel Teks Tempatan
          </button>
          <button
            onClick={() => onSelectCategory('komik')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeCategory === 'komik'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            💥 Komik & Novel Grafik
          </button>
          <button
            onClick={() => onSelectCategory('percuma')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeCategory === 'percuma'
                ? 'bg-emerald-700 text-white'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            🎁 E-Buku Percuma
          </button>
          <button
            onClick={() => onSelectCategory('koleksi')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeCategory === 'koleksi'
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            📚 Koleksi Rak Saya ({user.ownedBookIds.length})
          </button>
        </nav>
      </div>

      {/* Mobile Drawer / Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
            Kategori Naskhah
          </div>
          <button
            onClick={() => {
              onSelectCategory('semua');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between ${
              activeCategory === 'semua'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Semua Katalog</span>
          </button>
          <button
            onClick={() => {
              onSelectCategory('novel');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between ${
              activeCategory === 'novel'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>📖 Novel Teks Tempatan</span>
          </button>
          <button
            onClick={() => {
              onSelectCategory('komik');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between ${
              activeCategory === 'komik'
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>💥 Komik & Novel Grafik</span>
          </button>
          <button
            onClick={() => {
              onSelectCategory('percuma');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between ${
              activeCategory === 'percuma'
                ? 'bg-emerald-700 text-white'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span>🎁 E-Buku Percuma</span>
          </button>
          <button
            onClick={() => {
              onSelectCategory('koleksi');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between ${
              activeCategory === 'koleksi'
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <span>📚 Perpustakaan Saya ({user.ownedBookIds.length})</span>
          </button>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between px-2">
            <div>
              <div className="text-xs text-slate-500">Log Masuk Sebagai</div>
              <div className="text-sm font-bold text-slate-800">{user.name}</div>
            </div>
            <button
              onClick={() => {
                onOpenAccount();
                setMobileMenuOpen(false);
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 bg-indigo-50 rounded-lg"
            >
              Lihat Akaun
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
