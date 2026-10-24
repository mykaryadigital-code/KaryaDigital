import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  PenTool,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  FileText,
  UploadCloud,
  Sparkles,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  Eye,
  Trash2,
  Upload,
  LayoutDashboard,
  Coins,
  TrendingUp,
  ChevronRight,
  BookOpen,
  FileUp,
  Edit3,
  Layers,
  Plus,
} from 'lucide-react';
import { EBook, BookCategory, Chapter } from '../types/ebook.ts';
import { parseEpubFile } from '../utils/epubParser.ts';
import { isUserBookOwner } from '../utils/ebookLogic.ts';

export type AuthorPortalTab = 'dashboard' | 'borang' | 'panduan' | 'royalti' | 'guide' | 'royalty' | 'register';

interface AuthorPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishBook: (newBook: EBook) => void;
  currentUserName: string;
  currentUserEmail?: string;
  currentUserUid?: string;
  isAuthor?: boolean;
  initialTab?: AuthorPortalTab;
  onBecomeAuthor?: () => void;
  authorBooks?: EBook[];
  onEditBook?: (book: EBook) => void;
  onDeleteBook?: (bookId: string) => void;
  onOpenAuthModal?: () => void;
}

const HARDCOVER_THEMES = [
  { id: 'navy', name: 'Biru Indigo', gradient: 'from-slate-900 via-indigo-950 to-slate-950', accent: '#818cf8', border: 'border-indigo-500/50' },
  { id: 'emerald', name: 'Zamrud Mewah', gradient: 'from-emerald-950 via-teal-950 to-slate-950', accent: '#34d399', border: 'border-emerald-500/50' },
  { id: 'crimson', name: 'Merah Saga', gradient: 'from-rose-950 via-red-950 to-slate-950', accent: '#f87171', border: 'border-rose-500/50' },
  { id: 'amber', name: 'Emas Klasik', gradient: 'from-amber-950 via-stone-900 to-slate-950', accent: '#fbbf24', border: 'border-amber-500/50' },
  { id: 'black', name: 'Hitam Arang', gradient: 'from-neutral-950 via-slate-950 to-zinc-950', accent: '#e2e8f0', border: 'border-amber-400/50' },
];

