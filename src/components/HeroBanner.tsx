import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  onExploreClick: () => void;
  onSelectBook?: (bookId: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  onSelectBook,
}) => {
  return (
    <section className="relative bg-[#060A17] text-white overflow-hidden border-b border-indigo-950/80">
      {/* Subtle ambient neon glow behind banner */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-32 bg-indigo-600/15 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 py-2.5 sm:py-4 relative z-10">
        <div
          onClick={onExploreClick}
          className="relative rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-indigo-500/30 bg-[#070B19] group cursor-pointer transition-all duration-300 hover:border-indigo-400/60 hover:shadow-indigo-950/60"
        >
          {/* Main Cinematic Neon Hero Image provided by User */}
          <img
            src="/assets/aistudio/Malaysian_ebooks_in_cinematic_neon_d269aea1.png"
            alt="Baca karya tempatan di mana sahaja - E-buku dan komik pilihan Malaysia"
            className="w-full h-auto object-cover block select-none transform transition-transform duration-500 ease-out group-hover:scale-[1.008]"
            loading="eager"
          />

          {/* Interactive button hotspot mapped over the painted 'Terokai Buku' button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExploreClick();
            }}
            className="absolute bottom-[8%] left-[2.5%] sm:bottom-[15%] sm:left-[3.5%] md:bottom-[18%] md:left-[3.6%] px-3 py-1 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-lg sm:rounded-xl bg-transparent hover:bg-white/10 active:scale-95 text-transparent transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-indigo-600/40 focus:text-white cursor-pointer"
            title="Terokai Buku"
            aria-label="Terokai Buku - Lompat ke katalog"
          >
            <span className="sr-only">Terokai Buku</span>
          </button>
        </div>
      </div>
    </section>
  );
};
