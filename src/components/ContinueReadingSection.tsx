import React from 'react';
import { BookOpen, ArrowRight, Library, CheckCircle2 } from 'lucide-react';
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

  // Show up to 3 most recently acquired/opened books
  const booksToDisplay = ownedBooks.slice(0, 3);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm border border-slate-800">
        <div className="flex items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                Sambung Membaca
              </h2>
              <p className="text-[11px] text-slate-300">
                Akses pantas naskhah dalam rak perpustakaan anda.
              </p>
            </div>
          </div>

          <button
            onClick={onViewShelf}
            className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <Library className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Semua Naskhah ({ownedBooks.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {booksToDisplay.map((book) => {
            const isComic = book.category === 'komik';
            const progress = 45; // Deterministic reading progress state for shelf

            return (
              <div
                key={book.id}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center gap-3 transition-colors group"
              >
                {/* Book Thumbnail */}
                <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-800 shadow-xs relative">
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${book.coverGradient} flex items-center justify-center p-1 text-center text-[9px] font-bold text-white`}>
                      {book.title}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                      {isComic ? 'Komik' : 'Novel'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Dimiliki
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-white truncate group-hover:text-amber-300 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">Oleh {book.author}</p>

                  {/* Progress Bar & Button */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <button
                      onClick={() => onRead(book)}
                      className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] shrink-0 transition-transform active:scale-95 cursor-pointer shadow-2xs"
                    >
                      Buka
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
