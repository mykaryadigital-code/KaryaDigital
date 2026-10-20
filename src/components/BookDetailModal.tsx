import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  BookOpen,
  ShoppingCart,
  Check,
  ShieldCheck,
  Send,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { EBook } from '../types/ebook.ts';
import { formatMYR } from '../utils/ebookLogic.ts';
import {
  saveBookReviewToFirestore,
  subscribeToBookReviews,
  BookReviewItem,
} from '../firebase.ts';

interface BookDetailModalProps {
  book: EBook | null;
  isOpen: boolean;
  onClose: () => void;
  isOwned: boolean;
  isInCart: boolean;
  onRead: (book: EBook) => void;
  onAddToCart: (book: EBook) => void;
  currentUserName?: string;
  onUpdateBookRating?: (bookId: string, newRating: number, newCount: number) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  isOpen,
  onClose,
  isOwned,
  isInCart,
  onRead,
  onAddToCart,
  currentUserName = 'Bang Karim',
  onUpdateBookRating,
}) => {
  // Star rating state
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewerName, setReviewerName] = useState(currentUserName);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [reviewsList, setReviewsList] = useState<BookReviewItem[]>([]);

  // Load reviews from localStorage on open / book change
  useEffect(() => {
    if (!book) return;
    setReviewerName(currentUserName);

    // 1. Load from local cache
    try {
      const saved = localStorage.getItem(`karyadigital_reviews_${book.id}`);
      if (saved) {
        setReviewsList(JSON.parse(saved));
      } else {
        // Default sample review if none exists yet
        setReviewsList([
          {
            id: `seed-1`,
            bookId: book.id,
            rating: 5,
            comment: 'Gaya penceritaan yang sangat menarik dan segar. Bangga dengan karya tempatan!',
            reviewerName: 'Pembaca Setia MY',
            createdAt: 'Baru-baru ini',
          },
        ]);
      }
    } catch (e) {
      // Ignore parse error
    }

    // 2. Realtime listener from Firestore
    const unsubscribe = subscribeToBookReviews(book.id, (firestoreReviews) => {
      if (firestoreReviews && firestoreReviews.length > 0) {
        setReviewsList(firestoreReviews);
      }
    });

    return () => unsubscribe();
  }, [book?.id, currentUserName]);

  if (!isOpen || !book) return null;

  const ratingDescriptions: Record<number, string> = {
    1: 'Kurang memuaskan',
    2: 'Boleh diperbaiki',
    3: 'Baik & Menarik',
    4: 'Sangat Bagus & Disyorkan',
    5: 'Luar Biasa! Karya Masterpiece',
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    const newReview: BookReviewItem = {
      id: `rev-${Date.now()}`,
      bookId: book.id,
      rating: selectedStars,
      comment: reviewComment.trim(),
      reviewerName: reviewerName.trim() || 'Pembaca Tempatan',
      createdAt: 'Sebentar tadi',
    };

    const updated = [newReview, ...reviewsList];
    setReviewsList(updated);

    // Persist in localStorage
    try {
      localStorage.setItem(`karyadigital_reviews_${book.id}`, JSON.stringify(updated));
    } catch (e) {}

    // Persist in Firestore
    saveBookReviewToFirestore(book.id, {
      rating: newReview.rating,
      comment: newReview.comment,
      reviewerName: newReview.reviewerName,
    }).catch(console.warn);

    // Calculate new average rating
    const totalScore = updated.reduce((sum, r) => sum + r.rating, 0);
    const newAverage = +(totalScore / updated.length).toFixed(1);
    const newReviewsCount = updated.length;

    if (onUpdateBookRating) {
      onUpdateBookRating(book.id, newAverage, newReviewsCount);
    }

    setReviewComment('');
    setSubmittedSuccess(true);
    setTimeout(() => setSubmittedSuccess(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`Butiran naskhah ${book.title}`}
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-950">
              {book.category === 'komik' ? 'Komik & Manga' : 'Novel Teks'}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-300 font-medium">Naskhah Rasmi</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup butiran buku"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Top Section: Cover 2:3 & Key Info */}
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
                <div className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/80">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{book.rating.toFixed(1)}</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({reviewsList.length || book.reviewsCount} ulasan)
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 font-medium text-slate-700">
                  {book.genre}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 font-medium">{book.pages} m/s</span>
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
                {isOwned && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Akses Dimiliki
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

          {/* ============================================================== */}
          {/* SISTEM PENILAIAN BINTANG 1-5 & MAKLUM BALAS KEPADA PENULIS */}
          {/* ============================================================== */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">
                    Beri Penilaian & Maklum Balas kepada Penulis
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Kongsi pandangan anda untuk menyokong karya tempatan ini.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                1 - 5 Bintang
              </span>
            </div>

            {/* Interactive Stars Selector */}
            <form onSubmit={handleRatingSubmit} className="space-y-3">
              <div className="bg-white p-3 rounded-xl border border-indigo-100/80 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700 mr-1">Skor Bintang:</span>
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = (hoverStars !== null ? hoverStars : selectedStars) >= starVal;
                    return (
                      <button
                        type="button"
                        key={starVal}
                        onMouseEnter={() => setHoverStars(starVal)}
                        onMouseLeave={() => setHoverStars(null)}
                        onClick={() => setSelectedStars(starVal)}
                        className="p-1 hover:scale-115 transition-transform cursor-pointer focus:outline-none"
                        aria-label={`${starVal} bintang`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs font-bold text-indigo-900 ml-2">
                    {ratingDescriptions[hoverStars !== null ? hoverStars : selectedStars]}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Nama anda (cth: Bang Karim)"
                    className="w-full sm:w-1/3 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none bg-slate-50"
                  />
                  <input
                    type="text"
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tulis ulasan ringkas (cth: Plot sangat mendebarkan!)..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none bg-slate-50"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Hantar</span>
                  </button>
                </div>

                {submittedSuccess && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terima kasih! Maklum balas anda telah disimpan dan dihantar kepada penulis.</span>
                  </div>
                )}
              </div>
            </form>

            {/* Recent Reader Reviews List */}
            {reviewsList.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Maklum Balas Pembaca Terkini ({reviewsList.length})</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {reviewsList.slice(0, 4).map((rev) => (
                    <div
                      key={rev.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px]">
                          {rev.reviewerName}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Dapatkan Percuma</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onAddToCart(book);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                isInCart
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
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
