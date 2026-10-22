import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  COVER_MAK_TOK,
  COVER_PENDEKAR_CYBER,
  COVER_HUTAN_BISIKAN,
} from '../data/bookCovers.ts';

interface HeroBannerProps {
  onExploreClick: () => void;
  onCopyVoucher?: (code: string) => void;
  onSelectBook?: (bookId: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  onCopyVoucher,
  onSelectBook,
}) => {
  const heroBooks = [
    {
      id: 'novel-maktok',
      title: 'Resipi Kasih Mak Tok',
      author: 'Aina Zulkifli',
      cover: COVER_MAK_TOK,
    },
    {
      id: 'komik-cyber',
      title: 'Pendekar Cyber',
      author: 'Hafiz Rahman',
      cover: COVER_PENDEKAR_CYBER,
    },
    {
      id: 'novel-hutan',
      title: 'Hutan Seribu Bisikan',
      author: 'Nadia Kamal',
      cover: COVER_HUTAN_BISIKAN,
    },
  ];

  return (
    <section className="relative bg-[#0B132B] text-white overflow-hidden border-b border-indigo-950/80">
      {/* Background KL Skyline & Golden Batik Filigree */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        {/* Subtle KL Skyline Silhouette SVG */}
        <svg
          className="absolute bottom-0 w-full h-32 md:h-44 text-[#1E2958] fill-current"
          viewBox="0 0 1200 180"
          preserveAspectRatio="none"
        >
          {/* KL Tower */}
          <path d="M 280 180 L 280 70 L 277 70 L 277 50 L 283 50 L 283 70 L 280 70 Z M 275 50 L 285 50 L 285 45 L 275 45 Z M 279 45 L 279 20 L 281 20 L 281 45 Z" />
          {/* Twin Towers Left */}
          <path d="M 520 180 L 520 20 L 528 20 L 530 40 L 542 40 L 544 20 L 552 20 L 552 180 Z" />
          {/* Skybridge */}
          <rect x="544" y="80" width="16" height="6" />
          {/* Twin Towers Right */}
          <path d="M 552 180 L 552 20 L 560 20 L 562 40 L 574 40 L 576 20 L 584 20 L 584 180 Z" />
          {/* Generic buildings backdrop */}
          <path d="M 0 180 L 0 140 L 60 140 L 60 180 M 80 180 L 80 120 L 150 120 L 150 180 M 170 180 L 170 135 L 240 135 L 240 180 M 320 180 L 320 110 L 390 110 L 390 180 M 420 180 L 420 130 L 490 130 L 490 180 M 610 180 L 610 115 L 680 115 L 680 180 M 710 180 L 710 135 L 770 135 L 770 180 M 800 180 L 800 100 L 870 100 L 870 180 M 900 180 L 900 125 L 980 125 L 980 180 M 1000 180 L 1000 95 L 1080 95 L 1080 180 M 1100 180 L 1100 140 L 1200 140 L 1200 180 Z" />
        </svg>

        {/* Gold Batik Floral Motif */}
        <div className="absolute top-0 right-0 w-80 h-80 opacity-15 text-amber-400">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 C60 25 75 40 100 50 C75 60 60 75 50 100 C40 75 25 60 0 50 C25 40 40 25 50 0 Z" />
            <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 sm:py-9 md:py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
          {/* Left Column: Typography & Action Buttons */}
          <div className="md:col-span-7 lg:col-span-7 space-y-3 sm:space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-[10px] sm:text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>KaryaDigital Malaysia Rasmi</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black tracking-tight text-white leading-tight">
              Baca karya tempatan,{' '}
              <span className="text-amber-400 block sm:inline">di mana sahaja.</span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-lg font-normal mx-auto md:mx-0">
              E-buku dan komik pilihan Malaysia
            </p>

            <div className="pt-1.5 flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3">
              <button
                onClick={onExploreClick}
                className="min-h-[40px] px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Terokai Buku</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onCopyVoucher && (
                <button
                  onClick={() => onCopyVoucher('KARYALOKAL')}
                  className="min-h-[40px] px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Gunakan kod baucar KARYALOKAL"
                >
                  <span className="text-amber-400 font-bold">Baucar:</span>
                  <span className="font-mono text-white">KARYALOKAL</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: 3 Standing 3D Book Mockups (Hidden on mobile per requirement 4: banner pendek tanpa kolaj cover) */}
          <div className="hidden sm:flex md:col-span-5 lg:col-span-5 items-center justify-center">
            <div className="flex items-end justify-center gap-2 md:gap-3 py-2 perspective-1000">
              {heroBooks.map((hb, idx) => {
                const isCenter = idx === 1;
                return (
                  <div
                    key={hb.id}
                    onClick={() => {
                      if (onSelectBook) onSelectBook(hb.id);
                      else onExploreClick();
                    }}
                    className={`relative cursor-pointer transition-all duration-300 transform group ${
                      isCenter
                        ? 'z-20 -translate-y-2 md:-translate-y-3 scale-105'
                        : idx === 0
                        ? 'z-10 -rotate-3 hover:rotate-0 hover:z-30'
                        : 'z-10 rotate-3 hover:rotate-0 hover:z-30'
                    }`}
                    style={{
                      width: isCenter ? '140px' : '124px',
                    }}
                  >
                    {/* 3D Book Container */}
                    <div className="relative rounded-lg overflow-hidden shadow-2xl border border-white/20 group-hover:scale-105 transition-transform">
                      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-white/30 via-white/5 to-transparent z-10 pointer-events-none" />
                      <img
                        src={hb.cover}
                        alt={hb.title}
                        className="w-full h-auto object-cover rounded-lg aspect-[2/3]"
                      />
                    </div>
                    {/* Shadow */}
                    <div className="w-4/5 h-2.5 mx-auto mt-1 rounded-full bg-black/60 blur-xs" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
