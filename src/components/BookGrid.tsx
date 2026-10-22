import React, { useState } from 'react';
import { BookCard } from './BookCard.tsx';
import { EBook, BookCategory } from '../types/ebook.ts';
import { ChevronDown, SlidersHorizontal, ArrowUpDown, X, Check, RotateCcw } from 'lucide-react';

interface BookGridProps {
  books: EBook[];
  activeCategory: 'semua' | BookCategory | 'percuma' | 'koleksi';
  onCategoryChange: (cat: 'semua' | BookCategory | 'percuma' | 'koleksi') => void;
  ownedBookIds: string[];
  cartBookIds: string[];
  onRead: (book: EBook) => void;
  onAddToCart: (book: EBook) => void;
  onViewDetails?: (book: EBook) => void;
  searchQuery: string;
}

export const BookGrid: React.FC<BookGridProps> = ({
  books,
  activeCategory,
  onCategoryChange,
  ownedBookIds,
  cartBookIds,
  onRead,
  onAddToCart,
  onViewDetails,
  searchQuery,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('semua');
  const [priceFilter, setPriceFilter] = useState<'semua' | 'percuma' | 'berbayar'>('semua');
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'price-asc' | 'price-desc' | 'newest'>('default');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isSortPanelOpen, setIsSortPanelOpen] = useState(false);

  // Extract all unique genres for dropdown
  const allGenres = Array.from(new Set(books.map((b) => b.genre))).sort();

  // Filter pipeline
  let displayedBooks = [...books];

  // 1. Jenis Buku (Category)
  if (activeCategory === 'novel') {
    displayedBooks = displayedBooks.filter((b) => b.category === 'novel');
  } else if (activeCategory === 'komik') {
    displayedBooks = displayedBooks.filter((b) => b.category === 'komik');
  } else if (activeCategory === 'koleksi') {
    displayedBooks = displayedBooks.filter((b) => ownedBookIds.includes(b.id));
  } else if (activeCategory === 'percuma') {
    displayedBooks = displayedBooks.filter((b) => b.price === 0 || b.isFree);
  }

  // 2. Genre
  if (selectedGenre !== 'semua') {
    displayedBooks = displayedBooks.filter(
      (b) => b.genre.toLowerCase() === selectedGenre.toLowerCase()
    );
  }

  // 3. Harga
  if (priceFilter === 'percuma') {
    displayedBooks = displayedBooks.filter((b) => b.price === 0 || b.isFree);
  } else if (priceFilter === 'berbayar') {
    displayedBooks = displayedBooks.filter((b) => b.price > 0 && !b.isFree);
  }

  // 4. Carian Kata Kunci
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    displayedBooks = displayedBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q) ||
        b.synopsis.toLowerCase().includes(q)
    );
  }

  // 5. Susunan (Sorting)
  if (sortBy === 'rating') {
    displayedBooks.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'price-asc') {
    displayedBooks.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    displayedBooks.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'newest') {
    displayedBooks.sort((a, b) => b.publicationYear - a.publicationYear);
  }

  const isFiltered = activeCategory !== 'semua' || selectedGenre !== 'semua' || priceFilter !== 'semua';

  const resetFilters = () => {
    onCategoryChange('semua');
    setSelectedGenre('semua');
    setPriceFilter('semua');
  };

  const sortOptions = [
    { id: 'default', label: 'Paling Popular' },
    { id: 'rating', label: 'Penarafan Tertinggi' },
    { id: 'price-asc', label: 'Harga: Rendah ke Tinggi' },
    { id: 'price-desc', label: 'Harga: Tinggi ke Rendah' },
    { id: 'newest', label: 'Terkini' },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Catalog Header Row: Left Title, Right Filter Buttons */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {activeCategory === 'koleksi' ? 'Rak Perpustakaan Saya' : 'Katalog'}
          </h2>
        </div>

        {/* Desktop & Tablet Inline Filters: Semua Jenis ⌄, Genre ⌄, Harga ⌄, Popular ⌄ */}
        {activeCategory !== 'koleksi' && (
          <div className="hidden sm:flex items-center gap-2">
            {/* 1. Semua Jenis Dropdown */}
            <div className="relative">
              <select
                value={activeCategory}
                onChange={(e) => onCategoryChange(e.target.value as any)}
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
                aria-label="Tapis mengikut Jenis"
              >
                <option value="semua">Semua Jenis</option>
                <option value="novel">Novel</option>
                <option value="komik">Komik</option>
                <option value="percuma">Percuma</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 2. Genre Dropdown */}
            <div className="relative">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer max-w-[130px] truncate"
                aria-label="Tapis mengikut Genre"
              >
                <option value="semua">Genre</option>
                {allGenres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 3. Harga Dropdown */}
            <div className="relative">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
                aria-label="Tapis mengikut Harga"
              >
                <option value="semua">Harga</option>
                <option value="percuma">Percuma</option>
                <option value="berbayar">Berbayar</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 4. Popular / Susunan Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
                aria-label="Susunan"
              >
                <option value="default">Popular</option>
                <option value="rating">Penarafan</option>
                <option value="price-asc">Harga: Rendah</option>
                <option value="price-desc">Harga: Tinggi</option>
                <option value="newest">Terkini</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Mobile Filter Buttons: Tapis & Susun (Open Interactive Sheet Panels) */}
        {activeCategory !== 'koleksi' && (
          <div className="sm:hidden flex items-center gap-2">
            <button
              onClick={() => setIsFilterPanelOpen(true)}
              className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
                isFiltered
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Tapis</span>
              {isFiltered && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setIsSortPanelOpen(true)}
              className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-all cursor-pointer active:scale-95"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Susun</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Modal/Bottom Sheet: Panel Tapis */}
      {isFilterPanelOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full bg-white rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Tapis Katalog</h3>
              </div>
              <button
                onClick={() => setIsFilterPanelOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter by Category */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Jenis Karya
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'semua', label: 'Semua Jenis' },
                  { id: 'novel', label: 'Novel' },
                  { id: 'komik', label: 'Komik' },
                  { id: 'percuma', label: 'Percuma' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onCategoryChange(item.id as any)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold text-left border transition-colors flex items-center justify-between ${
                      activeCategory === item.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    {activeCategory === item.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Price */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Harga
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'semua', label: 'Semua' },
                  { id: 'percuma', label: 'Percuma' },
                  { id: 'berbayar', label: 'Berbayar' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPriceFilter(item.id as any)}
                    className={`py-2 px-2 text-center rounded-lg text-xs font-semibold border transition-colors ${
                      priceFilter === item.id
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Genre */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Genre Pilihan
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800"
              >
                <option value="semua">Semua Genre</option>
                {allGenres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={resetFilters}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Set Semula</span>
              </button>
              <button
                onClick={() => setIsFilterPanelOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Modal/Bottom Sheet: Panel Susun */}
      {isSortPanelOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full bg-white rounded-t-2xl p-5 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Susun Mengikut</h3>
              </div>
              <button
                onClick={() => setIsSortPanelOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSortBy(opt.id as any);
                    setIsSortPanelOpen(false);
                  }}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-left border flex items-center justify-between transition-colors ${
                    sortBy === opt.id
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Responsive Grid: Mobile 2 columns (<768px), Tablet 3 columns (768px-1023px), Desktop 5 columns (1024px+) */}
      {displayedBooks.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Tiada naskhah ditemui bagi kriteria ini.</p>
          <button
            onClick={resetFilters}
            className="mt-3 px-3.5 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-lg"
          >
            Set Semula Penapis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {displayedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isOwned={ownedBookIds.includes(book.id)}
              isInCart={cartBookIds.includes(book.id)}
              onRead={onRead}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
