import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ShoppingCart,
  X,
  Library,
  PenTool,
  Menu,
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Avatar photo matching mockup (smiling woman reader)
  const avatarUrl =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6">
        {/* Top Bar Row: h-12 on mobile for sleek compact footprint, h-16 on tablet/desktop */}
        <div className="flex items-center justify-between h-12 sm:h-16 gap-2 sm:gap-3">
          {/* Left: Mobile/Tablet Hamburger + Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="md:hidden p-1.5 -ml-1 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Menu navigasi"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => {
                onSelectCategory('semua');
                onSearchChange('');
              }}
              className="flex items-center gap-1.5 sm:gap-2 text-left group focus:outline-none rounded-lg p-0.5 shrink-0 cursor-pointer"
              aria-label="KaryaDigital Malaysia - Laman Utama"
            >
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <BookOpen className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400" />
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-base sm:text-xl font-black tracking-tight text-slate-900">
                  Karya<span className="text-indigo-600">Digital</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1 sm:px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-300">
                  MY
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Search Bar (Centered, clean) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari buku atau penulis..."
                className="w-full pl-10 pr-9 py-2 bg-slate-100/80 hover:bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all placeholder:text-slate-400"
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

          {/* Right: Rak Saya, Terbit Karya, Cart with Purple Badge 2, User Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Rak Saya Desktop Link */}
            <button
              onClick={() => {
                onSelectCategory('koleksi');
                onSearchChange('');
              }}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeCategory === 'koleksi'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100'
              }`}
            >
              <Library className="w-4 h-4 text-slate-500" />
              <span>Rak Saya</span>
            </button>

            {/* Terbit Karya Desktop Link */}
            {onOpenAuthorPortal && (
              <button
                onClick={onOpenAuthorPortal}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5 text-slate-500" />
                <span>Terbit Karya</span>
              </button>
            )}

            {/* Cart Icon with Purple Circular Badge */}
            <button
              onClick={onOpenCart}
              className="relative p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label={`Bakul Belian, ${cartCount} buku`}
            >
              <ShoppingCart className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[9px] sm:text-[10px] font-extrabold h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Circular User Avatar */}
            <button
              onClick={onOpenAccount}
              className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-slate-200 hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer focus:outline-none shrink-0"
              aria-label="Akaun Pengguna"
            >
              {!avatarError ? (
                <img
                  src={avatarUrl}
                  alt={user.name}
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-700 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
                  {user.name.charAt(0)}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Second Row Search Bar for Mobile and Tablet (Slim, sleek, space-efficient) */}
        <div className="lg:hidden pb-2 pt-0.5">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari buku atau penulis..."
              className="w-full pl-8.5 pr-8 py-1.5 bg-slate-100/90 text-xs text-slate-900 rounded-lg sm:rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 transition-all placeholder:text-slate-400 h-8 sm:h-9"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                aria-label="Kosongkan carian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Drawer when hamburger clicked */}
        {mobileDrawerOpen && (
          <div className="md:hidden py-2.5 border-t border-slate-100 flex flex-col gap-1.5">
            <button
              onClick={() => {
                onSelectCategory('koleksi');
                setMobileDrawerOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left"
            >
              <Library className="w-4 h-4 text-indigo-600" />
              <span>Rak Saya ({user.ownedBookIds.length})</span>
            </button>
            {onOpenAuthorPortal && (
              <button
                onClick={() => {
                  onOpenAuthorPortal();
                  setMobileDrawerOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left"
              >
                <PenTool className="w-4 h-4 text-indigo-600" />
                <span>Terbit Karya (Portal Penulis)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
