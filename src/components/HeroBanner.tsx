import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Zap,
  Shield,
  Copy,
  Check,
  ArrowRight,
  Flame,
  Award,
} from 'lucide-react';
import { BookCategory } from '../types/ebook.ts';

interface HeroBannerProps {
  onSelectCategory: (cat: 'semua' | BookCategory | 'percuma') => void;
  onExploreClick: () => void;
  onCopyVoucher: (code: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onSelectCategory,
  onExploreClick,
  onCopyVoucher,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyVoucher('KARYALOKAL');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none reader-watermark"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            {/* Promo Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold backdrop-blur-xs">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Pesta Buku Digital Malaysia 2026</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight sm:leading-none">
              Dunia E-Buku & Komik <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500">
                Tempatan Terulung
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
              Sokong karya asli penulis fiksyen, penyelidik sastera, dan pelukis komik tanah air.
              Nikmati pengalaman bacaan terus dalam pelayar web tanpa perlu memuat turun aplikasi berat.
            </p>

            {/* Interactive Voucher Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Baucar Pelanggan Baharu
                  </div>
                  <div className="text-sm text-slate-200 font-medium mt-0.5">
                    Potongan <strong>RM 5.00</strong> dengan kod kupon:
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="bg-slate-900 border border-amber-400/40 text-amber-300 px-3 py-1.5 rounded-lg font-mono font-bold text-sm tracking-wider">
                    KARYALOKAL
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    aria-label="Salin kod baucar KARYALOKAL"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-slate-950" />
                        <span>Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  onSelectCategory('novel');
                  onExploreClick();
                }}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-102 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Terokai Novel Teks</span>
              </button>

              <button
                onClick={() => {
                  onSelectCategory('komik');
                  onExploreClick();
                }}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-102 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Jelajah Komik & Grafik</span>
              </button>

              <button
                onClick={() => {
                  onSelectCategory('percuma');
                  onExploreClick();
                }}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-sm border border-white/10 transition-colors"
              >
                <span>Naskhah Percuma</span>
              </button>
            </div>

            {/* Micro Feature List */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sekatan Salinan Hak Cipta</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Pembaca Pelayar Web Segera</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <Award className="w-4 h-4 text-sky-400 shrink-0" />
                <span>100% Royalti Penulis Tempatan</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Showcase Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md">
              {/* Stacked Book Showcase with Realistic Perspective */}
              <div className="relative p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    KaryaDigital Reader v2.6
                  </span>
                </div>

                <div className="pt-4 space-y-4">
                  {/* Spotlight Item 1: Novel */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <div className="w-12 h-16 rounded-md bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-400/30 flex items-center justify-center text-white shrink-0 shadow-md">
                      <span className="text-[9px] font-bold text-center px-1 text-amber-300">
                        BAYANG
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-amber-400 font-semibold">Novel Terhangat</div>
                      <div className="text-sm font-bold text-white truncate">
                        Bayang Di Sebalik Menara
                      </div>
                      <div className="text-xs text-slate-400">Ramlee Awang · RM 18.50</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                      4.9 ★
                    </span>
                  </div>

                  {/* Spotlight Item 2: Comic */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <div className="w-12 h-16 rounded-md bg-gradient-to-br from-amber-600 to-red-700 border border-amber-400/30 flex items-center justify-center text-white shrink-0 shadow-md">
                      <span className="text-[9px] font-bold text-center px-1 text-white">LAWAK</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-amber-400 font-semibold">Komik Sensasi</div>
                      <div className="text-sm font-bold text-white truncate">
                        Lawak Kampus Generasi Z
                      </div>
                      <div className="text-xs text-slate-400">Keith & Cikgu Zaki · RM 12.00</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                      Jilid 1
                    </span>
                  </div>

                  {/* Quick Reader Capability Banner */}
                  <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/20 text-xs text-indigo-200 flex items-center justify-between">
                    <span>⚡ Pratonton 3 Bab Penuh Percuma</span>
                    <span className="text-amber-300 font-semibold">Tanpa Daftar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