export const AuthorPublishModal: React.FC<AuthorPublishModalProps> = ({
  isOpen,
  onClose,
  onPublishBook,
  currentUserName,
  currentUserEmail,
  currentUserUid,
  isAuthor = false,
  initialTab,
  onBecomeAuthor,
  authorBooks = [],
  onEditBook,
  onDeleteBook,
  onOpenAuthModal,
}) => {
  type TabKey = 'dashboard' | 'borang' | 'panduan' | 'royalti';

  const resolveTab = (tab?: AuthorPortalTab): TabKey => {
    if (tab === 'guide') return 'panduan';
    if (tab === 'royalty') return 'royalti';
    if (tab === 'register') return 'borang';
    if (tab === 'dashboard') return isAuthor ? 'dashboard' : 'borang';
    if (tab === 'borang' || tab === 'panduan' || tab === 'royalti') return tab;
    return isAuthor ? 'dashboard' : 'borang';
  };

  const [activeTab, setActiveTab] = useState<TabKey>(() => resolveTab(initialTab));

  useEffect(() => {
    if (isOpen) {
      setActiveTab(resolveTab(initialTab));
    }
  }, [isOpen, initialTab, isAuthor]);

  // Form State
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState(
    currentUserName && currentUserName !== 'Pembaca KaryaDigital' ? currentUserName : ''
  );
  const [category, setCategory] = useState<BookCategory>('novel');
  const [genre, setGenre] = useState('Misteri & Thriller');
  const [pricingType, setPricingType] = useState<'berbayar' | 'percuma'>('berbayar');
  const [price, setPrice] = useState('15.00');
  const [synopsis, setSynopsis] = useState('');
  const [sampleChapterTitle, setSampleChapterTitle] = useState('Bab 1: Permulaan Kembara');
  const [sampleContent, setSampleContent] = useState('');
  const [bankName, setBankName] = useState('Maybank');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  // Series & Episodic State
  const [isSeries, setIsSeries] = useState(false);
  const [seriesName, setSeriesName] = useState('');
  const [seriesOrder, setSeriesOrder] = useState<number>(1);
  const [seriesStatus, setSeriesStatus] = useState<'ongoing' | 'completed'>('ongoing');

  // Cover Image State
  const [coverMode, setCoverMode] = useState<'upload' | 'url' | 'theme'>('upload');
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(HARDCOVER_THEMES[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Digital Manuscript File Upload State (.EPUB & .PDF)
  const [manuscriptFile, setManuscriptFile] = useState<{
    format: 'epub' | 'pdf';
    name: string;
    size: string;
    dataUrl: string;
    chaptersCount?: number;
    paragraphsCount?: number;
  } | null>(null);
  const [parsedEpubChapters, setParsedEpubChapters] = useState<Chapter[] | null>(null);
  const [isParsingEpub, setIsParsingEpub] = useState(false);
  const manuscriptInputRef = useRef<HTMLInputElement>(null);

  // Submission State
  const [submittedBook, setSubmittedBook] = useState<EBook | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Sila pilih fail imej yang sah (PNG, JPG, atau WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle URL input apply
  const handleApplyUrl = () => {
    if (coverUrlInput.trim()) {
      setCoverImagePreview(coverUrlInput.trim());
    }
  };

  const handleClearCover = () => {
    setCoverImagePreview(null);
    setCoverUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManuscriptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isEpub = lowerName.endsWith('.epub') || file.type.includes('epub');
    const isPdf = lowerName.endsWith('.pdf') || file.type.includes('pdf');

    if (!isEpub && !isPdf) {
      alert('Sila pilih fail dokumen yang sah dalam format .EPUB atau .PDF.');
      return;
    }

    if (file.size > 80 * 1024 * 1024) {
      alert('Saiz fail melebihi had maksimum 80MB.');
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    if (isEpub) {
      setIsParsingEpub(true);
      try {
        const parsed = await parseEpubFile(file);
        setManuscriptFile({
          format: 'epub',
          name: file.name,
          size: sizeFormatted,
          dataUrl: parsed.dataUrl,
          chaptersCount: parsed.totalChapters,
          paragraphsCount: parsed.totalParagraphs,
        });
        setParsedEpubChapters(parsed.chapters);

        // Auto-fill title if empty or placeholder
        if (!title.trim() || title === 'Karya Baharu') {
          if (parsed.title) {
            setTitle(parsed.title);
          }
        }
        if (parsed.author && (!authorName || authorName === 'Penulis Tempatan')) {
          setAuthorName(parsed.author);
        }
      } catch (err) {
        console.error('Ralat menghurai fail EPUB:', err);
        alert('Gagal membaca kandungan fail EPUB. Sila pastikan fail tidak dilindungi kata laluan atau cuba muat naik dalam format PDF.');
      } finally {
        setIsParsingEpub(false);
      }
    } else {
      // PDF File
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setManuscriptFile({
            format: 'pdf',
            name: file.name,
            size: sizeFormatted,
            dataUrl: reader.result,
          });
          setParsedEpubChapters(null);

          // Auto-fill title if empty
          if (!title.trim()) {
            const autoTitle = file.name
              .replace(/\.pdf$/i, '')
              .replace(/[-_]/g, ' ')
              .trim();
            setTitle(autoTitle);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearManuscript = () => {
    setManuscriptFile(null);
    setParsedEpubChapters(null);
    if (manuscriptInputRef.current) {
      manuscriptInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !synopsis.trim()) return;

    setIsSubmitting(true);

    const generatedId = `karya-user-${Date.now()}`;
    const parsedPrice = pricingType === 'percuma' ? 0 : parseFloat(price) || 0;

    const sampleParagraphs = sampleContent.trim()
      ? sampleContent.split('\n\n').filter((p) => p.trim().length > 0)
      : [
          'Hujan renyai mula membasahi laluan desa ketika langkah kaki pertama dihayun. Udara dingin menyusup ke celah baju.',
          'Ini adalah permulaan kepada sebuah kisah yang tidak pernah terbayang dek akal fikiran.',
        ];

    const newBook: EBook = {
      id: generatedId,
      title: title.trim(),
      author: authorName.trim() || currentUserName || 'Penulis Tempatan',
      authorUid: currentUserUid || undefined,
      authorEmail: currentUserEmail || undefined,
      category: category,
      genre: genre,
      synopsis: synopsis.trim(),
      rating: 5.0,
      reviewsCount: 1,
      price: parsedPrice,
      isFree: parsedPrice === 0,
      pages: manuscriptFile?.format === 'pdf' ? 160 : parsedEpubChapters ? Math.max(90, parsedEpubChapters.length * 12) : 140,
      readTime: manuscriptFile?.format === 'pdf' ? '4 jam' : parsedEpubChapters ? `${Math.max(2, Math.round(parsedEpubChapters.length * 0.4))} jam` : '3 jam 30 min',
      publisher: 'Penerbitan Bebas KaryaDigital',
      publicationYear: 2026,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isbn: `978-967-KD${Math.floor(1000 + Math.random() * 9000)}-M`,
      coverImage: coverImagePreview || undefined,
      coverGradient: selectedTheme.gradient,
      coverAccent: selectedTheme.accent,
      coverBadge: manuscriptFile?.format === 'epub' ? 'Format EPUB' : manuscriptFile?.format === 'pdf' ? 'E-Buku PDF' : 'Karya Asli',
      pdfUrl: manuscriptFile?.format === 'pdf' ? manuscriptFile.dataUrl : undefined,
      pdfFileName: manuscriptFile?.format === 'pdf' ? manuscriptFile.name : undefined,
      pdfFileSize: manuscriptFile?.format === 'pdf' ? manuscriptFile.size : undefined,
      epubUrl: manuscriptFile?.format === 'epub' ? manuscriptFile.dataUrl : undefined,
      epubFileName: manuscriptFile?.format === 'epub' ? manuscriptFile.name : undefined,
      epubFileSize: manuscriptFile?.format === 'epub' ? manuscriptFile.size : undefined,
      isSeries,
      seriesName: isSeries ? seriesName.trim() || undefined : undefined,
      seriesOrder: isSeries ? Number(seriesOrder) || 1 : undefined,
      seriesStatus: isSeries ? seriesStatus : undefined,
      sampleContent: {
        chapters: parsedEpubChapters && parsedEpubChapters.length > 0
          ? parsedEpubChapters
          : [
              {
                id: 1,
                title: sampleChapterTitle.trim() || 'Bab 1',
                subtitle: isSeries ? `Jilid ${seriesOrder} • Karya Asli Penulis` : 'Karya Asli Penulis',
                paragraphs: sampleParagraphs,
              },
            ],
      },
    };

    setTimeout(() => {
      onPublishBook(newBook);
      onBecomeAuthor?.();
      setSubmittedBook(newBook);
      setIsSubmitting(false);
    }, 600);
  };

  const handleReset = () => {
    setTitle('');
    setSynopsis('');
    setSampleContent('');
    setCoverImagePreview(null);
    setIsSeries(false);
    setSeriesName('');
    setSeriesOrder(1);
    setSeriesStatus('ongoing');
    setCoverUrlInput('');
    setManuscriptFile(null);
    setParsedEpubChapters(null);
    if (manuscriptInputRef.current) {
      manuscriptInputRef.current.value = '';
    }
    setSubmittedBook(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Portal Penulis dan Penerbitan Karya"
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup portal penulis"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              {isAuthor ? <LayoutDashboard className="w-5 h-5 text-amber-300" /> : <PenTool className="w-5 h-5 text-amber-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  {isAuthor ? 'Dashboard Penulis & Penerbitan' : 'Portal Penulis & Terbit Karya'}
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  70% Royalti
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAuthor
                  ? 'Urus karya diterbitkan, pantau anggaran royalti dan hantar naskhah baharu.'
                  : 'Terbitkan novel teks atau komik anda terus kepada pembaca di seluruh Malaysia.'}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 sm:gap-4 mt-5 border-b border-slate-800 text-xs font-bold overflow-x-auto no-scrollbar">
            {isAuthor && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`pb-2.5 transition-colors border-b-2 -mb-[2px] cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard Penulis</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('borang')}
              className={`pb-2.5 transition-colors border-b-2 -mb-[2px] cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeTab === 'borang'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{isAuthor ? 'Terbit Naskhah Baharu' : 'Daftar & Terbit Karya'}</span>
            </button>
            <button
              onClick={() => setActiveTab('panduan')}
              className={`pb-2.5 transition-colors border-b-2 -mb-[2px] cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeTab === 'panduan'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Panduan Penerbitan</span>
            </button>
            <button
              onClick={() => setActiveTab('royalti')}
              className={`pb-2.5 transition-colors border-b-2 -mb-[2px] cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeTab === 'royalti'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Maklumat Royalti (70%)</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          {submittedBook ? (
            /* Success State */
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-slate-900">
                  Tahniah! Naskhah Berjaya Diterbitkan
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Karya <strong className="text-slate-800">"{submittedBook.title}"</strong> telah selamat dimasukkan ke dalam katalog KaryaDigital Malaysia dan kini sedia dibaca!
                </p>
              </div>

              {/* Success Card with Cover Preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left max-w-md mx-auto flex gap-4 items-center">
                <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-200 shadow-xs relative">
                  {submittedBook.coverImage ? (
                    <img
                      src={submittedBook.coverImage}
                      alt={submittedBook.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 border-l-2 border-amber-500/50 p-1 flex flex-col justify-between text-white text-[8px] text-center">
                      <span className="text-amber-400 font-bold uppercase">
                        {submittedBook.category === 'komik' ? 'Komik' : 'Novel'}
                      </span>
                      <span className="line-clamp-2 font-bold leading-tight">
                        {submittedBook.title}
                      </span>
                      <span className="text-slate-400 truncate">
                        {submittedBook.author}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs flex-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Rujukan:</span>
                    <span className="font-mono font-bold text-slate-900">{submittedBook.isbn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Penulis:</span>
                    <span className="font-semibold text-slate-900">{submittedBook.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Harga:</span>
                    <span className="font-bold text-indigo-600">
                      {submittedBook.isFree ? 'Percuma' : `RM ${submittedBook.price.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Royalti:</span>
                    <span className="font-bold text-emerald-600">70% ({bankName})</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-1 mt-1">
                    <span className="text-slate-500">Storan Aset:</span>
                    <span className="font-semibold text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Cloudflare R2 & Firestore
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {isAuthor && (
                  <button
                    onClick={() => {
                      handleReset();
                      setActiveTab('dashboard');
                    }}
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Buka Dashboard Penulis
                  </button>
                )}
                <button
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Lihat dalam Katalog
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Terbit Satu Lagi Karya
                </button>
              </div>
            </div>
          ) : activeTab === 'dashboard' && isAuthor ? (
            /* Dashboard Penulis */
            <div className="space-y-6 text-xs animate-in fade-in duration-200">
              {/* Author Header Profile */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-slate-900/5 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
                    {currentUserName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">{currentUserName}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {currentUserEmail?.toLowerCase() === 'mykaryadigital@gmail.com' ? 'Super Admin & Penerbit Rasmi' : 'Penulis Sah KaryaDigital'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {currentUserEmail?.toLowerCase() === 'mykaryadigital@gmail.com'
                        ? 'Pengurusan penuh naskhah terbitan rasmi & naskhah komuniti penulis platform.'
                        : 'Akaun Penulis Aktif • No. ID: KD-AUTH-2026 • Royalti 70% Bersih FPX/DuitNow'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('borang')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>+ Terbit Naskhah Baharu</span>
                </button>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Karya Diterbitkan
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {authorBooks ? authorBooks.length : 0}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">100% Aktif di Katalog</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    Anggaran Royalti (70%)
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">
                    RM {(authorBooks || []).reduce((acc, bk) => acc + (bk.price * 0.7 * (bk.reviewsCount || 1)), 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">Auto-payout 5hb depan</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    Pembaca Berdaftar
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {(authorBooks || []).reduce((acc, bk) => acc + ((bk.reviewsCount || 1) * 3), 0)}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-medium">Kadar bacaan 89%</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Perlindungan DRM
                  </div>
                  <div className="text-sm font-bold text-slate-900 pt-1">
                    Cloudflare R2
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">Enkripsi disahkan</div>
                </div>
              </div>

              {/* Senarai Naskhah Penulis */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-slate-900 text-sm">
                    {currentUserEmail?.toLowerCase() === 'mykaryadigital@gmail.com'
                      ? 'Naskhah Terbitan di Platform KaryaDigital'
                      : 'Naskhah Anda di Katalog KaryaDigital'}
                  </h5>
                  <span className="text-[11px] text-slate-500">
                    Status: Sedia Dibeli & Dibaca
                  </span>
                </div>

                {authorBooks && authorBooks.length > 0 ? (
                  <div className="space-y-2.5">
                    {authorBooks.map((bk) => (
                      <div
                        key={bk.id}
                        className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-16 rounded-lg bg-slate-900 overflow-hidden shrink-0 shadow-2xs relative border border-slate-200">
                            {bk.coverImage ? (
                              <img src={bk.coverImage} alt={bk.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-slate-900 p-1 flex flex-col justify-between text-white text-[7px] text-center">
                                <span className="text-amber-400 font-bold uppercase">{bk.category}</span>
                                <span className="line-clamp-2 font-bold leading-tight">{bk.title}</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h6 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{bk.title}</h6>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold">
                                ✍️ {bk.author} {bk.authorEmail ? `(${bk.authorEmail})` : ''}
                              </span>
                              <span>•</span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">{bk.genre}</span>
                              <span>•</span>
                              <span className="font-bold text-indigo-600">RM {bk.price.toFixed(2)}</span>
                              <span>•</span>
                              <span className="text-emerald-600 font-semibold">Royalti: RM {(bk.price * 0.7).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onEditBook &&
                            isUserBookOwner(bk as EBook, {
                              uid: currentUserUid,
                              email: currentUserEmail,
                              name: currentUserName,
                              isLoggedIn: Boolean(currentUserEmail),
                            }) && (
                              <button
                                type="button"
                                onClick={() => {
                                  onEditBook(bk as EBook);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                                title="Edit & Kemas Kini Maklumat Naskhah"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                <span>Edit</span>
                              </button>
                            )}

                          {onDeleteBook && (
                            deletingBookId === bk.id ? (
                              <div className="flex items-center gap-1 animate-in fade-in">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteBook(bk.id);
                                    setDeletingBookId(null);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer active:scale-95 shadow-xs"
                                  title="Sahkan Padam Naskhah"
                                >
                                  Padamkan!
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingBookId(null)}
                                  className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingBookId(bk.id)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer active:scale-95"
                                title="Padam Naskhah"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-semibold text-xs transition cursor-pointer"
                          >
                            Lihat Katalog
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h6 className="font-bold text-slate-800 text-sm">
                        {!currentUserEmail
                          ? 'Sila Log Masuk untuk Paparan Naskhah Anda'
                          : 'Tiada Naskhah Diterbitkan Lagi'}
                      </h6>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        {!currentUserEmail
                          ? 'Log masuk ke akaun anda (contohnya Super Admin mykaryadigital@gmail.com atau Bang Karim) supaya senarai karya dan royalti anda dimuatkan serta-merta.'
                          : `Anda belum menerbitkan sebarang naskhah di bawah akaun (${currentUserEmail}). Naskhah yang anda terbitkan akan dipaparkan di sini untuk tujuan suntingan dan royalti.`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {!currentUserEmail && onOpenAuthModal && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenAuthModal();
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 active:scale-95"
                        >
                          <span>Log Masuk Akaun Sekarang</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTab('borang')}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5 active:scale-95 ${
                          !currentUserEmail
                            ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Terbit Naskhah Baharu Sekarang</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Panduan & Royalti Quick Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('panduan')}
                  className="p-3.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200 text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-indigo-900 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Panduan Penerbitan & Spesifikasi Cover
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] text-indigo-700/80">
                    Format nisbah 2:3, resolusi minimum, hak cipta Akta 1987 dan perlindungan DRM.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('royalti')}
                  className="p-3.5 rounded-xl bg-amber-50/70 hover:bg-amber-50 border border-amber-200 text-left transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-amber-950 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      Struktur Royalti 70% & Jadual Payout
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] text-amber-800/80">
                    Ketahui formula royalti bersih 70%, bayaran automatik FPX/DuitNow setiap bulan.
                  </p>
                </button>
              </div>
            </div>
          ) : activeTab === 'borang' ? (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Onboarding Banner for Non-Authors (Jadi Penulis Flow) */}
              {!isAuthor && (
                <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <PenTool className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-indigo-950">
                      Aliran Pendaftaran Penulis (Jadi Penulis)
                    </div>
                    <p className="text-[11px] text-indigo-700 leading-relaxed">
                      Lengkapkan butiran karya sulung dan akaun bank pembayaran anda di bawah. Setelah diterbitkan, akaun anda akan dinaik taraf secara automatik ke peranan <strong>Penulis Sah</strong> dengan akses penuh ke Dashboard Penulis dan royalti 70%.
                    </p>
                  </div>
                </div>
              )}
              {/* BAHAGIAN 1: COVER BUKU (MUKA DEPAN) DENGAN PRATONTON LANGSUNG */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Muka Depan Naskhah (Cover Buku) · Nisbah 2:3</span>
                  </label>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    Disyorkan: 600×900 px
                  </span>
                </div>

                {/* Sub-Tabs: Muat Naik / URL / Templat */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCoverMode('upload')}
                    className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      coverMode === 'upload'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Muat Naik Fail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverMode('url')}
                    className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      coverMode === 'url'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Pautan URL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverMode('theme')}
                    className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      coverMode === 'theme'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Templat Hardcover</span>
                  </button>
                </div>

                {/* Cover Input & Live 2:3 Preview Container */}
                <div className="flex flex-col sm:flex-row gap-4 items-start pt-1">
                  {/* Left: Input controls based on mode */}
                  <div className="flex-1 w-full space-y-2.5">
                    {coverMode === 'upload' && (
                      <div className="space-y-2">
                        <label
                          htmlFor="cover-file-upload"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl bg-white hover:bg-indigo-50/30 transition-colors cursor-pointer text-center group"
                        >
                          <UploadCloud className="w-7 h-7 text-indigo-500 group-hover:scale-110 transition-transform mb-1.5" />
                          <span className="text-xs font-bold text-slate-800">
                            Klik atau seret fail imej ke sini
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            Menyokong JPG, PNG, WEBP (Maksimum 5MB)
                          </span>
                          <input
                            ref={fileInputRef}
                            id="cover-file-upload"
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>

                        {coverImagePreview && (
                          <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            <span className="flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Imej dipilih
                            </span>
                            <button
                              type="button"
                              onClick={handleClearCover}
                              className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Buang
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {coverMode === 'url' && (
                      <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Masukkan URL Imej Muka Depan (Direct Image Link)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={coverUrlInput}
                            onChange={(e) => setCoverUrlInput(e.target.value)}
                            placeholder="https://example.com/cover-buku.jpg"
                            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-indigo-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleApplyUrl}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Guna URL
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Pastikan pautan boleh diakses secara umum dan berformat imej.
                        </p>
                      </div>
                    )}

                    {coverMode === 'theme' && (
                      <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Pilih Skema Warna Hardcover Automatik
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {HARDCOVER_THEMES.map((th) => (
                            <button
                              type="button"
                              key={th.id}
                              onClick={() => {
                                setSelectedTheme(th);
                                setCoverImagePreview(null);
                              }}
                              className={`p-2 rounded-lg text-left border flex items-center gap-2 transition cursor-pointer ${
                                selectedTheme.id === th.id && !coverImagePreview
                                  ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50/50'
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full bg-gradient-to-br ${th.gradient} shrink-0`}
                              ></span>
                              <span className="text-[11px] font-semibold text-slate-800 truncate">
                                {th.name}
                              </span>
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Sistem akan memaparkan tajuk, genre, dan nama penulis secara kemas di atas latar hardcover pilihan ini.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Live 2:3 Cover Preview Card */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-indigo-600" />
                      Pratonton 2:3
                    </div>
                    <div className="w-24 sm:w-28 aspect-[2/3] rounded-lg overflow-hidden shadow-md border border-slate-300 relative bg-slate-900">
                      {coverImagePreview ? (
                        <img
                          src={coverImagePreview}
                          alt="Pratonton Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-br ${selectedTheme.gradient} border-l-4 ${selectedTheme.border} p-2 flex flex-col justify-between text-white text-center select-none`}
                        >
                          <div className="text-[7px] font-bold uppercase tracking-widest text-amber-400">
                            {category === 'komik' ? 'KOMIK' : 'NOVEL'}
                          </div>
                          <div className="space-y-0.5 my-auto">
                            <h5 className="font-serif-book font-bold text-[9px] line-clamp-3 leading-tight text-white">
                              {title || 'Tajuk Naskhah'}
                            </h5>
                            <p className="text-[7px] text-slate-400 line-clamp-1 italic">
                              {genre}
                            </p>
                          </div>
                          <div className="text-[7px] font-medium text-slate-300 truncate border-t border-white/10 pt-0.5">
                            {authorName || 'Nama Penulis'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* BAHAGIAN 2: BUTIRAN NASKHAH */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Tajuk Buku */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tajuk Naskhah / Karya *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Rahsia Kota Hang Tuah / Rentap: Pejuang Kenyalang"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                {/* Nama Penulis / Pena */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Penulis / Nama Pena *
                  </label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Nama anda atau nama pena"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                {/* Jenis Buku */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Format Karya *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BookCategory)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="novel">Novel Teks (ePub / Bacaan Pelayar)</option>
                    <option value="komik">Komik & Manga Grafik</option>
                  </select>
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Genre Tempatan *
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="Misteri & Thriller">Misteri & Thriller</option>
                    <option value="Seram & Kisah Mistik">Seram & Kisah Mistik</option>
                    <option value="Agama & Motivasi">Agama & Motivasi</option>
                    <option value="Romantik & Kehidupan">Romantik & Kehidupan</option>
                    <option value="Fantasi & Sejarah">Fantasi & Sejarah</option>
                    <option value="Aksi & Pengembaraan Nusantara">Aksi & Pengembaraan Nusantara</option>
                    <option value="Fiksyen Sains & Masa Depan">Fiksyen Sains & Masa Depan</option>
                    <option value="Komedi & Santai">Komedi & Santai</option>
                    <option value="Resipi & Warisan Masakan">Resipi & Warisan Masakan</option>
                  </select>
                </div>

                {/* Penetapan Harga */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Penetapan Harga (RM) *
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={pricingType}
                      onChange={(e) => setPricingType(e.target.value as any)}
                      className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-600 bg-white"
                    >
                      <option value="berbayar">Berbayar</option>
                      <option value="percuma">Percuma</option>
                    </select>

                    {pricingType === 'berbayar' && (
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">
                          RM
                        </span>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="99"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none font-bold"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {pricingType === 'berbayar'
                      ? 'Anda menerima 70% daripada harga jualan ini.'
                      : 'Naskhah percuma untuk membina asas pembaca peminat anda.'}
                  </p>
                </div>
              </div>

              {/* Sinopsis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sinopsis Naskhah *
                </label>
                <textarea
                  required
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Ringkasan jalan cerita untuk menarik minat pembaca di halaman katalog..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                ></textarea>
              </div>

              {/* Pilihan Naskhah Bersiri / Bersambung */}
              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-700" />
                    <div>
                      <span className="text-xs font-bold text-purple-950 block">
                        Adakah ini naskhah bersiri / bersambung?
                      </span>
                      <span className="text-[10px] text-purple-700">
                        Untuk novel episodik, webtoon/komik bersambung, atau siri antologi
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSeries}
                      onChange={(e) => setIsSeries(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {isSeries && (
                  <div className="pt-3 border-t border-purple-200/70 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
                    <div>
                      <label className="text-[11px] font-bold text-purple-950 block mb-1">
                        Nama Siri / Koleksi *
                      </label>
                      <input
                        type="text"
                        value={seriesName}
                        onChange={(e) => setSeriesName(e.target.value)}
                        placeholder="cth: Saga Alam Satria"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-purple-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-purple-950 block mb-1">
                        Nombor Jilid / Episod
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={seriesOrder}
                        onChange={(e) => setSeriesOrder(parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-purple-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-purple-950 block mb-1">
                        Status Naskhah
                      </label>
                      <select
                        value={seriesStatus}
                        onChange={(e) => setSeriesStatus(e.target.value as 'ongoing' | 'completed')}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-purple-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-600 font-medium"
                      >
                        <option value="ongoing">Sedang Bersambung (Ongoing)</option>
                        <option value="completed">Tamat (Completed)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* BAHAGIAN 3: MUAT NAIK FAIL MANUSKRIP DIGITAL (.EPUB / .PDF) */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileUp className="w-4 h-4 text-indigo-600" />
                    <span>Muat Naik Manuskrip Digital (.EPUB atau .PDF)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                      .EPUB (Disyorkan)
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                      .PDF
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong>Muat naik fail .EPUB secara terus:</strong> Sistem akan mengekstrak tajuk, senarai bab, dan keseluruhan teks perenggan secara automatik untuk pembaca e-buku selamat. Anda juga boleh memuat naik dokumen .PDF lengkap.
                </p>

                {/* Hidden input for EPUB & PDF */}
                <input
                  ref={manuscriptInputRef}
                  type="file"
                  accept=".epub,.pdf,application/epub+zip,application/pdf"
                  onChange={handleManuscriptChange}
                  className="hidden"
                  id="manuscript-upload-input"
                />

                {isParsingEpub && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center space-y-2 animate-pulse">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-bold text-blue-900">
                      Sedang Menghurai Fail EPUB...
                    </p>
                    <p className="text-[10px] text-blue-700">
                      Mengekstrak susunan bab dan perenggan teks untuk pembaca responsif.
                    </p>
                  </div>
                )}

                {!manuscriptFile && !isParsingEpub ? (
                  <div
                    onClick={() => manuscriptInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/70 rounded-xl p-4 text-center cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-2 transition-colors shadow-2xs">
                      <FileUp className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      Klik untuk Pilih Fail .EPUB atau .PDF dari Peranti Anda
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Menyokong fail e-buku .EPUB (Word/Sigil/Atticus) dan dokumen .PDF sehingga 80MB
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          manuscriptInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer active:scale-95"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        <span>Pilih Fail EPUB / PDF</span>
                      </button>
                    </div>
                  </div>
                ) : manuscriptFile ? (
                  <div className="p-3.5 bg-white rounded-xl border border-indigo-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-10 h-11 rounded-lg text-white flex flex-col items-center justify-center font-black text-[9px] shrink-0 shadow-2xs ${
                            manuscriptFile.format === 'epub' ? 'bg-blue-600' : 'bg-rose-600'
                          }`}
                        >
                          <span>{manuscriptFile.format.toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate" title={manuscriptFile.name}>
                            {manuscriptFile.name}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-semibold text-indigo-600">{manuscriptFile.size}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              {manuscriptFile.format === 'epub'
                                ? `EPUB Berjaya Dihurai (${manuscriptFile.chaptersCount || 0} Bab)`
                                : 'Dokumen PDF Sedia Diterbitkan'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => manuscriptInputRef.current?.click()}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        >
                          Tukar Fail
                        </button>
                        <button
                          type="button"
                          onClick={handleClearManuscript}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Padam fail ini"
                          aria-label="Padam Fail"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {manuscriptFile.format === 'epub' && parsedEpubChapters && parsedEpubChapters.length > 0 && (
                      <div className="p-2.5 bg-blue-50/80 rounded-lg border border-blue-200 text-[11px] text-blue-900 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>
                            {parsedEpubChapters.length} bab ({manuscriptFile.paragraphsCount} perenggan) diekstrak terus ke mod pembaca selamat.
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 underline">
                          Automatik
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Teks Sampel / Bab 1 */}
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Bab 1 / Sampel Bacaan Segera</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Sedia dibaca pembaca dalam pelayar
                  </span>
                </div>
                <input
                  type="text"
                  value={sampleChapterTitle}
                  onChange={(e) => setSampleChapterTitle(e.target.value)}
                  placeholder="Tajuk Bab 1"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:border-indigo-600 focus:outline-none mb-1.5"
                />
                <textarea
                  rows={4}
                  value={sampleContent}
                  onChange={(e) => setSampleContent(e.target.value)}
                  placeholder="Tampal perenggan Bab 1 karya anda di sini..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-indigo-600 focus:outline-none font-serif-book leading-relaxed"
                ></textarea>
              </div>

              {/* Maklumat Akaun Bank (Untuk Pindahan Royalti 70%) */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Maklumat Akaun Bank Royalti (FPX / DuitNow)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Nama Bank Tempatan
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Maybank">Maybank (Malayan Banking)</option>
                      <option value="CIMB">CIMB Bank</option>
                      <option value="Bank Islam">Bank Islam Malaysia</option>
                      <option value="Public Bank">Public Bank</option>
                      <option value="RHB Bank">RHB Bank</option>
                      <option value="Hong Leong Bank">Hong Leong Bank</option>
                      <option value="Bank Muamalat">Bank Muamalat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Nombor Akaun Bank
                    </label>
                    <input
                      type="text"
                      placeholder="Cth: 164258901234"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-indigo-700">
                  Royalti 70% dikira secara masa nyata bagi setiap transaksi dan dipindahkan terus ke akaun bank anda setiap 1 haribulan.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Dilindungi Akta Hak Cipta 1987 & DRM Cloudflare</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memproses Naskhah...' : 'Terbitkan Naskhah Sekarang'}</span>
                </button>
              </div>
            </form>
          ) : activeTab === 'royalti' ? (
            /* Maklumat Royalti (70%) Tab */
            <div className="space-y-6 text-xs animate-in fade-in duration-200">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-indigo-600/10 to-slate-900/5 border border-amber-200 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <DollarSign className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      Maklumat & Struktur Royalti 70% Penulis
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      KaryaDigital menjamin pulangan royalti bersih digital tertinggi di Malaysia tanpa yuran terselindung.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Tonggak Royalti */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-indigo-600 font-extrabold text-xs flex items-center gap-1.5">
                    <Coins className="w-4 h-4" />
                    <span>70% Royalti Bersih</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Bagi setiap jualan naskhah berharga RM 20.00, anda menerima <strong>RM 14.00 bersih</strong>. Tiada potongan kos kertas, percetakan atau pengedaran kedai fizikal.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-emerald-600 font-extrabold text-xs flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Payout Bulanan Automatik</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Royalti dipindahkan setiap <strong>5 haribulan</strong> terus ke akaun bank tempatan (Maybank, CIMB, Bank Islam, dsb.) melalui rangkaian selamat DuitNow / FPX.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-amber-600 font-extrabold text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Hak Cipta Terpelihara 100%</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Karya kekal milik anda di bawah <strong>Akta Hak Cipta 1987 Malaysia</strong>. Tiada klausa monopoli atau ikatan eksklusif yang menyekat anda.
                  </p>
                </div>
              </div>

              {/* Jadual Perbandingan Terperinci */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-900 text-white font-bold px-4 py-2 text-xs flex items-center justify-between">
                  <span>Perbandingan Model Royalti: KaryaDigital vs Penerbit Tradisional</span>
                  <span className="text-[10px] text-amber-300 font-normal">Kadar Pasaran 2026</span>
                </div>
                <div className="divide-y divide-slate-200 text-[11px]">
                  <div className="grid grid-cols-3 p-3 bg-slate-100/80 font-bold text-slate-800">
                    <div>Ciri & Manfaat</div>
                    <div className="text-indigo-700 font-black">KaryaDigital (Digital Direct)</div>
                    <div className="text-slate-500">Penerbit Cetak Tradisional</div>
                  </div>
                  <div className="grid grid-cols-3 p-3 items-center">
                    <span className="font-semibold text-slate-700">Kadar Royalti Bersih</span>
                    <span className="font-bold text-emerald-600">70% Daripada Setiap Naskhah</span>
                    <span className="text-slate-500">8% - 15% Sahaja</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 items-center">
                    <span className="font-semibold text-slate-700">Yuran Pendaftaran / Listing</span>
                    <span className="font-bold text-emerald-600">RM 0 (Percuma Sepenuhnya)</span>
                    <span className="text-slate-500">Kos Cetakan / Modal Sendiri</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 items-center">
                    <span className="font-semibold text-slate-700">Tempoh Pembayaran</span>
                    <span className="font-bold text-slate-900">Setiap Bulan (5hb)</span>
                    <span className="text-slate-500">6 Bulan atau 1 Tahun Sekali</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 items-center">
                    <span className="font-semibold text-slate-700">Masa ke Pasaran</span>
                    <span className="font-bold text-slate-900">Serta-merta (Minit ke Jam)</span>
                    <span className="text-slate-500">6 hingga 18 Bulan</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 items-center">
                    <span className="font-semibold text-slate-700">Perlindungan Manuskrip</span>
                    <span className="font-bold text-slate-900">Cloudflare R2 + DRM Enkripsi</span>
                    <span className="text-slate-500">Risiko Cetak Rompak Fizikal</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('borang')}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>{isAuthor ? 'Terbitkan Naskhah Baharu Sekarang →' : 'Daftar Sebagai Penulis & Terbitkan Karya →'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Panduan Penerbitan & Spesifikasi Cover Tab */
            <div className="space-y-5 text-xs animate-in fade-in duration-200">
              {/* Panduan Khusus Cover Buku */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <ImageIcon className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-indigo-950 text-sm">
                      Panduan Spesifikasi Cover Buku (Muka Depan)
                    </h4>
                    <p className="text-[11px] text-indigo-700">
                      Bagaimana cara menyediakan muka depan terbaik untuk karya anda:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-indigo-100 space-y-1">
                    <div className="text-indigo-900 font-bold text-[11px]">1. Nisbah Aspek 2:3</div>
                    <p className="text-slate-600 text-[10px] leading-relaxed">
                      Nisbah standard buku antarabangsa (2 lebar : 3 tinggi), cth: 600×900 px atau 1200×1800 px.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-indigo-100 space-y-1">
                    <div className="text-indigo-900 font-bold text-[11px]">2. Format & Saiz Fail</div>
                    <p className="text-slate-600 text-[10px] leading-relaxed">
                      Format disokong adalah JPEG, PNG, dan WEBP dengan saiz fail di bawah 5MB untuk pemuatan pantas.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-indigo-100 space-y-1">
                    <div className="text-indigo-900 font-bold text-[11px]">3. Tipografi Jelas</div>
                    <p className="text-slate-600 text-[10px] leading-relaxed">
                      Pastikan tajuk buku dan nama pena kelihatan jelas pada skrin kecil telefon pintar.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-indigo-900 leading-relaxed pt-1">
                  <strong>Nota Praktikal:</strong> Jika anda belum mempunyai fail grafik imej, anda boleh memilih tab <em>"Templat Hardcover"</em> dalam borang. Sistem akan menjana cover hardcover klasik secara automatik berpandukan tajuk dan genre anda!
                </p>
              </div>

              {/* 3 Kelebihan Utama */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-indigo-600 font-bold flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>70% Royalti Bersih</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Lebih tinggi berbanding penerbit tradisional (10-15%). Tiada potongan kos cetakan.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-indigo-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Hak Cipta 100% Milik Anda</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Penulis mengekalkan hak cipta penuh. Tiada kontrak eksklusif yang menyekat kebebasan anda.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-indigo-600 font-bold flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Perlindungan DRM Digital</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Naskhah disulitkan dalam pelayar. Salinan teks, muat turun PDF dan cetakan disekat secara automatik.
                  </p>
                </div>
              </div>

              {/* Langkah Penerbitan */}
              <div className="space-y-2 pt-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  Langkah Mudah Menulis & Menerbitkan Karya:
                </h4>
                <div className="space-y-2 text-slate-600">
                  <div className="flex gap-2.5 items-start p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900">Sediakan Manuskrip & Muka Depan (Cover):</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Sediakan imej muka depan (nisbah 2:3) atau gunakan templat hardcover automatik platform.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900">Isi Borang Terbit Karya:</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Muat naik cover, masukkan tajuk, nama pena, genre, sinopsis, dan teks bab sampel Bab 1.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900">Tetapkan Harga & Akaun Bank:</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tetapkan harga jualan yang anda mahukan (cth RM 10.00 – RM 25.00) atau percuma. Masukkan akaun bank untuk menerima pembayaran jualan.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <strong className="text-slate-900">Terbit Serta-Merta & Semak Pembaca Pelayar:</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tekan butang terbit! Naskhah anda serta-merta muncul di katalog untuk dibaca sampel dan dibeli pembaca di seluruh Malaysia.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('borang')}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  {isAuthor ? 'Terbitkan Naskhah Baharu Sekarang →' : 'Mula Terbitkan Karya Anda Sekarang →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
