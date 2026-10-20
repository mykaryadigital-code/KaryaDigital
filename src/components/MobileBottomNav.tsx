import React from 'react';
import { Home, Search, Library, User } from 'lucide-react';
import { BookCategory } from '../types/ebook.ts';

interface MobileBottomNavProps {
  activeCategory: 'semua' | BookCategory | 'percuma' | 'koleksi';
  onSelectCategory: (cat: 'semua' | BookCategory | 'percuma' | 'koleksi') => void;
  ownedBooksCount: number;
  onOpenSearch: () => void;
  onOpenAccount: () => void;
  isSearchActive: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeCategory,
  onSelectCategory,
  ownedBooksCount,
  onOpenSearch,
  onOpenAccount,
  isSearchActive,
}) => {
  const isHomeActive = activeCategory !== 'koleksi' && !isSearchActive;
  const isShelfActive = activeCategory === 'koleksi';

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg safe-bottom"
      aria-label="Navigasi Bawah Telefon"
    >
      <div className="grid grid-cols-4 items-center justify-around h-15 px-2">
        {/* 1. Utama */}
        <button
          onClick={() => {
            onSelectCategory('semua');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
            isHomeActive
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Laman Utama"
        >
          <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Utama</span>
        </button>

        {/* 2. Cari */}
        <button
          onClick={onOpenSearch}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
            isSearchActive
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label="Cari Buku"
        >
          <Search className={`w-5 h-5 ${isSearchActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5">Cari</span>
        </button>

        {/* 3. Rak Saya */}
        <button
          onClick={() => onSelectCategory('koleksi')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors relative ${
            isShelfActive
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
          aria-label={`Rak Saya, ${ownedBooksCount} buku`}
        >
          <div className="relative">
            <Library className={`w-5 h-5 ${isShelfActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {ownedBooksCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-2xs">
                {ownedBooksCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Rak Saya</span>
        </button>

        {/* 4. Akaun */}
        <button
          onClick={onOpenAccount}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 hover:text-slate-900 font-medium transition-colors"
          aria-label="Profil dan Akaun"
        >
          <User className="w-5 h-5 stroke-2" />
          <span className="text-[10px] mt-0.5">Akaun</span>
        </button>
      </div>
    </nav>
  );
};
