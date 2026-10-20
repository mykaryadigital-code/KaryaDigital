import React, { useState } from 'react';
import { BookCard } from './BookCard.tsx';
import { EBook, BookCategory } from '../types/ebook.ts';
import { BookOpen, RotateCcw } from 'lucide-react';

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
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('popular');

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

  // 2. Genre (Termasuk Seram dan Agama & Motivasi)
  if (selectedGenre !== 'semua') {
    displayedBooks = displayedBooks.filter(
      (b) => b.genre.toLowerCase() === selectedGenre.toLowerCase()
    );
  }

  // 3. Harga (Akses)
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
  displayedBooks.sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return b.publicationYear - a.publicationYear;
      case 'popular':
      default:
        return b.reviewsCount - a.reviewsCount;
    }
  });

  const resetAllFilters = () => {
    onCategoryChange('semua');
    setSelectedGenre('semua');
    setPriceFilter('semua');
    setSortBy('popular');
  };

  const isFiltered = activeCategory !== 'semua' || selectedGenre !== 'semua' || priceFilter !== 'semua' || sortBy !== 'popular';

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header Tajuk Katalog / Rak */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {activeCategory === 'koleksi'
              ? 'Rak Perpustakaan Saya'
              : 'Katalog E-Buku & Komik'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeCategory === 'koleksi'
              ? `${displayedBooks.length} naskhah dimiliki dalam akaun anda.`
              : `Menampilkan ${displayedBooks.length} naskhah pilihan tempatan.`}
          </p>
        </div>

        {/* Reset Filter shortcut if filters active */}
        {isFiltered && activeCategory !== 'koleksi' && (
          <button
            onClick={resetAllFilters}
            className="self-start sm:self-auto text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Set Semula</span>
          </button>
        )}
      </div>

      {/* Satu Baris Penapis Dropdown: Jenis Buku, Genre, Harga, Susun */}
      {activeCategory !== 'koleksi' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          {/* 1. Jenis Buku */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Jenis Buku
            </label>
            <select
              value={activeCategory}
              onChange={(e) => onCategoryChange(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors cursor-pointer"
              aria-label="Tapis mengikut Jenis Buku"
            >
              <option value="semua">Semua Jenis</option>
              <option value="novel">Novel Teks (ePub)</option>
              <option value="komik">Komik & Manga</option>
            </select>
          </div>

          {/* 2. Genre (Termasuk Seram dan Agama & Motivasi) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Genre
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors cursor-pointer"
              aria-label="Tapis mengikut Genre"
            >
              <option value="semua">Semua Genre</option>
              {allGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Harga */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Harga
            </label>
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors cursor-pointer"
              aria-label="Tapis mengikut Harga"
            >
              <option value="semua">Semua Harga</option>
              <option value="percuma">Percuma Sahaja</option>
              <option value="berbayar">Berbayar</option>
            </select>
          </div>

          {/* 4. Susun */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Susunan
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors cursor-pointer"
              aria-label="Susunan buku"
            >
              <option value="popular">Paling Popular</option>
              <option value="rating">Penarafan Tertinggi</option>
              <option value="price-asc">Harga: Rendah ke Tinggi</option>
              <option value="price-desc">Harga: Tinggi ke Rendah</option>
              <option value="newest">Terkini</option>
            </select>
          </div>
        </div>
      )}

      {/* Grid Katalog: 4 Kolum Desktop, 3 Tablet, 2 Telefon dengan Jarak Konsisten */}
      {displayedBooks.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <BookOpen className="w-9 h-9 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">Tiada Naskhah Ditemui</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeCategory === 'koleksi'
              ? 'Anda belum memiliki buku dalam rak perpustakaan. Sila terokai katalog untuk menambah karya pilihan.'
              : 'Sila ubah pilihan penapis atau kosongkan carian.'}
          </p>
          <button
            onClick={resetAllFilters}
            className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition cursor-pointer"
          >
            Set Semula Penapis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
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
