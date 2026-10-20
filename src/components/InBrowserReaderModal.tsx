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
} from 'lucide-react';
import { EBook, ReaderSettings } from '../types/ebook.ts';
import { calculateReadingProgress, formatMYR } from '../utils/ebookLogic.ts';

interface InBrowserReaderModalProps {
  book: EBook | null;
  isOpen: boolean;
  onClose: () => void;
  isOwned: boolean;
  onAddToCart: (book: EBook) => void;
  onTriggerSecurityWarning: (message: string, type: 'warning' | 'shield' | 'info') => void;
  buyerEmail?: string;
}

export const InBrowserReaderModal: React.FC<InBrowserReaderModalProps> = ({
  book,
  isOpen,
  onClose,
  isOwned,
  onAddToCart,
  onTriggerSecurityWarning,
  buyerEmail = 'mykaryadigital@gmail.com - ID: 88392',
}) => {
  if (!isOpen || !book) return null;

  // Reader Settings State
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

  // Bookmark active state
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reset indices when book changes
  useEffect(() => {
    setCurrentChapterIndex(0);
    setCurrentComicPageIndex(0);
    setComicZoom(1);
    setIsBookmarked(false);
  }, [book.id]);

  // Security Event Listeners (Sekat right click, copy, and shortcuts)
  useEffect(() => {
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

  const isNovel = book.category === 'novel';
  const chapters = book.sampleContent?.chapters || [];
  const currentChapter = chapters[currentChapterIndex] || null;

  const comicPanels = book.comicSample?.panels || [];
  const currentComicPanel = comicPanels[currentComicPageIndex] || null;

  // Calculate Reading Progress
  const totalSteps = isNovel ? chapters.length : comicPanels.length;
  const currentStep = isNovel ? currentChapterIndex + 1 : currentComicPageIndex + 1;
  const progressPercent = calculateReadingProgress(currentStep, totalSteps);

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
          className={`flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 shrink-0 backdrop-blur-md z-20 gap-2 ${
            themeHeaderClasses[settings.theme]
          }`}
        >
          {/* Top Row on Mobile: Close button, Title & Badge */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                aria-label="Tutup pembaca e-buku"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base truncate max-w-[160px] sm:max-w-xs">
                    {book.title}
                  </h3>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                    {isOwned ? 'Versi Penuh' : 'Pratonton Percuma'}
                  </span>
                </div>
                <p className="text-[11px] opacity-75 truncate">
                  Oleh {book.author} · {isNovel ? `Bab ${currentStep} dari ${totalSteps}` : `Muka Surat ${currentStep} dari ${totalSteps}`}
                </p>
              </div>
            </div>

            {/* Mobile close or quick bookmark indicator */}
            <div className="flex sm:hidden items-center gap-1">
              <button
                onClick={() => {
                  setIsBookmarked(!isBookmarked);
                  onTriggerSecurityWarning(
                    isBookmarked
                      ? 'Penanda buku telah dibuang.'
                      : 'Halaman ini telah ditandakan dalam koleksi anda!',
                    'info'
                  );
                }}
                className={`p-1.5 rounded-lg ${
                  isBookmarked
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-black/5 dark:bg-white/10'
                }`}
                aria-label="Tanda halaman"
              >
                {isBookmarked ? (
                  <BookMarked className="w-4 h-4 fill-current" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Controls Row: Font Size, Theme, Font Family, Bookmark */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 overflow-x-auto no-scrollbar">
            {/* Font Size Selector (for novels) */}
            {isNovel && (
              <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setSettings((s) => ({ ...s, fontSize: 'sm' }))}
                  className={`px-2 py-1 text-xs rounded-md font-bold ${
                    settings.fontSize === 'sm' ? 'bg-white dark:bg-slate-800 shadow-xs' : ''
                  }`}
                  title="Saiz Teks Kecil"
                >
                  A-
                </button>
                <button
                  onClick={() => setSettings((s) => ({ ...s, fontSize: 'base' }))}
                  className={`px-2 py-1 text-xs rounded-md font-bold ${
                    settings.fontSize === 'base' ? 'bg-white dark:bg-slate-800 shadow-xs' : ''
                  }`}
                  title="Saiz Teks Biasa"
                >
                  A
                </button>
                <button
                  onClick={() => setSettings((s) => ({ ...s, fontSize: 'lg' }))}
                  className={`px-2 py-1 text-xs rounded-md font-bold ${
                    settings.fontSize === 'lg' ? 'bg-white dark:bg-slate-800 shadow-xs' : ''
                  }`}
                  title="Saiz Teks Besar"
                >
                  A+
                </button>
              </div>
            )}

            {/* Font Family Selector (for novels) */}
            {isNovel && (
              <button
                onClick={() =>
                  setSettings((s) => ({
                    ...s,
                    fontFamily:
                      s.fontFamily === 'serif'
                        ? 'sans'
                        : s.fontFamily === 'sans'
                        ? 'mono'
                        : 'serif',
                  }))
                }
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors shrink-0"
                title="Tukar Jenis Tulisan"
              >
                <Type className="w-3.5 h-3.5" />
                <span className="capitalize">{settings.fontFamily}</span>
              </button>
            )}

            {/* Comic Scroll Mode & Zoom Controls */}
            {!isNovel && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Mode Selector: Webtoon (Vertical) vs Horizontal */}
                <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-lg p-0.5 shrink-0 text-xs font-bold">
                  <button
                    onClick={() => setComicMode('vertical')}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      comicMode === 'vertical'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title="Mod Skrol Menegak (Webtoon)"
                  >
                    📜 Webtoon
                  </button>
                  <button
                    onClick={() => setComicMode('horizontal')}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      comicMode === 'horizontal'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title="Mod Selakan Halaman (Manga)"
                  >
                    📖 Halaman
                  </button>
                </div>

                {/* Zoom & Fit to screen */}
                <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-lg p-0.5 shrink-0">
                  <button
                    onClick={() => setComicZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
                    className="p-1 rounded-md hover:bg-white/50"
                    title="Zum Keluar"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono px-1.5 font-bold">
                    {Math.round(comicZoom * 100)}%
                  </span>
                  <button
                    onClick={() => setComicZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)))}
                    className="p-1 rounded-md hover:bg-white/50"
                    title="Zum Masuk"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setComicZoom(1.0)}
                    className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-black/10 dark:bg-white/10 ml-0.5"
                    title="Muat-kan ke Skrin"
                  >
                    Fit
                  </button>
                </div>
              </div>
            )}

            {/* Theme Toggle: Light / Sepia / Dark */}
            <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setSettings((s) => ({ ...s, theme: 'light' }))}
                className={`p-1.5 rounded-md ${
                  settings.theme === 'light' ? 'bg-white shadow-xs text-amber-600' : 'opacity-70'
                }`}
                title="Mod Cerah"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSettings((s) => ({ ...s, theme: 'sepia' }))}
                className={`p-1.5 rounded-md ${
                  settings.theme === 'sepia'
                    ? 'bg-[#faf6ee] shadow-xs text-amber-800 font-bold'
                    : 'opacity-70'
                }`}
                title="Mod Kertas Sepia"
              >
                <span className="text-xs font-bold font-serif leading-none">S</span>
              </button>
              <button
                onClick={() => setSettings((s) => ({ ...s, theme: 'dark' }))}
                className={`p-1.5 rounded-md ${
                  settings.theme === 'dark' ? 'bg-slate-800 shadow-xs text-sky-400' : 'opacity-70'
                }`}
                title="Mod Malam Gelap"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bookmark button (desktop) */}
            <button
              onClick={() => {
                setIsBookmarked(!isBookmarked);
                onTriggerSecurityWarning(
                  isBookmarked
                    ? 'Penanda buku telah dibuang.'
                    : 'Halaman ini telah ditandakan dalam koleksi anda!',
                  'info'
                );
              }}
              className={`hidden sm:flex p-1.5 rounded-lg transition-colors shrink-0 ${
                isBookmarked
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-black/5 dark:bg-white/10 hover:bg-black/10'
              }`}
              title="Tanda Halaman Ini (Bookmark)"
            >
              {isBookmarked ? (
                <BookMarked className="w-4 h-4 fill-current" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden md:flex p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors shrink-0"
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
          <div className="font-mono font-bold">{progressPercent}% Dibaca</div>
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
          {/* TEXT NOVEL READER VIEW */}
          {/* ============================================================== */}
          {isNovel && currentChapter && (
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
                  <h4 className="font-bold text-base">Tamat {currentChapter.title}</h4>
                  <p className="text-xs opacity-75 mt-1 max-w-md mx-auto">
                    {currentChapterIndex < chapters.length - 1
                      ? 'Teruskan membaca bab seterusnya di bawah.'
                      : isOwned
                      ? 'Tahniah, anda telah selesai membaca sampel naskhah ini!'
                      : 'Naskhah penuh mengandungi 348 muka surat lagi! Dapatkan versi penuh untuk sokong penulis.'}
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
          {!isNovel && (
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
                {chapters.map((ch, idx) => (
                  <option key={ch.id} value={idx} className="bg-white text-slate-900">
                    Bab {ch.id}: {ch.title.substring(0, 24)}...
                  </option>
                ))}
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
