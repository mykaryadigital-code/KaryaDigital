import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  BookOpen,
  DollarSign,
  Tag,
  User,
  FileText,
  Sparkles,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Plus,
  Layers,
  Upload,
  FileUp,
  Bookmark,
  Calendar,
  Info,
} from 'lucide-react';
import { EBook, BookCategory, Chapter } from '../types/ebook.ts';

interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: EBook | null;
  onSave: (updatedBook: EBook) => void;
  onDelete?: (bookId: string) => void;
}

const GENRES = [
  'Semua Genre',
  'Resipi & Kulinari',
  'Keluarga & Emosi',
  'Misteri & Seram',
  'Teknologi & Fiksyen',
  'Sejarah & Warisan',
  'Pengembaraan',
  'Romantik',
  'Komik & Grafik',
  'Sains Fiksyen',
  'Panduan & Inspirasi',
];

export const EditBookModal: React.FC<EditBookModalProps> = ({
  isOpen,
  onClose,
  book,
  onSave,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'series'>('basic');

  // Maklumat Asas
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<BookCategory>('novel');
  const [genre, setGenre] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [isFree, setIsFree] = useState(false);
  const [synopsis, setSynopsis] = useState('');
  const [pages, setPages] = useState<number>(100);
  const [readTime, setReadTime] = useState('2 jam');
  const [publisher, setPublisher] = useState('');
  const [isbn, setIsbn] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [coverGradient, setCoverGradient] = useState('from-indigo-950 via-slate-900 to-indigo-900');
  const [coverAccent, setCoverAccent] = useState('#818cf8');
  const [coverBadge, setCoverBadge] = useState<string | undefined>(undefined);

  // Kandungan / Bab
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
  const [chapterTitleInput, setChapterTitleInput] = useState('');
  const [chapterSubtitleInput, setChapterSubtitleInput] = useState('');
  const [chapterContentInput, setChapterContentInput] = useState('');

  // PDF
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [pdfFileName, setPdfFileName] = useState<string | undefined>(undefined);
  const [pdfFileSize, setPdfFileSize] = useState<string | undefined>(undefined);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Siri & Bersambung
  const [isSeries, setIsSeries] = useState(false);
  const [seriesName, setSeriesName] = useState('');
  const [seriesOrder, setSeriesOrder] = useState<number>(1);
  const [seriesStatus, setSeriesStatus] = useState<'ongoing' | 'completed'>('ongoing');
  const [seriesUpdateSchedule, setSeriesUpdateSchedule] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (book) {
      setTitle(book.title || '');
      setAuthor(book.author || '');
      setCategory(book.category || 'novel');
      setGenre(book.genre || 'Pengembaraan');
      setPrice(book.price || 0);
      setIsFree(Boolean(book.isFree || book.price === 0));
      setSynopsis(book.synopsis || '');
      setPages(book.pages || 120);
      setReadTime(book.readTime || '2 jam');
      setPublisher(book.publisher || 'Penerbitan KaryaDigital');
      setIsbn(book.isbn || '');
      setCoverImage(book.coverImage);
      setCoverGradient(book.coverGradient || 'from-indigo-950 via-slate-900 to-indigo-900');
      setCoverAccent(book.coverAccent || '#818cf8');
      setCoverBadge(book.coverBadge);

      // Chapters
      const existingChapters = book.sampleContent?.chapters && book.sampleContent.chapters.length > 0
        ? JSON.parse(JSON.stringify(book.sampleContent.chapters))
        : [
            {
              id: 1,
              title: 'Bab 1: Permulaan',
              subtitle: 'Pengenalan Kisah',
              paragraphs: ['Tuliskan perenggan pertama naskhah anda di sini...'],
            },
          ];
      setChapters(existingChapters);
      setSelectedChapterIndex(0);
      if (existingChapters.length > 0) {
        setChapterTitleInput(existingChapters[0].title || '');
        setChapterSubtitleInput(existingChapters[0].subtitle || '');
        setChapterContentInput((existingChapters[0].paragraphs || []).join('\n\n'));
      }

      // PDF
      setPdfUrl(book.pdfUrl);
      setPdfFileName(book.pdfFileName);
      setPdfFileSize(book.pdfFileSize);

      // Siri
      setIsSeries(Boolean(book.isSeries));
      setSeriesName(book.seriesName || '');
      setSeriesOrder(book.seriesOrder || 1);
      setSeriesStatus(book.seriesStatus || 'ongoing');
      setSeriesUpdateSchedule(book.seriesUpdateSchedule || '');
      setActiveTab('basic');
    }
  }, [book]);

  if (!isOpen || !book) return null;

  // Sync current chapter changes before switching or saving
  const syncCurrentChapter = (idx: number, updatedTitle: string, updatedSub: string, updatedText: string) => {
    setChapters((prev) => {
      const copy = [...prev];
      if (copy[idx]) {
        const paragraphs = updatedText
          .split('\n\n')
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
        copy[idx] = {
          ...copy[idx],
          title: updatedTitle.trim() || `Bab ${idx + 1}`,
          subtitle: updatedSub.trim() || undefined,
          paragraphs: paragraphs.length > 0 ? paragraphs : ['(Perenggan kosong)'],
        };
      }
      return copy;
    });
  };

  const handleSelectChapter = (newIndex: number) => {
    // Save current active chapter text first
    syncCurrentChapter(selectedChapterIndex, chapterTitleInput, chapterSubtitleInput, chapterContentInput);

    // Switch to new index
    setSelectedChapterIndex(newIndex);
    const target = chapters[newIndex];
    if (target) {
      setChapterTitleInput(target.title || '');
      setChapterSubtitleInput(target.subtitle || '');
      setChapterContentInput((target.paragraphs || []).join('\n\n'));
    }
  };

  const handleAddChapter = () => {
    // First save current chapter
    syncCurrentChapter(selectedChapterIndex, chapterTitleInput, chapterSubtitleInput, chapterContentInput);

    const nextId = chapters.length + 1;
    const newChapter: Chapter = {
      id: nextId,
      title: `Bab ${nextId}: Sambungan Kisah`,
      subtitle: isSeries ? 'Episod Terkini' : undefined,
      paragraphs: ['Mulakan penulisan perenggan untuk bab baharu ini di sini...'],
    };

    const newChapters = [...chapters, newChapter];
    setChapters(newChapters);
    setSelectedChapterIndex(newChapters.length - 1);
    setChapterTitleInput(newChapter.title);
    setChapterSubtitleInput(newChapter.subtitle || '');
    setChapterContentInput(newChapter.paragraphs.join('\n\n'));
  };

  const handleDeleteChapter = (idxToDelete: number) => {
    if (chapters.length <= 1) {
      alert('Naskhah mesti mempunyai sekurang-kurangnya 1 bab kandungan.');
      return;
    }
    if (window.confirm(`Adakah anda pasti ingin memadam ${chapters[idxToDelete]?.title || 'bab ini'}?`)) {
      const filtered = chapters.filter((_, i) => i !== idxToDelete);
      setChapters(filtered);
      const newIdx = Math.max(0, idxToDelete - 1);
      setSelectedChapterIndex(newIdx);
      if (filtered[newIdx]) {
        setChapterTitleInput(filtered[newIdx].title);
        setChapterSubtitleInput(filtered[newIdx].subtitle || '');
        setChapterContentInput((filtered[newIdx].paragraphs || []).join('\n\n'));
      }
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Sila pilih fail PDF yang sah.');
      return;
    }

    const fileSizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPdfUrl(reader.result);
        setPdfFileName(file.name);
        setPdfFileSize(fileSizeStr);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Sila masukkan tajuk naskhah.');
      return;
    }

    setIsSaving(true);

    // Final sync for currently active chapter
    const currentParagraphs = chapterContentInput
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const finalChapters = [...chapters];
    if (finalChapters[selectedChapterIndex]) {
      finalChapters[selectedChapterIndex] = {
        ...finalChapters[selectedChapterIndex],
        title: chapterTitleInput.trim() || `Bab ${selectedChapterIndex + 1}`,
        subtitle: chapterSubtitleInput.trim() || undefined,
        paragraphs: currentParagraphs.length > 0 ? currentParagraphs : ['(Perenggan kosong)'],
      };
    }

    const updatedBook: EBook = {
      ...book,
      title: title.trim(),
      author: author.trim() || 'Penulis KaryaDigital',
      category,
      genre: genre.trim() || 'Umum',
      price: isFree ? 0 : Number(price),
      isFree,
      synopsis: synopsis.trim(),
      pages: Number(pages) || 100,
      readTime: readTime.trim() || '2 jam',
      publisher: publisher.trim() || 'Penerbitan Bebas',
      isbn: isbn.trim() || book.isbn,
      coverImage: coverImage?.trim() || undefined,
      coverGradient,
      coverAccent,
      coverBadge: coverBadge?.trim() || undefined,
      // Kandungan & PDF
      sampleContent: {
        chapters: finalChapters,
      },
      pdfUrl: pdfUrl || undefined,
      pdfFileName: pdfFileName || undefined,
      pdfFileSize: pdfFileSize || undefined,
      // Siri & Episod
      isSeries,
      seriesName: isSeries ? seriesName.trim() || undefined : undefined,
      seriesOrder: isSeries ? Number(seriesOrder) || 1 : undefined,
      seriesStatus: isSeries ? seriesStatus : undefined,
      seriesUpdateSchedule: isSeries ? seriesUpdateSchedule.trim() || undefined : undefined,
    };

    onSave(updatedBook);
    setIsSaving(false);
    onClose();
  };

  const handleDeleteClick = () => {
    if (
      window.confirm(
        `Adakah anda pasti ingin memadam naskhah "${book.title}"?\n\nTindakan ini akan memadam naskhah ini daripada katalog jualan platform KaryaDigital.`
      )
    ) {
      if (onDelete) {
        onDelete(book.id);
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/40 text-indigo-300 flex items-center justify-center font-bold border border-indigo-400/30">
              <BookOpen className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Sunting & Kemas Kini Naskhah
              </h3>
              <p className="text-xs text-indigo-300">
                Tajuk Asal: <span className="font-semibold text-white">{book.title}</span> • ID: <span className="font-mono">{book.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'basic'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-t-lg'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Maklumat Asas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              // Sync current chapter changes
              syncCurrentChapter(selectedChapterIndex, chapterTitleInput, chapterSubtitleInput, chapterContentInput);
              setActiveTab('content');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'content'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-t-lg'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Isi Kandungan & Bab ({chapters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              syncCurrentChapter(selectedChapterIndex, chapterTitleInput, chapterSubtitleInput, chapterContentInput);
              setActiveTab('series');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'series'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-t-lg'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Siri & Bersambung</span>
            {isSeries && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* ================= TAB 1: MAKLUMAT ASAS ================= */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Tajuk & Pengarang */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Tajuk Naskhah *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs sm:text-sm text-slate-900 font-semibold"
                    placeholder="cth: Resipi Kasih Mak Tok"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Nama Pengarang / Penulis *
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs sm:text-sm text-slate-900"
                    placeholder="cth: Hajah Halimah"
                  />
                </div>
              </div>

              {/* Kategori, Genre & Harga */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Format / Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BookCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-semibold text-slate-800 bg-white"
                  >
                    <option value="novel">E-Buku Teks (Novel / Panduan)</option>
                    <option value="komik">Komik & Grafik Visual</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-semibold text-slate-800 bg-white"
                  >
                    {GENRES.filter((g) => g !== 'Semua Genre').map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Harga Jualan (RM)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">
                      RM
                    </span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      disabled={isFree}
                      value={isFree ? 0 : price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      className={`w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs sm:text-sm font-bold ${
                        isFree ? 'bg-slate-100 text-slate-400' : 'text-slate-900 bg-white'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Pilihan Percuma */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFreeCheckbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="isFreeCheckbox" className="text-xs font-bold text-indigo-950 cursor-pointer">
                    Tawarkan Sebagai Naskhah Percuma (RM 0.00)
                  </label>
                </div>
                {isFree && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Akses Percuma Kepada Semua Pembaca
                  </span>
                )}
              </div>

              {/* Sinopsis */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Sinopsis & Penerangan Karya
                </label>
                <textarea
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 leading-relaxed"
                  placeholder="Tuliskan sinopsis ringkas untuk menarik minat pembeli..."
                />
              </div>

              {/* Bilangan Halaman, Anggaran Masa Baca, Lencana */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Jumlah Halaman
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={pages}
                    onChange={(e) => setPages(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Anggaran Masa Baca
                  </label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900"
                    placeholder="cth: 3 jam 30 minit"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Lencana Promosi (Pilihan)
                  </label>
                  <input
                    type="text"
                    value={coverBadge || ''}
                    onChange={(e) => setCoverBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900"
                    placeholder="cth: Terlaris / Pilihan Editor"
                  />
                </div>
              </div>

              {/* URL Muka Depan */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  URL Imej Muka Depan (Cover Image)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={coverImage || ''}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900"
                    placeholder="https://images.unsplash.com/... (atau pautan imej luar)"
                  />
                  {coverImage && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                      <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: ISI KANDUNGAN & BAB ================= */}
          {activeTab === 'content' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 space-y-1">
                  <p className="font-bold">
                    Pusat Suntingan Teks & Manuskrip Naskhah
                  </p>
                  <p className="leading-relaxed text-indigo-900">
                    Anda boleh menyunting teks bab sedia ada, menambah bab/episod baharu, atau memuat naik fail PDF terkini. Pembaca yang telah membeli naskhah ini akan menikmati bab baharu secara serta-merta!
                  </p>
                </div>
              </div>

              {/* Fail PDF Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Fail PDF Manuskrip Naskhah (Pilihan)
                    </span>
                  </div>
                  {pdfUrl ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Tersedia: {pdfFileName || 'Fail PDF Aktif'} ({pdfFileSize || ''})
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500">
                      Tiada fail PDF (Menggunakan mod pembaca teks bab)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileUp className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{pdfUrl ? 'Gantikan Fail PDF' : 'Muat Naik Fail PDF'}</span>
                  </button>

                  {pdfUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPdfUrl(undefined);
                        setPdfFileName(undefined);
                        setPdfFileSize(undefined);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer"
                    >
                      Padam Fail PDF (Guna Teks Sahaja)
                    </button>
                  )}
                </div>
              </div>

              {/* Senarai & Penyunting Bab */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Senarai Bab / Episod Teks ({chapters.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddChapter}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Bab Baharu</span>
                  </button>
                </div>

                {/* Chapter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {chapters.map((chap, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectChapter(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border ${
                        selectedChapterIndex === idx
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{chap.title || `Bab ${idx + 1}`}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                          selectedChapterIndex === idx ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {chap.paragraphs?.length || 0} p
                      </span>
                    </button>
                  ))}
                </div>

                {/* Chapter Editor Box */}
                <div className="p-4 bg-white border border-slate-300 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {selectedChapterIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        Menyunting Bab {selectedChapterIndex + 1}
                      </span>
                    </div>

                    {chapters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteChapter(selectedChapterIndex)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Padam Bab Ini</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Tajuk Bab *
                      </label>
                      <input
                        type="text"
                        value={chapterTitleInput}
                        onChange={(e) => {
                          setChapterTitleInput(e.target.value);
                          syncCurrentChapter(selectedChapterIndex, e.target.value, chapterSubtitleInput, chapterContentInput);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 font-bold"
                        placeholder="cth: Bab 2: Pertemuan Di Lembah"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Sub-tajuk / Nota Episod (Pilihan)
                      </label>
                      <input
                        type="text"
                        value={chapterSubtitleInput}
                        onChange={(e) => {
                          setChapterSubtitleInput(e.target.value);
                          syncCurrentChapter(selectedChapterIndex, chapterTitleInput, e.target.value, chapterContentInput);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900"
                        placeholder="cth: Bahagian I • Menguak Misteri"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Isi Teks Kandungan Bab
                      </label>
                      <span className="text-[10px] text-slate-500">
                        (Pisahkan perenggan dengan menekan 'Enter' dua kali)
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      value={chapterContentInput}
                      onChange={(e) => {
                        setChapterContentInput(e.target.value);
                        syncCurrentChapter(selectedChapterIndex, chapterTitleInput, chapterSubtitleInput, e.target.value);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 leading-relaxed font-serif-book"
                      placeholder="Taipkan atau tampal (paste) perenggan manuskrip bab di sini..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: SIRI & BERSAMBUNG ================= */}
          {activeTab === 'series' && (
            <div className="space-y-5">
              <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3">
                <Layers className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-950 space-y-1">
                  <p className="font-bold text-sm">
                    Pengurusan Naskhah Bersiri & Bersambung (Ongoing)
                  </p>
                  <p className="leading-relaxed text-purple-900">
                    Sesuai untuk novel bersiri, webnovel episodik, komik bersambung, atau siri antologi. Pembaca boleh melihat jilid/episod dan status naskhah sama ada masih berjalan atau telah lengkap!
                  </p>
                </div>
              </div>

              {/* Toggle Naskhah Bersiri */}
              <div className="p-4 bg-white border border-slate-300 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Tetapkan Sebagai Naskhah Bersiri
                    </h4>
                    <p className="text-xs text-slate-500">
                      Tandakan jika karya ini mempunyai sambungan (Jilid 1, Jilid 2) atau episod bersiri.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSeries}
                      onChange={(e) => setIsSeries(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {isSeries && (
                  <div className="pt-4 border-t border-slate-200 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Nama Siri / Koleksi Induk *
                        </label>
                        <input
                          type="text"
                          value={seriesName}
                          onChange={(e) => setSeriesName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs sm:text-sm text-slate-900 font-semibold"
                          placeholder="cth: Saga Alam Satria"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Semua jilid di bawah siri yang sama perlu menggunakan nama ini.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Nombor Jilid / Episod *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-500">
                            Jilid
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={seriesOrder}
                            onChange={(e) => setSeriesOrder(parseInt(e.target.value) || 1)}
                            className="w-full pl-14 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs sm:text-sm text-slate-900 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status Siri */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-2">
                        Status Penerbitan Siri *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label
                          className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                            seriesStatus === 'ongoing'
                              ? 'border-purple-600 bg-purple-50/70 text-purple-950'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="seriesStatus"
                            value="ongoing"
                            checked={seriesStatus === 'ongoing'}
                            onChange={() => setSeriesStatus('ongoing')}
                            className="mt-1 text-purple-600 focus:ring-purple-500"
                          />
                          <div>
                            <div className="text-xs font-black flex items-center gap-1.5">
                              <span>Sedang Bersambung (Ongoing)</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              Bab atau episod baharu akan diterbitkan secara berkala. Pembeli sedia ada akan dapat membaca bab baharu secara percuma.
                            </p>
                          </div>
                        </label>

                        <label
                          className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition ${
                            seriesStatus === 'completed'
                              ? 'border-purple-600 bg-purple-50/70 text-purple-950'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="seriesStatus"
                            value="completed"
                            checked={seriesStatus === 'completed'}
                            onChange={() => setSeriesStatus('completed')}
                            className="mt-1 text-purple-600 focus:ring-purple-500"
                          />
                          <div>
                            <div className="text-xs font-black flex items-center gap-1.5">
                              <span>Tamat (Completed)</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              Siri atau jilid ini telah tamat sepenuhnya tanpa sambungan bab baharu lagi.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Jadual Kemas Kini */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Nota Kemas Kini / Jadual (Pilihan)
                      </label>
                      <input
                        type="text"
                        value={seriesUpdateSchedule}
                        onChange={(e) => setSeriesUpdateSchedule(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs text-slate-900"
                        placeholder="cth: Bab baharu setiap hari Jumaat • Jilid 2 akan diterbitkan Oktober 2026"
                      />
                    </div>

                    {/* Penerangan Panduan */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px] text-slate-700">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Dua Cara Menguruskan Karya Bersiri di KaryaDigital:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                        <li>
                          <strong>Kaedah 1 (Satu Naskhah Bersambung):</strong> Anda mengekalkan satu naskhah ini, dan setiap minggu/bulan anda cuma tekan tab <em>"Isi Kandungan & Bab"</em> dan tekan <em>"+ Tambah Bab Baharu"</em>. Pembeli lama tidak perlu beli lagi, mereka dapat membaca bab baharu terus dari akaun mereka!
                        </li>
                        <li>
                          <strong>Kaedah 2 (Jilid Berasingan):</strong> Jika anda ingin menjual Jilid 2 sebagai naskhah baru (berbayar berasingan), terbitkan naskhah baharu dengan <em>Nama Siri</em> yang sama dan setkan <em>Nombor Jilid: 2</em>.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            {onDelete ? (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Padam Naskhah</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
