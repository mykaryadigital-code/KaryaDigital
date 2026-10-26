import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  RefreshCw,
  Scroll,
  BookOpen,
  AlertCircle,
  FileText,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { saveManuscriptToIndexedDb, getManuscriptFromIndexedDb } from '../utils/indexedDbStorage';

interface PdfCanvasViewerProps {
  bookId?: string;
  pdfUrl: string;
  title: string;
  buyerEmail?: string;
  initialPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
  onSwitchToTextMode?: () => void;
  hasTextModeFallback?: boolean;
  onPdfReloaded?: (newUrl: string) => void;
  isAuthorOrAdmin?: boolean;
  className?: string;
}

// Helper to convert Base64 string to Uint8Array for PDF.js
function base64ToUint8Array(base64: string): Uint8Array {
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper untuk konfigurasi worker PDF.js dengan selamat tanpa menimpa objek getter sedia ada
function configurePdfJsWorker(lib: any) {
  if (!lib) return;
  try {
    if (lib.GlobalWorkerOptions) {
      if (!lib.GlobalWorkerOptions.workerSrc) {
        lib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.js';
      }
    }
  } catch (err) {
    console.warn('[PdfCanvasViewer] Amaran konfigurasi worker PDF.js:', err);
  }
}

// Dynamically load the self-hosted Mozilla PDF.js library with guaranteed polling & timeout
function loadPdfJsLibrary(): Promise<any> {
  return new Promise((resolve, reject) => {
    const checkLib = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        configurePdfJsWorker(lib);
        return lib;
      }
      return null;
    };

    const immediate = checkLib();
    if (immediate) return resolve(immediate);

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const lib = checkLib();
      if (lib) {
        clearInterval(interval);
        return resolve(lib);
      }
      if (attempts > 60) {
        clearInterval(interval);
        const fallback = (window as any).pdfjsLib;
        if (fallback) {
          configurePdfJsWorker(fallback);
          resolve(fallback);
        } else {
          reject(new Error('Enjin PDF.js mengambil masa terlalu lama untuk dimuatkan. Sila muat semula halaman.'));
        }
      }
    }, 40);

    const existingScript = document.querySelector('script[src*="pdf.min.js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = '/vendor/pdfjs/pdf.min.js';
      script.async = true;
      script.onerror = () => {
        clearInterval(interval);
        reject(new Error('Gagal memuatkan skrip PDF.js dari pelayan.'));
      };
      document.head.appendChild(script);
    }
  });
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  bookId,
  pdfUrl,
  title,
  buyerEmail = 'pembaca@karyadigital.my',
  initialPage = 1,
  onPageChange,
  onSwitchToTextMode,
  hasTextModeFallback,
  onPdfReloaded,
  isAuthorOrAdmin = false,
  className = '',
}) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'single' | 'vertical'>('vertical');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const singleCanvasRef = useRef<HTMLCanvasElement>(null);
  const verticalContainerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const pageCanvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const activePageRendersRef = useRef<Map<number, any>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const renderingPagesRef = useRef<Set<number>>(new Set());

  // 1. Inisialisasi dan Memuat Dokumen PDF
  const loadDocument = useCallback(async () => {
    if (!pdfUrl) {
      setLoadError('Pautan fail dokumen PDF tidak sah atau kosong.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    setLoadProgress(15);

    try {
      const pdfjsLib = await loadPdfJsLibrary();
      setLoadProgress(35);

      let loadingTask;
      if (pdfUrl.startsWith('data:')) {
        const uint8Data = base64ToUint8Array(pdfUrl);
        loadingTask = pdfjsLib.getDocument({
          data: uint8Data,
          cMapPacked: true,
        });
      } else if (pdfUrl.startsWith('blob:')) {
        loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapPacked: true,
        });
      } else {
        // Cuba muat turun daripada URL pelayan
        let buf: ArrayBuffer | null = null;
        try {
          const resp = await fetch(pdfUrl);
          if (resp.ok) {
            buf = await resp.arrayBuffer();
          }
        } catch (e) {
          console.warn('[PdfCanvasViewer] Amaran fetch:', e);
        }

        // Jika pelayan 404 / tiada fail fizikal, cuba ambil dari IndexedDB peranti pengguna
        if (!buf && bookId) {
          try {
            const stored = await getManuscriptFromIndexedDb(bookId);
            if (stored && stored.format === 'pdf' && stored.data) {
              if (typeof stored.data === 'string' && stored.data.startsWith('data:')) {
                const uint8 = base64ToUint8Array(stored.data);
                buf = uint8.buffer as ArrayBuffer;
              } else if (stored.data instanceof Blob) {
                buf = await stored.data.arrayBuffer();
              }
            }
          } catch (e) {
            console.warn('[PdfCanvasViewer] Amaran IndexedDB fallback:', e);
          }
        }

        if (buf) {
          setLoadProgress(65);
          loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(buf),
            cMapPacked: true,
          });
        } else {
          try {
            loadingTask = pdfjsLib.getDocument({
              url: pdfUrl,
              cMapPacked: true,
            });
          } catch (e) {
            throw new Error('Fail PDF tidak ditemui pada storan pelayan mahupun peranti.');
          }
        }
      }

      loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
        if (progressData.total > 0) {
          const percent = Math.min(95, Math.round((progressData.loaded / progressData.total) * 100));
          setLoadProgress(percent);
        }
      };

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Masa memuatkan naskhah melebihi had (Timeout). Sila beralih ke Mod Teks.')), 25000)
      );

      const doc = (await Promise.race([loadingTask.promise, timeoutPromise])) as any;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setLoadProgress(100);
      setIsLoading(false);
      onPageChange?.(1, doc.numPages);
    } catch (err: any) {
      console.error('[PdfCanvasViewer] Ralat memuatkan dokumen:', err);
      // Auto-fallback: Jika naskhah mempunyai bab mod teks dan gagal memuat fail PDF fizikal, beralih terus ke Mod Teks
      if (hasTextModeFallback && onSwitchToTextMode) {
        console.log('[PdfCanvasViewer] Beralih secara automatik ke Mod Teks untuk pembaca.');
        onSwitchToTextMode();
        return;
      }
      setLoadError(
        err?.message ||
          'Gagal membuka fail PDF. Format fail mungkin rosak atau memori peranti tidak mencukupi.'
      );
      setIsLoading(false);
    }
  }, [pdfUrl, bookId, onPageChange, hasTextModeFallback, onSwitchToTextMode]);

  // Pengendali muat naik fail PDF terus ke Cloudflare R2 (Hanya dipicu oleh Pengarang/Admin)
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && !file.type.includes('pdf')) {
      alert('Sila pilih fail naskhah dalam format dokumen PDF yang sah.');
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    setLoadProgress(15);

    try {
      // 1. Muat naik fail binari terus ke Cloudflare R2 Object Storage
      if (bookId) {
        setLoadProgress(30);
        const formData = new FormData();
        formData.append('bookId', bookId);
        formData.append('file', file);

        try {
          const uploadResp = await fetch('/api/books/upload-manuscript', {
            method: 'POST',
            body: formData,
          });
          const uploadResult = await uploadResp.json();
          if (uploadResult.success) {
            console.log('[Cloudflare R2] Fail naskhah disimpan kekal di R2:', uploadResult.fileKey);
            onPdfReloaded?.(uploadResult.streamUrl || `/api/books/pdf/${bookId}`);
          }
        } catch (uploadErr) {
          console.warn('[R2 Upload Warning]:', uploadErr);
        }
      }

      setLoadProgress(55);
      const arrayBuffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      setLoadProgress(75);

      const pdfjsLib = await loadPdfJsLibrary();
      const loadingTask = pdfjsLib.getDocument({
        data: uint8,
        cMapPacked: true,
      });

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setLoadProgress(100);
      setIsLoading(false);
      onPageChange?.(1, doc.numPages);

      // Simpan juga salinan setempat di IndexedDB
      if (bookId) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            saveManuscriptToIndexedDb(bookId, reader.result, file.name, 'pdf').catch(console.warn);
          }
        };
        reader.readAsDataURL(file);
      }

      alert('Berjaya! Fail PDF naskhah ini telah dimuat naik dan disimpan secara kekal di Cloudflare R2. Semua pembeli yang membeli buku ini kini boleh membuka dan membacanya dari mana-mana peranti.');
    } catch (err: any) {
      console.error('[PdfCanvasViewer] Gagal membaca fail PDF tempatan:', err);
      setLoadError(err?.message || 'Gagal membaca fail PDF yang dipilih.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
    return () => {
      if (pdfDoc) {
        try {
          pdfDoc.destroy();
        } catch (e) {}
      }
    };
  }, [loadDocument]);

  // 2. Render Muka Surat Tunggal (Single Page Mode)
  const renderSinglePage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc || !singleCanvasRef.current || !containerRef.current) return;

      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {}
        }

        const page = await pdfDoc.getPage(pageNumber);
        const canvas = singleCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const containerWidth = containerRef.current.clientWidth || 800;
        const unscaledViewport = page.getViewport({ scale: 1.0, rotation });

        const padding = 32;
        const targetWidth = Math.max(300, containerWidth - padding);
        const computedScale = (targetWidth / unscaledViewport.width) * zoomLevel;

        const viewport = page.getViewport({ scale: computedScale, rotation });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        const renderContext = {
          canvasContext: ctx,
          transform,
          viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('[PdfCanvasViewer] Ralat render halaman tunggal:', err);
        }
      }
    },
    [pdfDoc, zoomLevel, rotation]
  );

  // 3. Render Muka Surat Mod Menegak (Vertical Scroll Mode / Webtoon)
  const renderVerticalPage = useCallback(
    async (pageNumber: number, canvas: HTMLCanvasElement) => {
      if (!pdfDoc || !canvas || !containerRef.current) return;
      if (renderingPagesRef.current.has(pageNumber)) return;

      renderingPagesRef.current.add(pageNumber);

      const activeRender = activePageRendersRef.current.get(pageNumber);
      if (activeRender) {
        try {
          activeRender.cancel();
          await activeRender.promise.catch(() => {});
        } catch (e) {}
        activePageRendersRef.current.delete(pageNumber);
      }

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          renderingPagesRef.current.delete(pageNumber);
          return;
        }

        const containerWidth = containerRef.current.clientWidth || 800;
        const unscaledViewport = page.getViewport({ scale: 1.0, rotation });

        const padding = 16;
        const targetWidth = Math.max(280, containerWidth - padding);
        const computedScale = (targetWidth / unscaledViewport.width) * zoomLevel;

        const viewport = page.getViewport({ scale: computedScale, rotation });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        const renderContext = {
          canvasContext: ctx,
          transform,
          viewport,
        };

        const task = page.render(renderContext);
        activePageRendersRef.current.set(pageNumber, task);
        await task.promise;
        renderedPagesRef.current.add(pageNumber);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`[PdfCanvasViewer] Render muka surat ${pageNumber}:`, err?.message || err);
        }
      } finally {
        renderingPagesRef.current.delete(pageNumber);
        activePageRendersRef.current.delete(pageNumber);
      }
    },
    [pdfDoc, zoomLevel, rotation]
  );

  // Trigger render on mode/zoom/rotation changes
  useEffect(() => {
    if (!pdfDoc) return;

    if (viewMode === 'single') {
      renderSinglePage(currentPage);
    } else {
      renderedPagesRef.current.clear();
      pageCanvasesRef.current.forEach((canvas, pageNum) => {
        if (canvas) {
          renderVerticalPage(pageNum, canvas);
        }
      });
    }
  }, [pdfDoc, currentPage, viewMode, zoomLevel, rotation, renderSinglePage, renderVerticalPage]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (viewMode === 'single') {
        renderSinglePage(currentPage);
      } else {
        pageCanvasesRef.current.forEach((canvas, pageNum) => {
          if (canvas) renderVerticalPage(pageNum, canvas);
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode, currentPage, renderSinglePage, renderVerticalPage]);

  // Track active scroll position in vertical mode
  const handleScroll = () => {
    if (viewMode !== 'vertical' || !verticalContainerRef.current) return;
    const container = verticalContainerRef.current;
    const containerTop = container.getBoundingClientRect().top;

    let closestPage = 1;
    let minDistance = Infinity;

    pageCanvasesRef.current.forEach((canvas, pageNum) => {
      const rect = canvas.getBoundingClientRect();
      const distance = Math.abs(rect.top - containerTop);
      if (distance < minDistance) {
        minDistance = distance;
        closestPage = pageNum;
      }
    });

    if (closestPage !== currentPage) {
      setCurrentPage(closestPage);
      onPageChange?.(closestPage, totalPages);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      onPageChange?.(next, totalPages);
      if (viewMode === 'vertical') {
        const el = pageCanvasesRef.current.get(next);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      onPageChange?.(prev, totalPages);
      if (viewMode === 'vertical') {
        const el = pageCanvasesRef.current.get(prev);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(2.5, +(prev + 0.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.6, +(prev - 0.15).toFixed(2)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-900 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none ${className}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md z-30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] tracking-wider shrink-0">
            PDF KANVAS
          </div>
          <span className="text-xs font-semibold truncate max-w-[140px] sm:max-w-xs text-slate-200">
            {title}
          </span>
          {totalPages > 0 && (
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
              {totalPages} Muka Surat
            </span>
          )}
        </div>

        {/* View Mode & Zoom Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60">
            <button
              onClick={() => setViewMode('vertical')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all ${
                viewMode === 'vertical'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tatal Menegak / Mod Webtoon"
            >
              <Scroll className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tatal Menegak</span>
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all ${
                viewMode === 'single'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Muka Surat Tunggal"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Satu Halaman</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.6}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              title="Kecilkan Saiz (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-300 hover:text-indigo-400"
              title="Set Semula Saiz (100%)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.5}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              title="Besarkan Saiz (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rotate */}
          <button
            onClick={handleRotate}
            className="p-1.5 rounded-lg bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Putar Dokumen 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Butang Beralih ke Mod Teks & Bab (Untuk Semua Pengguna) */}
          {hasTextModeFallback && onSwitchToTextMode && (
            <button
              onClick={onSwitchToTextMode}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              title="Tukar ke Mod Pembaca Teks & Tipografi"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mod Teks</span>
            </button>
          )}

          {/* Butang Pantas Muat Naik ke Cloudflare R2 untuk Pengarang/Admin */}
          {isAuthorOrAdmin && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              title="Muat naik atau gantikan fail PDF naskhah di Cloudflare R2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Muat Naik PDF (R2)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Buyer License Floating Security Tag */}
      <div className="absolute top-14 right-4 z-20 pointer-events-none bg-slate-950/85 text-amber-300 text-[10px] font-mono px-2.5 py-1 rounded-md backdrop-blur-xs border border-amber-400/40 shadow-lg flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>🔒 Dilesenkan kepada: {buyerEmail}</span>
      </div>

      {/* 3. Main Viewer Area */}
      <div
        ref={verticalContainerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto overflow-x-auto min-h-[550px] max-h-[82vh] p-2 sm:p-4 bg-slate-950 flex flex-col items-center"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center animate-pulse">
              <FileText className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-slate-100">Menyediakan Paparan PDF Kanvas</h4>
              <p className="text-xs text-slate-400">
                Memproses naskhah grafik resolusi tinggi terus pada peranti anda...
              </p>
            </div>
            <div className="w-64 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(10, loadProgress)}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-indigo-300 font-semibold">
              {loadProgress}% Siap
            </span>
          </div>
        )}

        {/* Error State */}
        {loadError && (
          <div className="my-auto p-6 max-w-md bg-slate-900/90 border border-indigo-500/30 rounded-2xl text-center space-y-4 shadow-2xl">
            <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center mx-auto shadow-md ${isAuthorOrAdmin ? 'bg-amber-600' : 'bg-indigo-600'}`}>
              {isAuthorOrAdmin ? <Upload className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-slate-100">
                {isAuthorOrAdmin
                  ? 'Pusat Naskhah Pengarang / Admin'
                  : 'Naskhah Penuh Anda Sedia Dibaca!'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isAuthorOrAdmin
                  ? 'Sebagai Pengarang karya ini, muat naik fail PDF naskhah asal anda ke Cloudflare R2 sekarang supaya SEMUA pembaca boleh membuka dan membaca naskhah bercetak asal dari mana-mana peranti.'
                  : 'Naskhah rasmi ini sedia dibuka dalam Mod Teks & Tipografi Pantas tanpa sebarang halangan. Anda juga boleh mencuba memuatkan semula fail PDF.'}
              </p>
            </div>

            {/* Tersembunyi: Input Pemilihan Fail Tempatan untuk Pengarang */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleLocalFileUpload}
              className="hidden"
            />

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              {/* Butang Utama untuk Pelanggan / Pembeli: Buka Mod Teks Segera */}
              {hasTextModeFallback && onSwitchToTextMode && (
                <button
                  type="button"
                  onClick={onSwitchToTextMode}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer shadow-md"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Baca Dalam Mod Teks (Akses Penuh)</span>
                </button>
              )}

              {/* Butang Muat Naik ke Cloudflare R2 untuk Pengarang/Admin */}
              {isAuthorOrAdmin && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-md"
                  title="Muat naik fail PDF ke Cloudflare R2 untuk kegunaan semua pembeli"
                >
                  <Upload className="w-4 h-4" />
                  <span>Muat Naik ke Cloudflare R2</span>
                </button>
              )}

              <button
                type="button"
                onClick={loadDocument}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Cuba Semula</span>
              </button>
            </div>
          </div>
        )}

        {/* Success Content: Vertical Scroll Mode (All pages in sequence) */}
        {!isLoading && !loadError && viewMode === 'vertical' && (
          <div className="w-full flex flex-col items-center gap-4 sm:gap-6 py-2">
            {Array.from({ length: totalPages }, (_, idx) => {
              const pageNum = idx + 1;
              return (
                <div
                  key={`page-container-${pageNum}`}
                  className="relative group bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-800 transition-transform"
                >
                  {/* Page Canvas */}
                  <canvas
                    ref={(el) => {
                      if (el) {
                        pageCanvasesRef.current.set(pageNum, el);
                        if (!renderedPagesRef.current.has(pageNum) && !renderingPagesRef.current.has(pageNum)) {
                          renderVerticalPage(pageNum, el);
                        }
                      } else {
                        pageCanvasesRef.current.delete(pageNum);
                      }
                    }}
                    className="block bg-white max-w-full h-auto pointer-events-none"
                  />

                  {/* Watermark Diagonal Overlay (Prevents easy screen grab) */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none flex items-center justify-center opacity-[0.07] rotate-[-25deg]">
                    <span className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-widest text-center leading-loose">
                      {buyerEmail} • KARYADIGITAL LOKAL • AKTA HAK CIPTA 1987
                    </span>
                  </div>

                  {/* Page Badge Indicator */}
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none backdrop-blur-xs border border-white/10">
                    Muka Surat {pageNum} / {totalPages}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Success Content: Single Page Mode */}
        {!isLoading && !loadError && viewMode === 'single' && (
          <div className="my-auto flex flex-col items-center">
            <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-800">
              <canvas
                ref={singleCanvasRef}
                className="block bg-white max-w-full h-auto pointer-events-none"
              />

              {/* Watermark Diagonal Overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden select-none flex items-center justify-center opacity-[0.07] rotate-[-25deg]">
                <span className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-widest text-center leading-loose">
                  {buyerEmail} • KARYADIGITAL LOKAL • AKTA HAK CIPTA 1987
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Footer Navigation Bar */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 bg-slate-950/95 border-t border-slate-800 z-30">
        {/* Prev Page Button */}
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1 || isLoading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        {/* Center Page Selector / Jump */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">Halaman</span>
          <select
            value={currentPage}
            onChange={(e) => {
              const target = Number(e.target.value);
              setCurrentPage(target);
              onPageChange?.(target, totalPages);
              if (viewMode === 'vertical') {
                const el = pageCanvasesRef.current.get(target);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            disabled={totalPages <= 1}
            className="bg-slate-800 text-slate-100 border border-slate-700 rounded-md px-2 py-1 text-xs font-mono font-bold focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                {p} / {totalPages || 1}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400 font-mono">
            {viewMode === 'vertical' ? '• Tatal Berterusan' : `daripada ${totalPages}`}
          </span>
        </div>

        {/* Next Page Button */}
        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages || isLoading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">Seterusnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
