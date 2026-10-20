import React from 'react';
import { X, BookOpen, ShoppingCart, Check, Star, ShieldCheck, Clock, Book } from 'lucide-react';
import { EBook } from '../types/ebook.ts';
import { formatMYR } from '../utils/ebookLogic.ts';

interface BookDetailModalProps {
  book: EBook | null;
  isOpen: boolean;
  onClose: () => void;
  isOwned: boolean;
  isInCart: boolean;
  onRead: (book: EBook) => void;
  onAddToCart: (book: EBook) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  isOwned,
  isInCart,
  onRead,
  onAddToCart,
}) => {
  if (!isOpen || !book) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Butiran buku ${book.title}`}
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="relative bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {book.category === 'komik' ? 'Komik & Manga' : 'Novel Teks ePub'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* Top Section: Cover & Key Info */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-28 sm:w-36 shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-slate-900 shadow-md border border-slate-200">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 border-l-4 border-amber-500/50 flex flex-col justify-between p-3 text-white text-center select-none">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-amber-400">
                    {book.category === 'komik' ? 'KOMIK GRAFIK' : 'NOVEL TEKS'}
                  </div>
                  <div className="space-y-1 my-auto">
                    <h4 className="font-serif-book font-bold text-xs text-white line-clamp-3 leading-snug">
                      {book.title}
                    </h4>
                    <p className="text-[9px] text-slate-400 line-clamp-1 italic">
                      {book.genre}
                    </p>
                  </div>
                  <div className="text-[9px] font-medium text-slate-300 truncate border-t border-white/10 pt-1">
                    {book.author}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {book.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Oleh <span className="text-slate-900 font-semibold">{book.author}</span>
              </p>

              {/* Rating & Genre */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{book.rating.toFixed(1)}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700">
                  {book.genre}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{book.pages} m/s</span>
              </div>

              {/* Price */}
              <div className="pt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {book.isFree ? 'Percuma' : formatMYR(book.price)}
                </span>
                {book.originalPrice && book.originalPrice > book.price && (
                  <span className="text-xs text-slate-400 line-through">
                    RM {book.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sinopsis Lengkap */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sinopsis Karya
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {book.synopsis}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Penerbit</span>
              <span className="font-semibold text-slate-800">{book.publisher}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Tahun Terbitan</span>
              <span className="font-semibold text-slate-800">{book.publicationYear}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Anggaran Masa</span>
              <span className="font-semibold text-slate-800">{book.readTime}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Format Fail</span>
              <span className="font-semibold text-slate-800 uppercase">
                {book.category === 'komik' ? 'Grafik Webtoon' : 'EPUB 3.0'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[11px]">Nombor ISBN</span>
              <span className="font-mono text-slate-700 text-[11px]">{book.isbn}</span>
            </div>
          </div>

          {/* Keselamatan DRM */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Dilindungi sistem lesen digital DRM KaryaDigital dan pautan Cloudflare R2 berenkripsi.</span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            onClick={() => {
              onClose();
              onRead(book);
            }}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>{isOwned ? 'Baca Naskhah Penuh' : 'Baca Sampel'}</span>
          </button>

          {isOwned ? (
            <button
              onClick={() => {
                onClose();
                onRead(book);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Buka Dalam Rak</span>
            </button>
          ) : book.isFree ? (
            <button
              onClick={() => {
                onClose();
                onAddToCart(book);
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
            >
              <span>Dapatkan Percuma</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onAddToCart(book);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                isInCart
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isInCart ? 'Dalam Bakul' : 'Beli Buku'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
