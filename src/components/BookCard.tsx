import React, { useState } from 'react';
import { BookOpen, ShoppingCart, Check, Info } from 'lucide-react';
import { EBook } from '../types/ebook.ts';
import { formatMYR } from '../utils/ebookLogic.ts';

interface BookCardProps {
  book: EBook;
  isOwned: boolean;
  isInCart: boolean;
  onRead: (book: EBook) => void;
  onAddToCart: (book: EBook) => void;
  onViewDetails?: (book: EBook) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  isOwned,
  isInCart,
  onRead,
  onAddToCart,
  onViewDetails,
}) => {
  const [imgError, setImgError] = useState(false);

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(book);
    }
  };

  const hasRealCover = Boolean(book.coverImage && !imgError);

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-sm transition-all duration-150 overflow-hidden h-full">
      {/* Cover Image: Nisbah 2:3 Konsisten */}
      <div
        onClick={handleCardClick}
        className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900 cursor-pointer group"
      >
        {hasRealCover ? (
          <img
            src={book.coverImage}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          /* Satu Reka Bentuk Placeholder Konsisten (Hardcover Tempatan) */
          <div className="w-full h-full bg-slate-900 border-l-4 border-amber-500/50 flex flex-col justify-between p-3.5 text-white text-center select-none">
            {/* Tag Jenis Buku (Aksen Kuning Kecil) */}
            <div className="text-[9px] font-bold uppercase tracking-widest text-amber-400">
              {book.category === 'komik' ? 'KOMIK GRAFIK' : 'NOVEL TEKS'}
            </div>

            {/* Tajuk Buku Berpusat */}
            <div className="space-y-1 my-auto">
              <h4 className="font-serif-book font-bold text-xs sm:text-sm text-white line-clamp-3 leading-snug">
                {book.title}
              </h4>
              <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                {book.genre}
              </p>
            </div>

            {/* Nama Penulis di Bawah */}
            <div className="text-[10px] font-medium text-slate-300 truncate border-t border-white/10 pt-1.5">
              {book.author}
            </div>
          </div>
        )}

        {/* Owned Status Badge */}
        {isOwned && (
          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Dimiliki</span>
          </div>
        )}

        {/* Quick View Info Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onViewDetails) onViewDetails(book);
          }}
          className="absolute bottom-2 right-2 p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          title="Lihat Butiran Penuh"
          aria-label={`Butiran ${book.title}`}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Card Body: Tajuk 2 Baris Tetap, Penulis 1 Baris, Harga Jelas, Butang Sejajar */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          {/* Tajuk: Maksimum 2 baris dengan ruang tetap */}
          <h3
            onClick={handleCardClick}
            className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.5rem] hover:text-indigo-600 transition-colors cursor-pointer"
            title={book.title}
          >
            {book.title}
          </h3>

          {/* Penulis: 1 baris */}
          <p className="text-[11px] text-slate-500 font-medium truncate" title={book.author}>
            {book.author}
          </p>
        </div>

        {/* Bahagian Bawah: Harga & Butang Sejajar (mt-auto) */}
        <div className="mt-auto pt-2 border-t border-slate-100 space-y-2">
          {/* Harga Jelas */}
          <div className="flex items-baseline justify-between">
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {book.isFree ? 'Percuma' : formatMYR(book.price)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {book.category === 'komik' ? 'Komik' : 'ePub'}
            </span>
          </div>

          {/* Butang Sampel dan Beli Sejajar: Ungu Warna Utama */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onRead(book)}
              className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 text-center border border-slate-200"
              aria-label={`Baca sampel ${book.title}`}
            >
              <BookOpen className="w-3 h-3 text-indigo-600 shrink-0 hidden xs:inline" />
              <span>{isOwned ? 'Buka' : 'Sampel'}</span>
            </button>

            {isOwned ? (
              <button
                onClick={() => onRead(book)}
                className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer text-center"
              >
                <span>Baca</span>
              </button>
            ) : book.isFree ? (
              <button
                onClick={() => onAddToCart(book)}
                className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer text-center"
              >
                <span>Dapatkan</span>
              </button>
            ) : (
              <button
                onClick={() => onAddToCart(book)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 text-center ${
                  isInCart
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                aria-label={`Beli ${book.title}`}
              >
                <ShoppingCart className="w-3 h-3 shrink-0 hidden xs:inline" />
                <span>{isInCart ? 'Dalam Bakul' : 'Beli'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
