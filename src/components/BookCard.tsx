import React, { useState } from 'react';
import { Check, Info, BookOpen } from 'lucide-react';
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
      {/* Cover Image Container: Strict 2:3 aspect ratio */}
      <div
        onClick={handleCardClick}
        className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900 cursor-pointer"
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

        {/* PDF Format Tag */}
        {book.pdfUrl && (
          <div className="absolute top-2 left-2 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-2xs z-10">
            PDF
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
        <div className="space-y-1">
          {/* Book Title: Limited to 2 lines with consistent min-height */}
          <h3
            onClick={handleCardClick}
            className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.5rem] hover:text-indigo-600 transition-colors cursor-pointer"
            title={book.title}
          >
            {book.title}
          </h3>

          {/* Author Name: Enlarged text with enhanced contrast */}
          <p className="text-xs text-slate-700 font-medium truncate" title={book.author}>
            {book.author}
          </p>
        </div>

        {/* Bottom Section: Aligned price and Sampel/Beli buttons */}
        <div className="mt-auto pt-2 border-t border-slate-100 space-y-2">
          {/* Price: Highlighted in purple */}
          <div className="text-sm sm:text-base font-extrabold text-indigo-600">
            {book.isFree ? 'Percuma' : formatMYR(book.price)}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            {isOwned ? (
              <>
                {/* Buku Dimiliki - Butang 1: "Butiran" */}
                <button
                  onClick={handleCardClick}
                  className="min-h-[36px] py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center text-center active:scale-95 border border-slate-200"
                  aria-label={`Lihat butiran ${book.title}`}
                >
                  <Info className="w-3 h-3 text-slate-500 mr-1 hidden xs:inline" />
                  <span>Butiran</span>
                </button>

                {/* Buku Dimiliki - Butang 2: "Baca Sekarang" */}
                <button
                  onClick={() => onRead(book)}
                  className="min-h-[36px] py-1.5 px-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center text-center active:scale-95"
                  aria-label={`Baca sekarang ${book.title}`}
                >
                  <BookOpen className="w-3 h-3 mr-1 hidden xs:inline" />
                  <span>Baca Sekarang</span>
                </button>
              </>
            ) : (
              <>
                {/* Buku Belum Dimiliki - Butang 1: "Sampel" */}
                <button
                  onClick={() => onRead(book)}
                  className="min-h-[36px] py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center text-center active:scale-95 border border-slate-200"
                  aria-label={`Baca sampel ${book.title}`}
                >
                  <span>Sampel</span>
                </button>

                {/* Buku Belum Dimiliki - Butang 2: "Beli" / "Dapatkan" */}
                {book.isFree ? (
                  <button
                    onClick={() => onAddToCart(book)}
                    className="min-h-[36px] py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center text-center active:scale-95"
                  >
                    <span>Dapatkan</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onAddToCart(book)}
                    className={`min-h-[36px] py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center text-center active:scale-95 ${
                      isInCart
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                    aria-label={`Beli ${book.title}`}
                  >
                    <span>{isInCart ? 'Dalam Bakul' : 'Beli'}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
