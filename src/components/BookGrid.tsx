import React, { useState } from 'react';
import { BookCard } from './BookCard.tsx';
import { EBook, BookCategory } from '../types/ebook.ts';
import { ChevronDown, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

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
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

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

  // 5. Susunan (Sorting) - When default, preserve the curated showcase catalogue sequence
  if (sortBy === 'rating') {
    displayedBooks.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'price-asc') {
    displayedBooks.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    displayedBooks.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'newest') {
    displayedBooks.sort((a, b) => b.publicationYear - a.publicationYear);
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Catalog Header Row: Left Title, Right Filter Buttons */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {activeCategory === 'koleksi' ? 'Rak Perpustakaan Saya' : 'Katalog'}
          </h2>
        </div>

        {/* Desktop & Tablet Filter Dropdowns: Semua Jenis ⌄, Genre ⌄, Harga ⌄, Popular ⌄ */}
        {activeCategory !== 'koleksi' && (
          <div className="hidden sm:flex items-center gap-2">
            {/* 1. Semua Jenis Dropdown */}
            <div className="relative">
              <select
                value={activeCategory}
                onChange={(e) => onCategoryChange(e.target.value as any)}
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
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
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer max-w-[120px] truncate"
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
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
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
                className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
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

        {/* Mobile Filter Buttons: Tapis ⌄ and Susun ⌄ matching showcase mockup */}
        {activeCategory !== 'koleksi' && (
          <div className="sm:hidden flex items-center gap-1.5">
            <button
              onClick={() => {
                setMobileFilterOpen(!mobileFilterOpen);
                setMobileSortOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
            >
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              <span>Tapis</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <button
              onClick={() => {
                setMobileSortOpen(!mobileSortOpen);
                setMobileFilterOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
            >
              <ArrowUpDown className="w-3 h-3 text-slate-500" />
              <span>Susun</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer Filter / Sort Accordions */}
      {mobileFilterOpen && (
        <div className="sm:hidden p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Jenis</label>
              <select
                value={activeCategory}
                onChange={(e) => onCategoryChange(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium"
              >
                <option value="semua">Semua Jenis</option>
                <option value="novel">Novel</option>
                <option value="komik">Komik</option>
                <option value="percuma">Percuma</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Harga</label>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium"
              >
                <option value="semua">Semua</option>
                <option value="percuma">Percuma Sahaja</option>
                <option value="berbayar">Berbayar</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {mobileSortOpen && (
        <div className="sm:hidden p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-xs">
          <label className="block text-[10px] font-bold text-slate-400 mb-1">Susun Mengikut</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'default', label: 'Popular' },
              { id: 'rating', label: 'Penarafan' },
              { id: 'price-asc', label: 'Harga Rendah' },
              { id: 'price-desc', label: 'Harga Tinggi' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSortBy(s.id as any);
                  setMobileSortOpen(false);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  sortBy === s.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Showcase Catalog Grid: 5 Columns Desktop, 3 Columns Tablet, 2 Columns Mobile */}
      {displayedBooks.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Tiada naskhah ditemui bagi kriteria ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
