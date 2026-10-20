import React from 'react';
import { BookOpen, ArrowRight, Library } from 'lucide-react';
import { EBook } from '../types/ebook.ts';

interface ContinueReadingSectionProps {
  ownedBooks: EBook[];
  onRead: (book: EBook) => void;
  onViewShelf: () => void;
}

export const ContinueReadingSection: React.FC<ContinueReadingSectionProps> = ({
  ownedBooks,
  onRead,
  onViewShelf,
}) => {
  if (ownedBooks.length === 0) return null;

  // Most recent owned book to continue reading
  const primaryBook = ownedBooks[0];
  const progress = 45; // Deterministic reading progress state

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-5 pb-1">
      {/* Kad Mendatar Ringkas Berlatar Cerah Mengikut Saiz Kandungan */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
        {/* Left: Indicator & Book Details */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Book Cover Thumbnail 2:3 */}
          <div className="w-10 h-15 rounded-md overflow-hidden shrink-0 bg-slate-900 border border-slate-200 shadow-2xs relative flex items-center justify-center text-center">
            {primaryBook.coverImage ? (
              <img
                src={primaryBook.coverImage}
                alt={primaryBook.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 p-1 flex flex-col items-center justify-center text-white">
                <span className="text-[8px] font-bold uppercase tracking-wider text-amber-400">
                  {primaryBook.category === 'komik' ? 'Komik' : 'Novel'}
                </span>
                <span className="text-[8px] font-bold line-clamp-1 leading-tight text-slate-200">
                  {primaryBook.title}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Sambung Membaca
              </span>
              <span className="text-[10px] text-slate-400">·</span>
              <span className="text-[10px] text-slate-500 font-medium">
                {progress}% selesai
              </span>
            </div>

            <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
              {primaryBook.title}
            </h3>
            <p className="text-[11px] text-slate-500 truncate">
              Oleh {primaryBook.author}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => onRead(primaryBook)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Buka & Baca
          </button>

          {ownedBooks.length > 1 && (
            <button
              onClick={onViewShelf}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 px-2 py-1.5 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Library className="w-3.5 h-3.5 text-slate-400" />
              <span>Semua Rak ({ownedBooks.length})</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
