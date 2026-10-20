import React from 'react';
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
  const [imgError, setImgError] = React.useState(false);

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(book);
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden h-full">
      {/* Cover Image */}
      <div
        onClick={handleCardClick}
        className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900 cursor-pointer group"
      >
        {book.coverImage && !imgError ? (
          <img
            src={book.coverImage}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${book.coverGradient} flex flex-col items-center justify-center p-3 text-white text-center`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1">{book.genre}</span>
            <span className="font-bold text-xs sm:text-sm line-clamp-2">{book.title}</span>
          </div>
        )}

        {/* Owned Status Badge */}
        {isOwned && (
          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Dimiliki</span>
          </div>
        )}

        {/* Quick View Info Icon on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onViewDetails) onViewDetails(book);
          }}
          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          title="Lihat Butiran Penuh"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Card Content: Title, Author, Price, Buttons */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="space-y-1">
          {/* Title */}
          <h3
            onClick={handleCardClick}
            className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-1 hover:text-indigo-600 transition-colors cursor-pointer"
            title={book.title}
          >
            {book.title}
          </h3>

          {/* Author */}
          <p className="text-[11px] text-slate-500 font-medium truncate">
            {book.author}
          </p>
        </div>

        {/* Price & Action Buttons */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {/* Price display in RM */}
          <div className="flex items-baseline justify-between">
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              {book.isFree ? 'Percuma' : formatMYR(book.price)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {book.category === 'komik' ? 'Komik' : 'ePub'}
            </span>
          </div>

          {/* Action Buttons: Baca Sampel & Beli */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onRead(book)}
              className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 text-center"
              aria-label={`Baca sampel ${book.title}`}
            >
              <BookOpen className="w-3 h-3 text-indigo-600 shrink-0 hidden xs:inline" />
              <span>{isOwned ? 'Buka' : 'Sampel'}</span>
            </button>

            {isOwned ? (
              <button
                onClick={() => onRead(book)}
                className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer text-center"
              >
                <span>Baca</span>
              </button>
            ) : book.isFree ? (
              <button
                onClick={() => onAddToCart(book)}
                className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer text-center"
              >
                <span>Dapatkan</span>
              </button>
            ) : (
              <button
                onClick={() => onAddToCart(book)}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 text-center ${
                  isInCart
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
                aria-label={`Beli ${book.title}`}
              >
                <ShoppingCart className="w-3 h-3 shrink-0 hidden xs:inline" />
                <span>{isInCart ? 'Ada' : 'Beli'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
