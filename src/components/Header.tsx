import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ShoppingCart,
  X,
  Library,
  PenTool,
  LayoutDashboard,
  Menu,
  LogIn,
  Crown,
} from 'lucide-react';
import { BookCategory, UserProfile } from '../types/ebook.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenAuthModal?: () => void;
  onOpenAdminDashboard?: () => void;
  activeCategory: 'semua' | BookCategory | 'percuma' | 'koleksi';
  onSelectCategory: (cat: 'semua' | BookCategory | 'percuma' | 'koleksi') => void;
  user: UserProfile;
  isAuthor?: boolean;
  onFocusSearch?: () => void;
  onOpenAuthorPortal?: (tab?: 'register' | 'guide' | 'royalty' | 'dashboard') => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  onOpenAccount,
  onOpenAuthModal,
  onOpenAdminDashboard,
  activeCategory,
  onSelectCategory,
  user,
  isAuthor = false,
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

            {/* Terbit Karya / Dashboard Penulis Desktop Link */}
            {onOpenAuthorPortal && (
              <button
                onClick={() => onOpenAuthorPortal(isAuthor ? 'dashboard' : 'register')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label={isAuthor ? 'Dashboard Penulis' : 'Terbit Karya'}
              >
                {isAuthor ? (
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <PenTool className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{isAuthor ? 'Dashboard Penulis' : 'Terbit Karya'}</span>
              </button>
            )}

            {/* PWA Install Button (Mobile & Desktop) */}
            <PWAInstallButton variant="nav" />

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

            {/* User Profile or Login Button */}
            {user.isLoggedIn ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Super Admin Quick Button */}
                {(user.email?.toLowerCase() === 'mykaryadigital@gmail.com' || user.role === 'admin') && onOpenAdminDashboard && (
                  <button
                    type="button"
                    onClick={onOpenAdminDashboard}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs shadow-xs transition-all cursor-pointer shrink-0 border border-amber-300 active:scale-95"
                    title="Buka Pusat Kawalan Super Admin KaryaDigital"
                  >
                    <Crown className="w-3.5 h-3.5 text-slate-950" />
                    <span className="hidden sm:inline">Panel Admin</span>
                  </button>
                )}

                {isAuthor && user.role !== 'admin' && (
                  <span className="hidden xl:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                    Penulis
                  </span>
                )}

                <button
                  onClick={onOpenAccount}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer focus:outline-none"
                  aria-label="Akaun Pengguna"
                  title={`${user.name} (${user.email})`}
                >
                  <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-slate-300 shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : !avatarError ? (
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
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white"></span>
                  </div>
                  <span className="hidden sm:inline-block text-xs font-bold text-slate-800 max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-indigo-600/20 cursor-pointer shrink-0"
                aria-label="Log Masuk ke KaryaDigital"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-300" />
                <span>Log Masuk</span>
              </button>
            )}
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
          <div className="md:hidden py-3 border-t border-slate-100 flex flex-col gap-2">
            {!user.isLoggedIn ? (
              <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-amber-50/50 border border-indigo-100 mb-1">
                <div className="text-xs font-bold text-slate-900">Selamat datang ke KaryaDigital!</div>
                <div className="text-[11px] text-slate-500 mb-2">Log masuk untuk akses rak buku & segerak naskhah.</div>
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onOpenAuthModal?.();
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-300" />
                  <span>Log Masuk / Daftar Akaun</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onOpenAccount();
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{user.name}</div>
                    <div className="text-[10px] text-slate-500">{user.email}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600">Akaun →</span>
              </button>
            )}

            {(user.email?.toLowerCase() === 'mykaryadigital@gmail.com' || user.role === 'admin') && onOpenAdminDashboard && (
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onOpenAdminDashboard();
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-xs text-left cursor-pointer"
              >
                <Crown className="w-4 h-4 text-slate-950" />
                <span>Pusat Kawalan Super Admin</span>
              </button>
            )}

            <button
              onClick={() => {
                onSelectCategory('koleksi');
                setMobileDrawerOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left cursor-pointer"
            >
              <Library className="w-4 h-4 text-indigo-600" />
              <span>Rak Saya ({user.ownedBookIds.length})</span>
            </button>
            {onOpenAuthorPortal && (
              <button
                onClick={() => {
                  onOpenAuthorPortal(isAuthor ? 'dashboard' : 'register');
                  setMobileDrawerOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 text-left cursor-pointer"
              >
                {isAuthor ? (
                  <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                ) : (
                  <PenTool className="w-4 h-4 text-indigo-600" />
                )}
                <span>{isAuthor ? 'Dashboard Penulis' : 'Jadi Penulis'}</span>
              </button>
            )}

            {/* PWA Mobile Install Banner */}
            <div className="pt-2 border-t border-slate-100">
              <PWAInstallButton variant="full" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
