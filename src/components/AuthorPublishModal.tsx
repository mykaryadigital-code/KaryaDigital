import React, { useState } from 'react';
import {
  X,
  PenTool,
  BookOpen,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  FileText,
  UploadCloud,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { EBook, BookCategory } from '../types/ebook.ts';

interface AuthorPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishBook: (newBook: EBook) => void;
  currentUserName: string;
}

export const AuthorPublishModal: React.FC<AuthorPublishModalProps> = ({
  isOpen,
  onClose,
  onPublishBook,
  currentUserName,
}) => {
  const [activeTab, setActiveTab] = useState<'borang' | 'panduan'>('borang');

  // Form State
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState(currentUserName || 'Bang Karim');
  const [category, setCategory] = useState<BookCategory>('novel');
  const [genre, setGenre] = useState('Misteri & Thriller');
  const [pricingType, setPricingType] = useState<'berbayar' | 'percuma'>('berbayar');
  const [price, setPrice] = useState('15.00');
  const [synopsis, setSynopsis] = useState('');
  const [sampleChapterTitle, setSampleChapterTitle] = useState('Bab 1: Permulaan Kembara');
  const [sampleContent, setSampleContent] = useState('');
  const [bankName, setBankName] = useState('Maybank');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  // Submission State
  const [submittedBook, setSubmittedBook] = useState<EBook | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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
      author: authorName.trim() || 'Penulis Tempatan',
      category: category,
      genre: genre,
      synopsis: synopsis.trim(),
      rating: 5.0,
      reviewsCount: 1,
      price: parsedPrice,
      isFree: parsedPrice === 0,
      pages: 120,
      readTime: '3 jam',
      publisher: 'Penerbitan Bebas KaryaDigital',
      publicationYear: 2026,
      isbn: `978-967-KD${Math.floor(1000 + Math.random() * 9000)}-M`,
      coverGradient: 'from-slate-900 via-indigo-950 to-slate-950',
      coverAccent: '#818cf8',
      coverBadge: 'Karya Baharu',
      sampleContent: {
        chapters: [
          {
            id: 1,
            title: sampleChapterTitle.trim() || 'Bab 1',
            subtitle: 'Karya Asli Penulis',
            paragraphs: sampleParagraphs,
          },
        ],
      },
    };

    setTimeout(() => {
      onPublishBook(newBook);
      setSubmittedBook(newBook);
      setIsSubmitting(false);
    }, 600);
  };

  const handleReset = () => {
    setTitle('');
    setSynopsis('');
    setSampleContent('');
    setSubmittedBook(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Portal Penulis dan Penerbitan Karya"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            aria-label="Tutup portal penulis"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <PenTool className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Portal Penulis & Terbit Karya
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  70% Royalti
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Terbitkan novel teks atau komik anda terus kepada pembaca di seluruh Malaysia.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mt-5 border-b border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('borang')}
              className={`pb-2.5 transition-colors border-b-2 -mb-[2px] cursor-pointer ${
                activeTab === 'borang'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Hantar Naskhah Baharu
            </button>
            <button
              onClick={() => setActiveTab('panduan')}
              className={`pb-2.5 transition-colors border-b-2 -mb-[2px] cursor-pointer ${
                activeTab === 'panduan'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Panduan & Soalan Lazim Penulis
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

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Rujukan Manuskrip:</span>
                  <span className="font-mono font-bold text-slate-900">{submittedBook.isbn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Penulis:</span>
                  <span className="font-semibold text-slate-900">{submittedBook.author}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Format & Genre:</span>
                  <span className="font-semibold text-slate-900">{submittedBook.category === 'komik' ? 'Komik' : 'Novel'} · {submittedBook.genre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Harga:</span>
                  <span className="font-bold text-indigo-600">
                    {submittedBook.isFree ? 'Percuma' : `RM ${submittedBook.price.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kadar Royalti:</span>
                  <span className="font-bold text-emerald-600">70% ({bankName})</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
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
          ) : activeTab === 'borang' ? (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="pt-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Dilindungi Akta Hak Cipta 1987 & DRM Cloudflare</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memproses Naskhah...' : 'Terbitkan Naskhah Sekarang'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Information & FAQ Tab */
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-indigo-600 font-bold flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>70% Royalti Bersih</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Lebih tinggi berbanding penerbit tradisional (10-15%). Tiada bayaran cetakan fizikal.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-indigo-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Hak Cipta 100% Milik Anda</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Penulis mengekalkan hak cipta penuh. Tiada kontrak eksklusif yang mengikat kebebasan anda.
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
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  Bagaimana Cara Menulis & Memasukkan Karya Anda?
                </h4>
                <div className="space-y-2 text-slate-600">
                  <div className="flex gap-2.5 items-start p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900">Sediakan Manuskrip / Babak Komik:</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tulis karya anda dalam format teks (Word, Google Docs, atau Markdown) atau lukisan panel (PNG/JPEG) bagi komik.
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
                        Buka tab <em>"Hantar Naskhah Baharu"</em> di atas. Masukkan tajuk, nama pena, genre, sinopsis, dan teks bab sampel.
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
                        Tetapkan harga jualan yang anda mahukan (cth RM 10.00 – RM 25.00) atau percuma. Masukkan nombor akaun bank untuk menerima pembayaran jualan.
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
                  onClick={() => setActiveTab('borang')}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Mula Terbitkan Karya Anda Sekarang →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
