import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ShoppingCart,
  User,
  X,
  Library,
  PenTool,
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
  onFocusSearch?: () => void;
  onOpenAuthorPortal?: () => void;
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
  onOpenAuthorPortal,
}) => {
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo Platform */}
          <button
            onClick={() => {
              onSelectCategory('semua');
              onSearchChange('');
            }}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg p-1 shrink-0"
            aria-label="KaryaDigital Malaysia - Laman Utama"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-950 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  Karya<span className="text-amber-600">Digital</span>
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  MY
                </span>
              </div>
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
                placeholder="Cari novel, komik, atau nama penulis..."
                className="w-full pl-10 pr-9 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all placeholder:text-slate-400"
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

          {/* Header Action Buttons: Search Toggle (Mobile), Rak Saya, Bakul, Profil */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Button */}
            <button
              onClick={() => setMobileSearchVisible(!mobileSearchVisible)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Buka carian"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Rak Saya Quick Link (Mobile uses MobileBottomNav, Desktop uses Header) */}
            <button
              onClick={() => {
                onSelectCategory('koleksi');
                onSearchChange('');
              }}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeCategory === 'koleksi'
                  ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Perpustakaan Saya"
            >
              <Library className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Rak Saya</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 font-bold">
                {user.ownedBookIds.length}
              </span>
            </button>

            {/* Terbit Karya / Portal Penulis */}
            {onOpenAuthorPortal && (
              <button
                onClick={onOpenAuthorPortal}
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                title="Portal Penulis & Terbit Karya"
              >
                <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                <span>Terbit Karya</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              aria-label={`Bakul Belian, ${cartCount} buku`}
            >
              <ShoppingCart className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline text-xs font-bold">Bakul</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:static bg-rose-600 text-white text-[11px] font-bold h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profil Button (Opens AccountModal which holds coins & top-up) */}
            <button
              onClick={onOpenAccount}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              aria-label="Profil Akaun"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-slate-900 to-indigo-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">
                  {user.name}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold">
                  Akaun Saya
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search Expandable Drawer/Bar */}
        {mobileSearchVisible && (
          <div className="md:hidden pb-3 pt-1 border-t border-slate-100">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari novel, komik, atau penulis..."
                className="w-full pl-9 pr-8 py-2 bg-slate-100 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
