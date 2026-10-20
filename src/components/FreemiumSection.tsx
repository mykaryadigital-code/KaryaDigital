import React from 'react';
import { Sparkles, BookOpen, ArrowRight, Zap, CheckCircle2, Gift, LockOpen } from 'lucide-react';
import { EBook } from '../types/ebook.ts';

interface FreemiumSectionProps {
  books: EBook[];
  onRead: (book: EBook) => void;
  onAddToCart: (book: EBook) => void;
  ownedBookIds: string[];
}

export const FreemiumSection: React.FC<FreemiumSectionProps> = ({
  books,
  onRead,
  onAddToCart,
  ownedBookIds,
}) => {
  // Select top freemium hook books with available chapters or free access
  const freemiumBooks = books
    .filter((b) => b.isFree || (b.sampleContent && b.sampleContent.chapters.length > 0) || b.comicSample)
    .slice(0, 4);

  return (
    <section className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-y border-indigo-900/40 relative overflow-hidden w-full max-w-full">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>Ruangan Khas Pembaca Baharu</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Mula Membaca Secara Percuma
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Nikmati bab-bab awal naskhah pilihan tanpa bayaran pendahuluan atau pendaftaran rumit. Terokai naratif penulis tanah air sebelum membuat keputusan pembelian.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Tiada Kad Kredit Diperlukan</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <LockOpen className="w-4 h-4" />
              <span>Buka Terus Dalam Pelayar</span>
            </div>
          </div>
        </div>

        {/* Freemium Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {freemiumBooks.map((book) => {
            const isOwned = ownedBookIds.includes(book.id);
            const firstChapter = book.sampleContent?.chapters[0];
            const firstParagraph = firstChapter?.paragraphs[0] || book.synopsis;

            return (
              <div
                key={book.id}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 group shadow-lg hover:-translate-y-1"
              >
                <div className="space-y-3">
                  {/* Badge & Format */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                      {book.isFree ? '100% Percuma' : 'Bab 1 Percuma'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {book.category === 'komik' ? '💥 Komik' : '📖 Novel ePub'}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Oleh {book.author}</p>
                  </div>

                  {/* Chapter Hook Excerpt */}
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400/90 uppercase tracking-wide">
                      <Sparkles className="w-3 h-3" />
                      <span>{firstChapter ? firstChapter.title : 'Petikan Awal'}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-3 italic leading-relaxed">
                      "{firstParagraph}"
                    </p>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-emerald-400">
                    {book.isFree ? 'Percuma Penuh' : `Beli Penuh: RM ${book.price.toFixed(2)}`}
                  </div>

                  <button
                    onClick={() => onRead(book)}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <span>Baca Bab Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
