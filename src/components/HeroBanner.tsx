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
    <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
      <div className="max-w-4xl mx-auto text-center space-y-5">
        {/* Tajuk Utama */}
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Dunia E-Buku & Komik Tempatan Malaysia
        </h1>

        {/* Satu Ayat Penerangan Ringkas */}
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Platform jualan dan bacaan naskhah asli penulis fiksyen, sastera, dan pelukis komik tanah air terus dalam pelayar anda tanpa perlu muat turun aplikasi.
        </p>

        {/* Butang Terokai Buku & Baucar Sekali Sahaja */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {/* Butang Utama */}
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Terokai Buku</span>
            <ArrowDown className="w-4 h-4" />
          </button>

          {/* Baucar Diskaun Sekali Sahaja */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
            <span className="flex items-center gap-1 text-amber-300 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Baucar RM5.00:
            </span>
            <span className="font-mono font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded border border-white/10">
              KARYALOKAL
            </span>
            <button
              onClick={handleCopy}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 ml-1 transition-colors flex items-center gap-1 cursor-pointer"
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
