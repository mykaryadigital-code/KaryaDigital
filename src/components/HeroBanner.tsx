import React, { useState } from 'react';
import { Sparkles, Copy, Check, ArrowDown } from 'lucide-react';

interface HeroBannerProps {
  onExploreClick: () => void;
  onCopyVoucher: (code: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  onCopyVoucher,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyVoucher('KARYALOKAL');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-7 sm:py-8 min-h-[200px] max-h-[240px] flex flex-col justify-center text-center space-y-3">
        {/* Tajuk Utama Ringkas */}
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
          Dunia E-Buku & Komik Tempatan Malaysia
        </h1>

        {/* Satu Ayat Penerangan Ringkas */}
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-normal leading-relaxed line-clamp-2">
          Platform rasmi naskhah asli penulis fiksyen, sastera, dan pelukis komik tanah air terus dalam pelayar anda tanpa aplikasi tambahan.
        </p>

        {/* Butang Terokai Buku (Ungu Utama) & Baucar Ringkas (Kuning Aksen) */}
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <button
            onClick={onExploreClick}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Terokai Buku</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-300">
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Baucar RM5:
            </span>
            <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
              KARYALOKAL
            </span>
            <button
              onClick={handleCopy}
              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 ml-0.5 transition-colors flex items-center gap-1 cursor-pointer"
              title="Salin baucar"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
