import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { EBook, BookCategory } from '../types/ebook.ts';

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
    }
  }, [book]);

  if (!isOpen || !book) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Sila masukkan tajuk naskhah.');
      return;
    }

    setIsSaving(true);
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
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/40 text-indigo-300 flex items-center justify-center font-bold border border-indigo-400/30">
              <BookOpen className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Kemas Kini Butiran Naskhah
              </h3>
              <p className="text-xs text-indigo-300">
                ID Naskhah: <span className="font-mono font-semibold">{book.id}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs sm:text-sm text-slate-900"
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

          {/* Bilangan Halaman, Anggaran Masa Baca, Penerbit */}
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
            <input
              type="url"
              value={coverImage || ''}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900"
              placeholder="https://images.unsplash.com/... (atau tinggalkan kosong untuk templat warna)"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
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
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
