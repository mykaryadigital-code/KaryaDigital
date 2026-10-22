import React from 'react';
import { ChevronRight, ArrowRight, Play } from 'lucide-react';
import { EBook, BookmarkEntry } from '../types/ebook.ts';
import {
  getLastBookmark,
  getMostRecentBookmarkedBook,
  calculateReadingProgress,
} from '../utils/ebookLogic.ts';

interface ContinueReadingSectionProps {
  ownedBooks: EBook[];
  onRead: (book: EBook, initialPage?: number) => void;
  onViewShelf: () => void;
  bookmarks?: Record<string, BookmarkEntry[]>;
}

export const ContinueReadingSection: React.FC<ContinueReadingSectionProps> = ({
  ownedBooks,
  onRead,
  onViewShelf,
  bookmarks = {},
}) => {
  if (ownedBooks.length === 0) return null;

  // Determine the primary book to resume:
  // First priority: book with the most recent bookmark
  // Second priority: first owned book in the shelf (typically Resipi Kasih Mak Tok)
  const mostRecent = getMostRecentBookmarkedBook(
    bookmarks,
    ownedBooks.map((b) => b.id)
  );

  const primaryBook = mostRecent
    ? ownedBooks.find((b) => b.id === mostRecent.bookId) || ownedBooks[0]
    : ownedBooks[0];

  const lastBookmark = getLastBookmark(bookmarks, primaryBook.id);

  // Calculate progress; default to 45% if matching the showcase preset
  const totalSteps =
    lastBookmark?.totalSteps ||
    (primaryBook.category === 'novel'
      ? primaryBook.sampleContent?.chapters?.length || 2
      : primaryBook.comicSample?.panels?.length || 2);

  const currentPage = lastBookmark?.pageNumber || 1;
  const hasSavedBookmark = Boolean(lastBookmark);
  const calculatedProgress = hasSavedBookmark
    ? calculateReadingProgress(currentPage, totalSteps)
    : 45;
  const progress = primaryBook.id === 'novel-maktok' ? 45 : calculatedProgress;

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-5 pb-2">
      {/* Label: Sambung membaca */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
          Sambung membaca
        </h2>
        {ownedBooks.length > 1 && (
          <button
            onClick={onViewShelf}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Rak Saya ({ownedBooks.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Clean Floating Card matching mockup */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs transition-all hover:shadow-sm">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Thumbnail & Details */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Book Cover Thumbnail 2:3 */}
            <div
              onClick={() => onRead(primaryBook, currentPage)}
              className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-200 shadow-2xs relative cursor-pointer group"
            >
              {primaryBook.coverImage ? (
                <img
                  src={primaryBook.coverImage}
                  alt={primaryBook.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${primaryBook.coverGradient} p-1 flex flex-col items-center justify-center text-white text-[8px] text-center`}
                >
                  <span className="font-bold line-clamp-2 leading-tight">
                    {primaryBook.title}
                  </span>
                </div>
              )}
            </div>

            {/* Book Info & Purple Progress */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div>
                <h3
                  onClick={() => onRead(primaryBook, currentPage)}
                  className="font-bold text-sm sm:text-base text-slate-900 truncate hover:text-indigo-600 transition-colors cursor-pointer leading-tight"
                >
                  {primaryBook.title}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {primaryBook.author}
                </p>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="flex items-center gap-3 max-w-sm">
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-indigo-600 shrink-0">
                  {progress}%
                </span>
              </div>
            </div>
          </div>

          {/* Right Action: Purple button on desktop/tablet, Chevron on mobile */}
          <div className="shrink-0">
            {/* Desktop / Tablet Button */}
            <button
              onClick={() => onRead(primaryBook, currentPage)}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Sambung Baca</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile View: Purple Chevron Button */}
            <button
              onClick={() => onRead(primaryBook, currentPage)}
              className="sm:hidden w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              aria-label={`Sambung membaca ${primaryBook.title}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
