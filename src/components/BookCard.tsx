import React, { useState } from 'react';
import { Check } from 'lucide-react';
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
    <div className="flex flex-col bg-white rounded-xl border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden h-full group">
      {/* Cover Image Container */}
      <div
        onClick={handleCardClick}
        className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900 cursor-pointer"
      >
        {hasRealCover ? (
          <img
            src={book.coverImage}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${book.coverGradient} flex flex-col justify-between p-3.5 text-white text-center select-none`}
          >
            <div className="text-[9px] font-bold uppercase tracking-widest text-amber-400">
              {book.category === 'komik' ? 'KOMIK' : 'NOVEL'}
            </div>
            <div className="space-y-1 my-auto">
              <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-3 leading-snug">
                {book.title}
              </h4>
            </div>
            <div className="text-[10px] font-medium text-slate-300 truncate border-t border-white/10 pt-1">
              {book.author}
            </div>
          </div>
        )}

        {/* Owned Status Badge */}
        {isOwned && (
          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1 z-10">
            <Check className="w-3 h-3" />
            <span>Dimiliki</span>
          </div>
        )}
      </div>

      {/* Book Card Body */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Book Title */}
          <h3
            onClick={handleCardClick}
            className="font-bold text-slate-900 text-xs sm:text-sm leading-tight line-clamp-1 hover:text-indigo-600 transition-colors cursor-pointer"
            title={book.title}
          >
            {book.title}
          </h3>

          {/* Author Name */}
          <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5" title={book.author}>
            {book.author}
          </p>
        </div>

        {/* Bottom Section: Purple Price & Action Buttons */}
        <div className="mt-auto pt-1 space-y-2">
          {/* Price: Highlighted in purple matching showcase mockup */}
          <div className="text-sm font-bold text-indigo-600">
            {book.isFree ? 'Percuma' : formatMYR(book.price)}
          </div>

          {/* Action Buttons: [Sampel] (Grey) and [Beli] (Purple) */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Sampel Button */}
            <button
              onClick={() => onRead(book)}
              className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer text-center"
              aria-label={`Baca sampel ${book.title}`}
            >
              <span>{isOwned ? 'Buka' : 'Sampel'}</span>
            </button>

            {/* Beli / Baca Button */}
            {isOwned ? (
              <button
                onClick={() => onRead(book)}
                className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                <span>Baca</span>
              </button>
            ) : book.isFree ? (
              <button
                onClick={() => onAddToCart(book)}
                className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                <span>Dapatkan</span>
              </button>
            ) : (
              <button
                onClick={() => onAddToCart(book)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center ${
                  isInCart
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                aria-label={`Beli ${book.title}`}
              >
                <span>{isInCart ? 'Dalam Bakul' : 'Beli'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
