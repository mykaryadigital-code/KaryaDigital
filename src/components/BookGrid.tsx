import React, { useState } from 'react';
import { BookCard } from './BookCard.tsx';
import { EBook, BookCategory } from '../types/ebook.ts';
import { ArrowUpDown, BookOpen, Zap, Sparkles, Filter, Library } from 'lucide-react';

interface BookGridProps {
  books: EBook[];
  activeCategory: 'semua' | BookCategory | 'percuma' | 'koleksi';
  onCategoryChange: (cat: 'semua' | BookCategory | 'percuma' | 'koleksi') => void;
  ownedBookIds: string[];
  cartBookIds: string[];
  onRead: (book: EBook) => void;
  onAddToCart: (book: EBook) => void;
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
  searchQuery,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('semua');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('popular');

  // Extract all unique genres for filtering
  const allGenres = Array.from(new Set(books.map((b) => b.genre)));

  // Filter based on active category
  let displayedBooks = [...books];

  if (activeCategory === 'novel') {
    displayedBooks = displayedBooks.filter((b) => b.category === 'novel');
  } else if (activeCategory === 'komik') {
    displayedBooks = displayedBooks.filter((b) => b.category === 'komik');
  } else if (activeCategory === 'seram') {
    displayedBooks = displayedBooks.filter((b) => b.category === 'seram');
  } else if (activeCategory === 'agama') {
    displayedBooks = displayedBooks.filter((b) => b.category === 'agama');
  } else if (activeCategory === 'percuma') {
    displayedBooks = displayedBooks.filter((b) => b.price === 0 || b.isFree);
  } else if (activeCategory === 'koleksi') {
    displayedBooks = displayedBooks.filter((b) => ownedBookIds.includes(b.id));
  }

  // Genre filter
  if (selectedGenre !== 'semua') {
    displayedBooks = displayedBooks.filter(
      (b) => b.genre.toLowerCase() === selectedGenre.toLowerCase()
    );
  }

  // Search filter
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

  // Sorting
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

  // Segregated sections for "Semua" mode
  const novelList = displayedBooks.filter((b) => b.category === 'novel');
  const komikList = displayedBooks.filter((b) => b.category === 'komik');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Category Tabs & Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeCategory === 'koleksi'
                ? 'Rak Perpustakaan Saya'
                : activeCategory === 'novel'
                ? 'Katalog Novel Teks Tempatan'
                : activeCategory === 'komik'
                ? 'Katalog Komik & Manga'
                : activeCategory === 'seram'
                ? 'Katalog Kisah Seram & Misteri'
                : activeCategory === 'agama'
                ? 'Katalog Agama & Motivasi'
                : activeCategory === 'percuma'
                ? 'Koleksi E-Buku Percuma'
                : 'Katalog E-Buku & Komik Malaysia'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeCategory === 'koleksi'
                ? `Menampilkan ${displayedBooks.length} naskhah yang telah anda buka atau beli.`
                : 'Pilih karya kegemaran dan mulakan bacaan serta-merta di mana-mana peranti.'}
            </p>
          </div>

          {/* Interactive Category Filter Tabs (Semua, Novel Teks, Komik & Manga, Seram, Agama & Motivasi, Percuma) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => {
                onCategoryChange('semua');
                setSelectedGenre('semua');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeCategory === 'semua'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => {
                onCategoryChange('novel');
                setSelectedGenre('semua');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeCategory === 'novel'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Novel Teks</span>
            </button>
            <button
              onClick={() => {
                onCategoryChange('komik');
                setSelectedGenre('semua');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeCategory === 'komik'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Komik & Manga</span>
            </button>
            <button
              onClick={() => {
                onCategoryChange('seram');
                setSelectedGenre('semua');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeCategory === 'seram'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>👻 Seram</span>
            </button>
            <button
              onClick={() => {
                onCategoryChange('agama');
                setSelectedGenre('semua');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeCategory === 'agama'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🕌 Agama & Motivasi</span>
            </button>
            <button
              onClick={() => {
                onCategoryChange('percuma');
                setSelectedGenre('semua');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeCategory === 'percuma'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Percuma
            </button>
            <button
              onClick={() => {
                onCategoryChange('koleksi');
                setSelectedGenre('semua');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeCategory === 'koleksi'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Library className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rak ({ownedBookIds.length})</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: Genre Tags & Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Genre Scrollable Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-slate-400 text-xs font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Genre:
            </span>
            <button
              onClick={() => setSelectedGenre('semua')}
              className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${
                selectedGenre === 'semua'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Semua Genre
            </button>
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${
                  selectedGenre === genre
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <label htmlFor="sort-select" className="text-xs font-medium text-slate-500">
              Susun ikut:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="popular">Paling Laris</option>
              <option value="rating">Penarafan Tertinggi</option>
              <option value="price-asc">Harga: Rendah ke Tinggi</option>
              <option value="price-desc">Harga: Tinggi ke Rendah</option>
              <option value="newest">Terkini</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {displayedBooks.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Tiada Naskhah Ditemui</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {activeCategory === 'koleksi'
              ? 'Anda belum memiliki sebarang e-buku lagi. Sila terokai katalog kami atau dapatkan naskhah percuma untuk mula membaca.'
              : `Tiada buku yang sepadan dengan carian "${searchQuery}" atau tapisan genre yang dipilih.`}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => {
                onCategoryChange('semua');
                setSelectedGenre('semua');
              }}
              className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500 transition-colors"
            >
              Lihat Semua Katalog
            </button>
          </div>
        </div>
      )}

      {/* When Viewing 'Semua' and no specific genre is selected: Display Distinct Segregated Categories */}
      {activeCategory === 'semua' && selectedGenre === 'semua' && searchQuery === '' ? (
        <div className="space-y-14">
          {/* Section 1: Novel Teks Tempatan */}
          <section className="space-y-5">
            <div className="flex items-end justify-between border-b border-amber-200/80 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  Kategori Utama
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  📖 Novel Teks Tempatan
                </h3>
                <p className="text-xs text-slate-500">
                  Koleksi karya thriller, cinta, sejarah, dan fantasi dari sasterawan serta penulis
                  berbakat Malaysia.
                </p>
              </div>

              <button
                onClick={() => onCategoryChange('novel')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                Lihat Semua Novel ({novelList.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {novelList.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isOwned={ownedBookIds.includes(book.id)}
                  isInCart={cartBookIds.includes(book.id)}
                  onRead={onRead}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </section>

          {/* Section 2: Komik & Novel Grafik Tempatan */}
          <section className="space-y-5">
            <div className="flex items-end justify-between border-b border-indigo-200/80 pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  Karya Visual
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  💥 Komik & Novel Grafik Tempatan
                </h3>
                <p className="text-xs text-slate-500">
                  Himpunan komik lawak sekolah, siri aksi pendekar cyberpunk, dan kartun nostalgia
                  berwarna-warni.
                </p>
              </div>

              <button
                onClick={() => onCategoryChange('komik')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                Lihat Semua Komik ({komikList.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {komikList.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isOwned={ownedBookIds.includes(book.id)}
                  isInCart={cartBookIds.includes(book.id)}
                  onRead={onRead}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* Uniform Grid for Filtered / Tabbed View */
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isOwned={ownedBookIds.includes(book.id)}
              isInCart={cartBookIds.includes(book.id)}
              onRead={onRead}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};
