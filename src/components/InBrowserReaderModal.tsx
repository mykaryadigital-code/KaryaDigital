import React, { useState, useEffect } from 'react';
import {
  X,
  Moon,
  Sun,
  Type,
  BookMarked,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  ShoppingCart,
  Sparkles,
  Trash2,
  ListOrdered,
  BookmarkCheck,
  ArrowRight,
} from 'lucide-react';
import { EBook, ReaderSettings, BookmarkEntry } from '../types/ebook.ts';
import { calculateReadingProgress, formatMYR } from '../utils/ebookLogic.ts';

interface InBrowserReaderModalProps {
  book: EBook | null;
  isOpen: boolean;
  onClose: () => void;
  isOwned: boolean;
  onAddToCart: (book: EBook) => void;
  onTriggerSecurityWarning: (message: string, type: 'warning' | 'shield' | 'info') => void;
  buyerEmail?: string;
  initialPageNumber?: number;
  bookmarks?: BookmarkEntry[];
  onToggleBookmark?: (bookmark: BookmarkEntry) => void;
  onRemoveBookmark?: (pageNumber: number) => void;
}

export const InBrowserReaderModal: React.FC<InBrowserReaderModalProps> = ({
  book,
  isOpen,
  onClose,
  isOwned,
  onAddToCart,
  onTriggerSecurityWarning,
  buyerEmail = 'mykaryadigital@gmail.com - ID: 88392',
  initialPageNumber,
  bookmarks = [],
  onToggleBookmark,
  onRemoveBookmark,
}) => {
  // Reader Settings State (Hooks must run unconditionally)
  const [settings, setSettings] = useState<ReaderSettings>({
    fontSize: 'base',
    theme: 'light',
    fontFamily: 'serif',
    lineSpacing: 'relaxed',
  });

  // Comic Scroll Mode: 'vertical' (Webtoon) vs 'horizontal' (Page-by-page)
  const [comicMode, setComicMode] = useState<'vertical' | 'horizontal'>('vertical');

  // Current Chapter for Text Novel
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  // Current Panel/Page for Comic
  const [currentComicPageIndex, setCurrentComicPageIndex] = useState(0);

  // Comic Zoom Level
  const [comicZoom, setComicZoom] = useState(1);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State for consolidated "Aa" settings menu
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // State for bookmarks dropdown popover
  const [showBookmarksList, setShowBookmarksList] = useState(false);
  // Reader format: 'pdf' if book has pdfUrl, otherwise 'standard'
  const [readerFormat, setReaderFormat] = useState<'pdf' | 'standard'>('standard');

  // Set initial page from bookmark or parameter
  useEffect(() => {
    if (!book || !isOpen) return;
    const targetPage = initialPageNumber && initialPageNumber >= 1 ? initialPageNumber - 1 : 0;
    if (book.category === 'novel') {
      const maxChap = Math.max(0, (book.sampleContent?.chapters?.length || 1) - 1);
      setCurrentChapterIndex(Math.min(targetPage, maxChap));
    } else {
      const maxPanel = Math.max(0, (book.comicSample?.panels?.length || 1) - 1);
      setCurrentComicPageIndex(Math.min(targetPage, maxPanel));
    }
    if (book.pdfUrl) {
      setReaderFormat('pdf');
    } else {
      setReaderFormat('standard');
    }
    setComicZoom(1);
    setShowBookmarksList(false);
    setShowSettingsMenu(false);
  }, [book?.id, book?.pdfUrl, isOpen, initialPageNumber]);

  // Security Event Listeners (Sekat right click, copy, and shortcuts)
  useEffect(() => {
    if (!isOpen || !book) return;
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onTriggerSecurityWarning(
        '⚠️ Perlindungan Hak Cipta: Klik kanan disekat bagi melindungi harta intelek penulis tempatan.',
        'shield'
      );
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      onTriggerSecurityWarning(
        '🔒 Kandungan Dilindungi: Salinan teks digital disekat untuk mengelakkan cetak rompak.',
        'warning'
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Sekat Ctrl+C, Ctrl+P, Ctrl+U, Ctrl+S, F12
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (isCtrlOrMeta && ['c', 'u', 'p', 's'].includes(key)) {
        e.preventDefault();
        let action = 'Pintasan papan kekunci';
        if (key === 'c') action = 'Menyalin teks (Ctrl+C)';
        if (key === 'p') action = 'Mencetak naskhah (Ctrl+P)';
        if (key === 'u') action = 'Melihat kod sumber (Ctrl+U)';
        if (key === 's') action = 'Menyimpan naskhah (Ctrl+S)';
        onTriggerSecurityWarning(
          `🛡️ Sekatan Keselamatan: Tindakan ${action} disekat pada pembaca e-buku.`,
          'shield'
        );
      } else if (e.key === 'F12') {
        e.preventDefault();
        onTriggerSecurityWarning(
          '🛡️ Keselamatan Digital: Panel pembangun disekat pada halaman pembaca rasmi.',
          'warning'
        );
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [onTriggerSecurityWarning, onClose]);

  // Themes Configuration
  const themeClasses = {
    light: 'bg-white text-slate-800 border-slate-200',
    sepia: 'bg-[#faf6ee] text-[#433422] border-[#e8dfcf]',
    dark: 'bg-slate-950 text-slate-200 border-slate-800',
  };

  const themeHeaderClasses = {
    light: 'bg-white/95 border-b border-slate-200 text-slate-800',
    sepia: 'bg-[#f4efe4]/95 border-b border-[#e2d8c3] text-[#433422]',
    dark: 'bg-slate-900/95 border-b border-slate-800 text-slate-100',
  };

  // Font Size Map
  const fontSizeClasses = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
    xl: 'text-xl leading-loose',
    '2xl': 'text-2xl leading-loose',
  };

  // Font Family Map
  const fontFamilyClasses = {
    serif: 'font-serif-book',
    sans: 'font-sans',
    mono: 'font-mono-code',
  };

  if (!isOpen || !book) return null;

  const isNovel = book.category === 'novel';
  const chapters = book.sampleContent?.chapters || [];
  const currentChapter = chapters[currentChapterIndex] || null;

  const comicPanels = book.comicSample?.panels || [];
  const currentComicPanel = comicPanels[currentComicPageIndex] || null;

  // Calculate Reading Progress
  const totalSteps = isNovel ? chapters.length : comicPanels.length;
  const currentStep = isNovel ? currentChapterIndex + 1 : currentComicPageIndex + 1;
  const progressPercent = calculateReadingProgress(currentStep, totalSteps);

  const isCurrentPageBookmarked = Boolean(
    bookmarks.some((b) => b.pageNumber === currentStep)
  );

  const handleToggleCurrentBookmark = () => {
    if (!book) return;
    const chapterTitle = isNovel
      ? currentChapter?.title || `Bab ${currentStep}`
      : currentComicPanel?.title || `Halaman ${currentStep}`;
    const excerpt = isNovel
      ? currentChapter?.paragraphs?.[0]?.slice(0, 110) || ''
      : currentComicPanel?.sceneDescription?.slice(0, 110) || '';

    const entry: BookmarkEntry = {
      id: `${book.id}-p${currentStep}`,
      bookId: book.id,
      pageNumber: currentStep,
      totalSteps,
      chapterIndex: isNovel ? currentChapterIndex : undefined,
      chapterTitle,
      excerpt,
      savedAt: new Date().toISOString(),
    };

    if (onToggleBookmark) {
      onToggleBookmark(entry);
    }

    if (isCurrentPageBookmarked) {
      onTriggerSecurityWarning(
        `Penanda buku untuk Halaman ${currentStep} (${chapterTitle}) telah dipadam.`,
        'info'
      );
    } else {
      onTriggerSecurityWarning(
        `📌 Halaman ${currentStep} (${chapterTitle}) berjaya ditanda dalam profil anda!`,
        'info'
      );
    }
  };

  // Theme Toggle Helper
  const themes = [
    { id: 'light', label: 'Cerah', icon: Sun },
    { id: 'sepia', label: 'Sepia', icon: Sun },
    { id: 'dark', label: 'Gelap', icon: Moon },
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex flex-col bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Pembaca dalam talian untuk ${book.title}`}
    >
      {/* Outer Reader Container */}
      <div
        className={`flex-1 flex flex-col w-full h-full max-w-5xl mx-auto shadow-2xl transition-colors duration-200 overflow-hidden ${
          isFullscreen ? 'max-w-none' : 'my-0 sm:my-3 sm:rounded-2xl border'
        } ${themeClasses[settings.theme]}`}
      >
        {/* Top Header & Reading Controls */}
        <header
          className={`flex items-center justify-between px-3 sm:px-4 py-2.5 shrink-0 backdrop-blur-md z-30 border-b border-current/10 relative ${
            themeHeaderClasses[settings.theme]
          }`}
        >
          {/* Left: Close button & Book title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
              aria-label="Tutup pembaca e-buku"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs">
                {book.title}
              </h3>
              <p className="text-[10px] opacity-70 truncate">
                {isNovel ? `Bahagian ${currentStep} / ${totalSteps}` : `Halaman ${currentStep} / ${totalSteps}`}
              </p>
            </div>
          </div>

          {/* Right: Consolidated "Aa" Menu, Comic Mode, Bookmark, Fullscreen */}
          <div className="flex items-center gap-1.5 relative">
            {/* Format Switcher (if book has PDF) */}
            {book.pdfUrl && (
              <button
                type="button"
                onClick={() => setReaderFormat((prev) => (prev === 'pdf' ? 'standard' : 'pdf'))}
                className="px-2 py-1 rounded-md text-[11px] font-bold bg-rose-600/90 hover:bg-rose-600 text-white shadow-2xs flex items-center gap-1 transition cursor-pointer"
                title={readerFormat === 'pdf' ? 'Tukar ke Mod Teks' : 'Buka Paparan PDF'}
              >
                <span>{readerFormat === 'pdf' ? 'Mod Teks' : 'Paparan PDF'}</span>
              </button>
            )}

            {/* Comic Scroll Mode Selector */}
            {!isNovel && (
              <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-lg p-0.5 text-xs font-bold mr-1">
                <button
                  onClick={() => setComicMode('vertical')}
                  className={`px-2 py-1 rounded-md text-[11px] ${
                    comicMode === 'vertical' ? 'bg-indigo-600 text-white shadow-xs' : 'opacity-70'
                  }`}
                >
                  Webtoon
                </button>
                <button
                  onClick={() => setComicMode('horizontal')}
                  className={`px-2 py-1 rounded-md text-[11px] ${
                    comicMode === 'horizontal' ? 'bg-indigo-600 text-white shadow-xs' : 'opacity-70'
                  }`}
                >
                  Halaman
                </button>
              </div>
            )}

            {/* Consolidated "Aa" Settings Button */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`px-2.5 py-1.5 rounded-xl font-serif text-sm font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                  showSettingsMenu
                    ? 'bg-amber-500 text-slate-950 border-amber-600'
                    : 'bg-black/5 dark:bg-white/10 border-transparent hover:bg-black/10'
                }`}
                title="Tetapan Paparan & Fon"
                aria-label="Menu Tetapan Paparan"
              >
                <span>Aa</span>
              </button>

              {/* "Aa" Popover Menu */}
              {showSettingsMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3 z-50 text-slate-800 dark:text-slate-200 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Tetapan Paparan
                    </span>
                    <button
                      onClick={() => setShowSettingsMenu(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>

                  {/* 1. Tema Warna */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">Tema:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setSettings((s) => ({ ...s, theme: 'light' }))}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 ${
                          settings.theme === 'light'
                            ? 'bg-white border-amber-500 text-amber-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span>Cerah</span>
                      </button>

                      <button
                        onClick={() => setSettings((s) => ({ ...s, theme: 'sepia' }))}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 ${
                          settings.theme === 'sepia'
                            ? 'bg-[#faf6ee] border-amber-600 text-amber-900 shadow-xs'
                            : 'bg-[#faf6ee]/60 border-slate-200 text-amber-900'
                        }`}
                      >
                        <span>Sepia</span>
                      </button>

                      <button
                        onClick={() => setSettings((s) => ({ ...s, theme: 'dark' }))}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1 ${
                          settings.theme === 'dark'
                            ? 'bg-slate-800 border-indigo-400 text-white shadow-xs'
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        <Moon className="w-3 h-3 text-sky-400" />
                        <span>Gelap</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Saiz Tulisan (Novel) */}
                  {isNovel && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">Saiz Fon:</span>
                      <div className="flex items-center justify-between gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {(['sm', 'base', 'lg', 'xl'] as const).map((sz, i) => (
                          <button
                            key={sz}
                            onClick={() => setSettings((s) => ({ ...s, fontSize: sz }))}
                            className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                              settings.fontSize === sz
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-amber-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {i === 0 ? 'A-' : i === 1 ? 'A' : i === 2 ? 'A+' : 'A++'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Jenis Tulisan (Serif vs Sans) */}
                  {isNovel && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">Jenis Tulisan:</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => setSettings((s) => ({ ...s, fontFamily: 'serif' }))}
                          className={`py-1.5 px-2 rounded-lg text-xs font-serif ${
                            settings.fontFamily === 'serif'
                              ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-amber-300 font-bold border border-indigo-200 dark:border-slate-700'
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400'
                          }`}
                        >
                          Serif (Klasik)
                        </button>
                        <button
                          onClick={() => setSettings((s) => ({ ...s, fontFamily: 'sans' }))}
                          className={`py-1.5 px-2 rounded-lg text-xs font-sans ${
                            settings.fontFamily === 'sans'
                              ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-amber-300 font-bold border border-indigo-200 dark:border-slate-700'
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400'
                          }`}
                        >
                          Sans (Moden)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bookmark toggle button */}
            <button
              onClick={handleToggleCurrentBookmark}
              className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isCurrentPageBookmarked
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs ring-2 ring-amber-300 dark:ring-amber-500/50'
                  : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 text-current'
              }`}
              title={
                isCurrentPageBookmarked
                  ? `Padam Penanda Halaman ${currentStep}`
                  : `Tanda Halaman ${currentStep} (Bookmark)`
              }
              aria-label="Togol Penanda Halaman"
            >
              {isCurrentPageBookmarked ? (
                <>
                  <BookMarked className="w-4 h-4 fill-current text-slate-950 shrink-0" />
                  <span className="text-xs font-bold whitespace-nowrap">
                    Hlm {currentStep} Ditanda
                  </span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline text-xs font-medium opacity-85 whitespace-nowrap">
                    Tanda Hlm {currentStep}
                  </span>
                </>
              )}
            </button>

            {/* Bookmarks List Popover Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowBookmarksList(!showBookmarksList);
                  setShowSettingsMenu(false);
                }}
                className={`p-1.5 rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
                  showBookmarksList
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 text-current'
                }`}
                title="Senarai Semua Penanda Halaman Tersimpan"
                aria-label="Buka Senarai Penanda Halaman"
              >
                <ListOrdered className="w-4 h-4" />
                {bookmarks.length > 0 && (
                  <span className="text-[10px] font-bold bg-amber-500 text-slate-950 dark:bg-amber-400 rounded-full px-1.5 py-0.2">
                    {bookmarks.length}
                  </span>
                )}
              </button>

              {/* Bookmarks Dropdown Popover */}
              {showBookmarksList && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-84 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3 z-50 text-slate-800 dark:text-slate-200 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <BookmarkCheck className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Penanda Buku Naskhah ({bookmarks.length})
                      </span>
                    </div>
                    <button
                      onClick={() => setShowBookmarksList(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 p-1"
                    >
                      ✕
                    </button>
                  </div>

                  {bookmarks.length === 0 ? (
                    <div className="text-center py-5 text-xs text-slate-400 dark:text-slate-500 space-y-1.5">
                      <Bookmark className="w-6 h-6 mx-auto opacity-30 text-slate-400" />
                      <p className="font-semibold text-slate-600 dark:text-slate-400">
                        Tiada penanda buku disimpan lagi.
                      </p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        Tekan butang "Tanda Hlm {currentStep}" untuk menyimpan posisi bacaan anda!
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {bookmarks.map((bm) => {
                        const isCurrent = bm.pageNumber === currentStep;
                        return (
                          <div
                            key={bm.id || `${bm.bookId}-${bm.pageNumber}`}
                            className={`p-2.5 rounded-xl border transition-colors flex items-start justify-between gap-2 ${
                              isCurrent
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                            }`}
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {isNovel ? `Bab ${bm.pageNumber}` : `Halaman ${bm.pageNumber}`}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded-md">
                                    Sedang Dibaca
                                  </span>
                                )}
                              </div>
                              {bm.chapterTitle && (
                                <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                                  {bm.chapterTitle}
                                </p>
                              )}
                              {bm.excerpt && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                                  "{bm.excerpt}"
                                </p>
                              )}
                              <p className="text-[9px] text-slate-400 pt-0.5">
                                Disimpan: {new Date(bm.savedAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                              <button
                                onClick={() => {
                                  if (isNovel) {
                                    setCurrentChapterIndex(bm.pageNumber - 1);
                                  } else {
                                    setCurrentComicPageIndex(bm.pageNumber - 1);
                                  }
                                  setShowBookmarksList(false);
                                }}
                                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-0.5 cursor-pointer shadow-2xs"
                                title="Lompat terus ke halaman ini"
                              >
                                <span>Pergi</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>

                              {onRemoveBookmark && (
                                <button
                                  onClick={() => onRemoveBookmark(bm.pageNumber)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Padam penanda ini"
                                  aria-label="Padam Penanda"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors shrink-0"
              title="Togol Skrin Penuh"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Security Alert Header Strip */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>
              Perlindungan Hak Cipta Aktif · Salinan teks dan klik kanan adalah disekat
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isCurrentPageBookmarked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40">
                <BookmarkCheck className="w-3 h-3 text-amber-500" />
                Halaman {currentStep} Ditanda
              </span>
            )}
            <div className="font-mono font-bold">{progressPercent}% Dibaca</div>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1">
          <div
            className="bg-amber-500 h-1 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Central Reading Scroll Area */}
        <main
          className="flex-1 overflow-y-auto px-4 sm:px-12 py-8 relative protected-content select-none reader-watermark"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          {/* Dynamic Anti-Piracy Watermark Overlay */}
          <div
            className="pointer-events-none fixed inset-0 z-10 opacity-[0.06] dark:opacity-[0.08]"
            style={{
              backgroundImage: `repeating-linear-gradient(-30deg, transparent, transparent 100px, rgba(148, 163, 184, 0.4) 100px, rgba(148, 163, 184, 0.4) 102px)`,
            }}
          ></div>

          {/* Visible floating buyer watermark tag */}
          <div className="pointer-events-none fixed bottom-14 right-6 z-20 opacity-25 dark:opacity-30 text-[11px] font-mono font-bold select-none text-slate-600 dark:text-slate-300 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-400/20 backdrop-blur-xs">
            🔒 Pembeli: {buyerEmail} · Akta Hak Cipta 1987
          </div>

          {/* ============================================================== */}
          {/* PDF READER VIEW */}
          {/* ============================================================== */}
          {readerFormat === 'pdf' && book.pdfUrl && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-current/10">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px]">
                    PDF
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold">{book.title}</h2>
                    <p className="text-[10px] opacity-70">
                      {book.pdfFileName || 'Dokumen PDF Rasmi'} {book.pdfFileSize ? `(${book.pdfFileSize})` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-300/40">
                  {isOwned || book.isFree ? 'Akses Sah Pembeli' : 'Mod Pratonton'}
                </div>
              </div>

              {isOwned || book.isFree ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-900 shadow-2xl h-[76vh]">
                  {/* Floating Security Watermark Tag */}
                  <div className="absolute top-2 right-4 z-20 pointer-events-none bg-slate-950/85 text-amber-300 text-[10px] font-mono px-2.5 py-1 rounded-md backdrop-blur-xs border border-amber-400/40">
                    🔒 Dilesenkan kepada: {buyerEmail}
                  </div>
                  <iframe
                    src={book.pdfUrl}
                    className="w-full h-full border-0 rounded-2xl bg-slate-800"
                    title={book.title}
                  />
                </div>
              ) : (
                <div className="p-6 sm:p-8 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/70 text-center space-y-4 max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-sm mx-auto shadow-md">
                    PDF
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Karya Ini Disediakan Dalam Format Dokumen PDF Penuh
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {book.pdfFileName || book.title} · {book.pages} muka surat
                    </p>
                  </div>
                  <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
                    Dapatkan akses penuh untuk membaca keseluruhan fail PDF naskhah ini pada pelayar anda dengan perlindungan hak cipta rasmi.
                  </p>
                  <button
                    onClick={() => onAddToCart(book)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Beli Versi Penuh ({formatMYR(book.price)})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TEXT NOVEL READER VIEW */}
          {/* ============================================================== */}
          {readerFormat !== 'pdf' && isNovel && currentChapter && (
            <article className={`max-w-2xl mx-auto space-y-6 ${fontFamilyClasses[settings.fontFamily]}`}>
              {/* Chapter Header */}
              <div className="text-center pb-6 border-b border-current/10 space-y-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-600 dark:text-amber-400">
                  {book.title}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {currentChapter.title}
                </h1>
                {currentChapter.subtitle && (
                  <p className="text-sm opacity-70 italic">{currentChapter.subtitle}</p>
                )}
              </div>

              {/* Chapter Text Body */}
              <div className={`space-y-4 ${fontSizeClasses[settings.fontSize]}`}>
                {currentChapter.paragraphs.map((p, idx) => (
                  <p
                    key={idx}
                    className="text-left sm:text-justify leading-relaxed tracking-normal font-normal text-slate-800 dark:text-slate-200 text-pretty"
                  >
                    {p}
                  </p>
                ))}
              </div>

              {/* End of Chapter Teaser / Sample Banner */}
              <div className="pt-10 pb-4 text-center border-t border-current/10 space-y-4">
                <div className="inline-block p-2 rounded-full bg-amber-500/10 text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base">Tamat Bahagian Ini</h4>
                  <p className="text-xs opacity-75 mt-1 max-w-md mx-auto">
                    {currentChapterIndex < chapters.length - 1
                      ? 'Teruskan membaca bab seterusnya di bawah.'
                      : isOwned
                      ? book.isSeries && book.seriesStatus === 'ongoing'
                        ? '✨ Anda telah membaca semua bab yang diterbitkan setakat ini! Penulis akan menambah bab baharu tidak lama lagi. Kemas kini akan muncul secara automatik di sini.'
                        : 'Tahniah, anda telah selesai membaca keseluruhan naskhah ini!'
                      : 'Naskhah penuh mengandungi lebih banyak bab! Dapatkan versi penuh untuk menyokong karya penulis tempatan.'}
                  </p>
                </div>

                {!isOwned && !book.isFree && currentChapterIndex === chapters.length - 1 && (
                  <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 max-w-md mx-auto space-y-3">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Buka Versi Penuh Buku Ini
                    </div>
                    <div className="text-xs opacity-80">
                      Hanya {formatMYR(book.price)} · Beli sekali, baca selama-lamanya.
                    </div>
                    <button
                      onClick={() => onAddToCart(book)}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Beli Versi Penuh ({formatMYR(book.price)})</span>
                    </button>
                  </div>
                )}
              </div>
            </article>
          )}

          {/* ============================================================== */}
          {/* COMIC & GRAPHIC NOVEL READER VIEW */}
          {/* ============================================================== */}
          {readerFormat !== 'pdf' && !isNovel && (
            <div
              className="max-w-3xl mx-auto space-y-8 transition-transform duration-200 origin-top"
              style={{ transform: `scale(${comicZoom})` }}
            >
              {/* Either Vertical Webtoon Stream of All Panels OR Single Active Page */}
              {(comicMode === 'vertical' ? comicPanels : [currentComicPanel]).map((panel, pIdx) => {
                if (!panel) return null;
                return (
                  <div key={panel.id || pIdx} className="space-y-4">
                    {/* Comic Panel Header */}
                    <div className="text-center pb-1">
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {panel.ambientCaption || panel.title}
                      </span>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {panel.title}
                      </h2>
                    </div>

                    {/* Graphic Comic Panel Canvas Simulation with High-Quality Vector Comic Strips */}
                    <div className="rounded-2xl border-4 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-2xl p-4 sm:p-6 space-y-6">
                      {/* Visual Scene Canvas Illustration */}
                      <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-xl overflow-hidden flex flex-col justify-between p-4 border border-white/10">
                        {/* Decorative Comic Grid lines & Halftone pattern */}
                        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>

                        {/* Scene Location Badge */}
                        <div className="relative z-10 self-start bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-sm uppercase tracking-wider shadow-md">
                          {panel.ambientCaption}
                        </div>

                        {/* Dynamic Comic SVG Artwork according to Theme */}
                        <div className="relative z-10 flex items-center justify-center py-6 text-center">
                          {panel.svgArtworkType === 'campus' && (
                            <div className="space-y-2 text-white">
                              <div className="text-5xl font-black text-amber-300 tracking-wider animate-pulse">
                                🏫 KELAS 5 SASTERA!
                              </div>
                              <div className="text-xs text-slate-300 font-mono">
                                "Bukan tak nak siap kerja rumah cikgu... tapi..."
                              </div>
                            </div>
                          )}

                          {panel.svgArtworkType === 'cyberpunk' && (
                            <div className="space-y-2 text-white">
                              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 animate-pulse">
                                ⚡ TAMING SARI NANO
                              </div>
                              <div className="text-xs text-cyan-300 font-mono">
                                [ SISTEM SILAT GAYONG SIBER DIAKTIFKAN ]
                              </div>
                            </div>
                          )}

                          {panel.svgArtworkType === 'village' && (
                            <div className="space-y-2 text-white">
                              <div className="text-5xl font-black text-lime-400 animate-bounce">
                                🐂 SPLASHHH!
                              </div>
                              <div className="text-xs text-emerald-200">
                                Jalak Si Kerbau Solar melompat masuk ke lubuk sungai!
                              </div>
                            </div>
                          )}

                          {panel.svgArtworkType === 'cooking' && (
                            <div className="space-y-2 text-white">
                              <div className="text-5xl font-black text-pink-300">
                                🍮 POPP! ONDE-ONDE!
                              </div>
                              <div className="text-xs text-amber-200">
                                Gula Melaka cair berhamburan dalam mulut!
                              </div>
                            </div>
                          )}

                          {panel.svgArtworkType === 'action' && (
                            <div className="space-y-2 text-white">
                              <div className="text-5xl font-black text-amber-400">
                                💥 GEDEBUKKK!
                              </div>
                              <div className="text-xs text-slate-300 font-mono">
                                Gelombang tenaga menggegarkan kawasan pertempuran!
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Scene Description Narration Box */}
                        <div className="relative z-10 self-end bg-slate-900/90 text-slate-200 text-xs p-2 rounded-lg border border-white/20 max-w-md italic">
                          {panel.sceneDescription}
                        </div>
                      </div>

                      {/* Comic Dialogue Speech Bubbles (Authentic Comic Layout) */}
                      <div className="space-y-3 pt-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Dialog & Babak (M/S {panel.pageNumber}):
                        </div>
                        <div className="space-y-2.5">
                          {panel.dialogue.map((dlg, dIdx) => (
                            <div
                              key={dIdx}
                              className={`flex flex-col ${
                                dlg.side === 'right'
                                  ? 'items-end'
                                  : dlg.side === 'center'
                                  ? 'items-center text-center'
                                  : 'items-start'
                              }`}
                            >
                              <span className="text-[10px] font-bold text-slate-500 px-1">
                                {dlg.speaker}
                              </span>
                              <div
                                className={`relative max-w-md p-3 rounded-2xl text-xs sm:text-sm font-medium shadow-md border ${
                                  dlg.mood === 'shout'
                                    ? 'bg-amber-400 text-slate-950 font-black border-slate-900 uppercase tracking-tight'
                                    : dlg.mood === 'thinking'
                                    ? 'bg-sky-100 text-sky-900 border-sky-300 rounded-3xl italic'
                                    : dlg.side === 'right'
                                    ? 'bg-indigo-600 text-white border-indigo-700'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {dlg.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* End of Comic Preview Upsell */}
              {!isOwned && !book.isFree && (
                <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Tamat Pratonton Komik Ini!
                  </h4>
                  <p className="text-xs opacity-80">
                    Ingin tahu sambungan naskhah ini? Dapatkan komik penuh {book.pages} muka surat
                    berwarna dengan hanya {formatMYR(book.price)}.
                  </p>
                  <button
                    onClick={() => onAddToCart(book)}
                    className="inline-flex items-center gap-2 py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Beli Komik Penuh Sekarang</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <footer
          className={`flex items-center justify-between px-4 py-3 shrink-0 border-t ${
            themeHeaderClasses[settings.theme]
          }`}
        >
          {/* Previous Button */}
          <button
            onClick={() => {
              if (isNovel) {
                setCurrentChapterIndex((prev) => Math.max(0, prev - 1));
              } else {
                setCurrentComicPageIndex((prev) => Math.max(0, prev - 1));
              }
            }}
            disabled={isNovel ? currentChapterIndex === 0 : currentComicPageIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          {/* Center Page Indicator / Chapter Switcher */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {isNovel ? (
              <select
                value={currentChapterIndex}
                onChange={(e) => setCurrentChapterIndex(Number(e.target.value))}
                className="bg-transparent font-bold border border-current/20 rounded-md px-2 py-1 text-xs focus:outline-none cursor-pointer"
              >
                {chapters.map((ch, idx) => {
                  const label = ch.title.startsWith('Bab') ? ch.title : `Bab ${ch.id}: ${ch.title}`;
                  return (
                    <option key={ch.id} value={idx} className="bg-white text-slate-900">
                      {label.length > 30 ? label.substring(0, 30) + '...' : label}
                    </option>
                  );
                })}
              </select>
            ) : (
              <span className="font-mono text-xs">
                Muka Surat {currentStep} / {totalSteps}
              </span>
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={() => {
              if (isNovel) {
                setCurrentChapterIndex((prev) => Math.min(chapters.length - 1, prev + 1));
              } else {
                setCurrentComicPageIndex((prev) => Math.min(comicPanels.length - 1, prev + 1));
              }
            }}
            disabled={
              isNovel
                ? currentChapterIndex >= chapters.length - 1
                : currentComicPageIndex >= comicPanels.length - 1
            }
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden sm:inline">Seterusnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </div>
    </div>
  );
};
