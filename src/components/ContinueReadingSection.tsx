import React from 'react';
import { ChevronRight, ArrowRight, Play, BookOpen } from 'lucide-react';
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

  // Determine the primary book to resume
  const mostRecent = getMostRecentBookmarkedBook(
    bookmarks,
    ownedBooks.map((b) => b.id)
  );

  const primaryBook = mostRecent
    ? ownedBooks.find((b) => b.id === mostRecent.bookId) || ownedBooks[0]
    : ownedBooks[0];

  const lastBookmark = getLastBookmark(bookmarks, primaryBook.id);

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
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-3 pb-1">
      {/* Label: Sambung membaca */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
            Sambung Membaca
          </h2>
        </div>
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

      {/* Lebar Penuh Kad Sambung Membaca Sejajar dengan Katalog */}
      <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-3 sm:px-5 sm:py-3 shadow-xs hover:shadow-sm transition-all">
        {/* DESKTOP LAYOUT (>= 768px): Susun cover, tajuk, bar kemajuan dan butang dalam SATU BARIS */}
        <div className="hidden md:flex items-center justify-between gap-6 w-full">
          {/* 1. Cover Thumbnail (Nisbah 2:3) */}
          <div
            onClick={() => onRead(primaryBook, currentPage)}
            className="w-10 h-15 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-200 shadow-2xs cursor-pointer group aspect-[2/3]"
          >
            {primaryBook.coverImage ? (
              <img
                src={primaryBook.coverImage}
                alt={primaryBook.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${primaryBook.coverGradient} p-1 flex items-center justify-center text-white text-[7px] text-center font-bold`}
              >
                {primaryBook.title}
              </div>
            )}
          </div>

          {/* 2. Tajuk & Penulis */}
          <div className="min-w-0 max-w-xs lg:max-w-sm space-y-0.5">
            <h3
              onClick={() => onRead(primaryBook, currentPage)}
              className="font-bold text-sm text-slate-900 truncate hover:text-indigo-600 transition-colors cursor-pointer leading-tight"
              title={primaryBook.title}
            >
              {primaryBook.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate" title={primaryBook.author}>
              {primaryBook.author}
              {lastBookmark?.chapterTitle && (
                <span className="text-indigo-600 ml-1">· {lastBookmark.chapterTitle}</span>
              )}
            </p>
          </div>

          {/* 3. Bar Kemajuan & Peratusan Sebaris di Tengah */}
          <div className="flex-1 max-w-sm lg:max-w-md flex items-center gap-3">
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

          {/* 4. Butang Sambung Baca Sebaris di Kanan */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => onRead(primaryBook, currentPage)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Sambung Baca</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* MOBILE LAYOUT (< 768px): Susunan kemas dan responsif */}
        <div className="md:hidden space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            {/* Thumbnail + Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                onClick={() => onRead(primaryBook, currentPage)}
                className="w-10 h-15 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-200 shadow-2xs aspect-[2/3] cursor-pointer"
              >
                {primaryBook.coverImage ? (
                  <img
                    src={primaryBook.coverImage}
                    alt={primaryBook.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${primaryBook.coverGradient} p-1 flex items-center justify-center text-white text-[7px] text-center font-bold`}
                  >
                    {primaryBook.title}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <h3
                  onClick={() => onRead(primaryBook, currentPage)}
                  className="font-bold text-xs sm:text-sm text-slate-900 truncate hover:text-indigo-600 transition-colors cursor-pointer leading-tight"
                >
                  {primaryBook.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  {primaryBook.author}
                </p>
              </div>
            </div>

            {/* Mobile Action Button */}
            <button
              onClick={() => onRead(primaryBook, currentPage)}
              className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
              aria-label={`Sambung membaca ${primaryBook.title}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Progress Bar Row */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-indigo-600 shrink-0">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
