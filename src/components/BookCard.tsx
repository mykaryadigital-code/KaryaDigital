import React from 'react';
import { Star, BookOpen, ShoppingCart, Check, Flame, Lock } from 'lucide-react';
import { EBook } from '../types/ebook.ts';
import { formatMYR } from '../utils/ebookLogic.ts';

interface BookCardProps {
  book: EBook;
  isOwned: boolean;
  isInCart: boolean;
  onRead: (book: EBook) => void;
  onAddToCart: (book: EBook) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  isOwned,
  isInCart,
  onRead,
  onAddToCart,
}) => {
  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-400/80 shadow-xs hover:shadow-xl transition-all duration-200 overflow-hidden">
      {/* Visual Book Cover Presentation */}
      <div className="relative pt-[125%] w-full overflow-hidden bg-slate-900">
        {/* Cover Image or Gradient Art */}
        {book.coverImage && (
          <img
            src={book.coverImage}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}

        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            book.coverImage
              ? 'from-slate-950/80 via-slate-900/60 to-slate-950/90'
              : book.coverGradient
          } p-4 sm:p-5 flex flex-col justify-between text-white transition-transform duration-300 group-hover:scale-102`}
        >
          {/* Subtle Book Spine Overlay on the left */}
          <div className="absolute top-0 left-0 bottom-0 w-3 bg-black/30 backdrop-blur-xs border-r border-white/10"></div>

          {/* Top Cover Badges */}
          <div className="relative z-10 flex items-start justify-between gap-1 pl-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md shadow-xs ${
                book.category === 'komik'
                  ? 'bg-indigo-500/90 text-white font-black'
                  : book.category === 'seram'
                  ? 'bg-rose-600/90 text-white font-black'
                  : book.category === 'agama'
                  ? 'bg-emerald-600/90 text-white font-black'
                  : 'bg-amber-400/90 text-slate-950 font-black'
              }`}
            >
              {book.category === 'novel'
                ? '📖 ePub'
                : book.category === 'komik'
                ? '💥 Komik'
                : book.category === 'seram'
                ? '👻 Seram'
                : '🕌 Motivasi'}
            </span>

            {book.coverBadge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-md">
                {book.coverBadge}
              </span>
            )}
          </div>

          {/* Central Cover Typography */}
          <div className="relative z-10 my-auto text-center px-3 pl-5 space-y-1">
            <div className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">
              {book.genre}
            </div>
            <h3
              className={`font-black tracking-tight text-white drop-shadow-md line-clamp-2 ${
                book.category === 'novel' || book.category === 'seram' || book.category === 'agama'
                  ? 'font-serif-book text-lg sm:text-xl'
                  : 'text-xl sm:text-2xl font-black uppercase tracking-wide'
              }`}
            >
              {book.title}
            </h3>
            <div className="text-xs text-slate-200/90 font-medium tracking-wide">
              oleh {book.author}
            </div>
          </div>

          {/* Bottom Cover Footer with Publisher / Format */}
          <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-300/80 pt-2 border-t border-white/15 pl-2">
            <span className="truncate max-w-[120px]">{book.publisher}</span>
            <span>{book.pages} m/s</span>
          </div>
        </div>

        {/* Status Overlay if Owned */}
        {isOwned && (
          <div className="absolute top-3 right-3 z-20 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>Dimiliki</span>
          </div>
        )}
      </div>

      {/* Card Content & Details */}
      <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Metadata Row: Rating & Read Time (Clean, unboxed as per frontend guidelines) */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{book.rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({book.reviewsCount})</span>
            </div>
            <span className="text-[11px] text-slate-500">{book.readTime}</span>
          </div>

          {/* Book Title */}
          <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {book.title}
          </h4>

          {/* Author Name */}
          <p className="text-xs text-slate-600 font-medium">Oleh {book.author}</p>

          {/* Short Synopsis Excerpt */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1">
            {book.synopsis}
          </p>
        </div>

        {/* Pricing & Action Buttons */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          {/* Price display in RM and Syiling */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-slate-900">
                {formatMYR(book.price)}
              </span>
              {book.price > 0 && (
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  🪙 {Math.round(book.price * 10)} Syiling
                </span>
              )}
              {book.originalPrice && book.originalPrice > book.price && (
                <span className="text-xs text-slate-400 line-through">
                  RM {book.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {book.isFree && (
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Akses Percuma
              </span>
            )}
          </div>

          {/* Action Buttons: 'Baca' & 'Beli / Tambah' */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onRead(book)}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              aria-label={`Baca sampel buku ${book.title}`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isOwned ? 'Baca Penuh' : 'Baca Sampel'}</span>
            </button>

            {isOwned ? (
              <button
                onClick={() => onRead(book)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Buka Buku</span>
              </button>
            ) : book.isFree ? (
              <button
                onClick={() => onAddToCart(book)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Dapatkan</span>
              </button>
            ) : (
              <button
                onClick={() => onAddToCart(book)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isInCart
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
                aria-label={
                  isInCart ? `${book.title} ada dalam bakul` : `Tambah ${book.title} ke bakul`
                }
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{isInCart ? 'Dalam Bakul' : 'Beli'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
