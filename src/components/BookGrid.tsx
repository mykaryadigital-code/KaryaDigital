import React, { useState } from 'react';
import { BookCard } from './BookCard.tsx';
import { EBook, BookCategory } from '../types/ebook.ts';
import { Filter, X, ArrowUpDown, BookOpen, Check } from 'lucide-react';

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
  const [accessFilter, setAccessFilter] = useState<'semua' | 'percuma' | 'berbayar'>('semua');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('popular');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Extract all unique genres
  const allGenres = Array.from(new Set(books.map((b) => b.genre)));

  // Filter pipeline
  let displayedBooks = [...books];

  // 1. Jenis Buku (Category)
  if (activeCategory === 'novel') {
    displayedBooks = displayedBooks.filter((b) => b.category === 'novel');
  } else if (activeCategory === 'komik') {
    displayedBooks = displayedBooks.filter((b) => b.category === 'komik');
  } else if (activeCategory === 'seram') {
    displayedBooks = displayedBooks.filter((b) => b.category === 'seram');
  } else if (activeCategory === 'agama') {
    displayedBooks = displayedBooks.filter((b) => b.category === 'agama');
  } else if (activeCategory === 'koleksi') {
    displayedBooks = displayedBooks.filter((b) => ownedBookIds.includes(b.id));
  } else if (activeCategory === 'percuma') {
    displayedBooks = displayedBooks.filter((b) => b.price === 0 || b.isFree);
  }

  // 2. Akses (Percuma / Berbayar)
  if (accessFilter === 'percuma') {
    displayedBooks = displayedBooks.filter((b) => b.price === 0 || b.isFree);
  } else if (accessFilter === 'berbayar') {
    displayedBooks = displayedBooks.filter((b) => b.price > 0 && !b.isFree);
  }

  // 3. Genre
  if (selectedGenre !== 'semua') {
    displayedBooks = displayedBooks.filter(
      (b) => b.genre.toLowerCase() === selectedGenre.toLowerCase()
    );
  }

  // 4. Search Query
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

  // 5. Sorting
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

  // Calculate active filter count for badge
  let activeFilterCount = 0;
  if (activeCategory !== 'semua' && activeCategory !== 'koleksi') activeFilterCount++;
  if (selectedGenre !== 'semua') activeFilterCount++;
  if (accessFilter !== 'semua') activeFilterCount++;

  const resetAllFilters = () => {
    onCategoryChange('semua');
    setSelectedGenre('semua');
    setAccessFilter('semua');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Heading & Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeCategory === 'koleksi'
                ? 'Rak Perpustakaan Saya'
                : 'Katalog E-Buku & Komik'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeCategory === 'koleksi'
                ? `${displayedBooks.length} naskhah dimiliki dalam akaun anda.`
                : `Menampilkan ${displayedBooks.length} naskhah sedia dibaca.`}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold shadow-2xs hover:bg-slate-50"
            >
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tapis</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
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
        </div>

        {/* Desktop Structured Filters: Jenis Buku, Genre, Percuma/Berbayar */}
        {activeCategory !== 'koleksi' && (
          <div className="hidden md:flex flex-col gap-3 pt-1">
            {/* 1. Jenis Buku */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider min-w-[70px]">
                Jenis Buku:
              </span>
              {[
                { id: 'semua', label: 'Semua' },
                { id: 'novel', label: 'Novel Teks' },
                { id: 'komik', label: 'Komik & Manga' },
                { id: 'seram', label: 'Seram' },
                { id: 'agama', label: 'Agama & Motivasi' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onCategoryChange(item.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                    activeCategory === item.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 2. Genre & Akses Row */}
            <div className="flex items-center justify-between gap-4 flex-wrap pt-1 border-t border-slate-100">
              {/* Genre Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider min-w-[70px]">
                  Genre:
                </span>
                <button
                  onClick={() => setSelectedGenre('semua')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedGenre === 'semua'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Semua Genre
                </button>
                {allGenres.slice(0, 6).map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                      selectedGenre === genre
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {/* Akses (Percuma / Berbayar) */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs">
                <button
                  onClick={() => setAccessFilter('semua')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    accessFilter === 'semua'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setAccessFilter('percuma')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    accessFilter === 'percuma'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Percuma Sahaja
                </button>
                <button
                  onClick={() => setAccessFilter('berbayar')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    accessFilter === 'berbayar'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Berbayar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Book Grid: 4 kolum di desktop dan 2 kolum di telefon */}
      {displayedBooks.length === 0 ? (
        <div className="text-center py-14 px-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">Tiada Naskhah Ditemui</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeCategory === 'koleksi'
              ? 'Anda belum memiliki sebarang buku dalam rak perpustakaan. Terokai katalog untuk menambah karya pilihan.'
              : 'Sila ubah carian atau set semula penapis untuk melihat buku yang ada.'}
          </p>
          <button
            onClick={resetAllFilters}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 transition"
          >
            Set Semula Penapis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
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

      {/* Mobile Filter Drawer / Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex flex-col justify-end md:hidden">
          <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">Tapis Katalog</h3>
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Jenis Buku */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Jenis Buku
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'semua', label: 'Semua' },
                  { id: 'novel', label: 'Novel Teks' },
                  { id: 'komik', label: 'Komik & Manga' },
                  { id: 'seram', label: 'Seram' },
                  { id: 'agama', label: 'Agama & Motivasi' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onCategoryChange(item.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold text-left transition ${
                      activeCategory === item.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Akses (Percuma / Berbayar) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Akses
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAccessFilter('semua')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition ${
                    accessFilter === 'semua'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setAccessFilter('percuma')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition ${
                    accessFilter === 'percuma'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Percuma
                </button>
                <button
                  onClick={() => setAccessFilter('berbayar')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition ${
                    accessFilter === 'berbayar'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Berbayar
                </button>
              </div>
            </div>

            {/* 3. Genre */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Genre
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedGenre('semua')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    selectedGenre === 'semua'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Semua Genre
                </button>
                {allGenres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      selectedGenre === genre
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                onClick={resetAllFilters}
                className="py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Set Semula
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Terapkan Penapis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
