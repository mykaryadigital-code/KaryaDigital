import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles, Heart, Compass } from 'lucide-react';
import { BookCategory } from '../types/ebook.ts';

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  badgeLabel: string;
  category: 'semua' | BookCategory;
  genre: string;
  glowColor: string;
  accentBorder: string;
  icon: React.ElementType;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'karya-tempatan',
    image: '/assets/aistudio/Malaysian_ebooks_in_cinematic_neon_d269aea1.png',
    title: 'Baca karya tempatan di mana sahaja',
    subtitle: 'E-buku & komik karya penulis Malaysia dengan pembaca web bersepadu tanpa perlu memuat turun aplikasi.',
    ctaText: 'Terokai Buku',
    badgeLabel: 'Koleksi Tempatan Pilihan',
    category: 'semua',
    genre: 'semua',
    glowColor: 'bg-indigo-600/20',
    accentBorder: 'border-indigo-500/30 hover:border-indigo-400/60',
    icon: Sparkles,
  },
  {
    id: 'janda-bukan-akhir',
    image: '/assets/aistudio/Janda_Bukan_Akhir_hero_banner_933c27ae.png',
    title: 'Ada cinta yang bermula dengan satu halaman',
    subtitle: 'Temui kisah cinta, ketabahan dan harapan yang menyentuh hati. Himpunan novel romantik dan inspirasi kehidupan.',
    ctaText: 'Terokai Kisah Cinta',
    badgeLabel: 'Kisah Romantik & Inspirasi',
    category: 'novel',
    genre: 'romantik',
    glowColor: 'bg-rose-500/20',
    accentBorder: 'border-rose-500/30 hover:border-rose-400/60',
    icon: Heart,
  },
  {
    id: 'panduan-praktikal',
    image: '/assets/aistudio/Practical_guides_for_confident_progress_b2f9c835.png',
    title: 'Ilmu baharu. Langkah lebih yakin.',
    subtitle: 'Koleksi panduan praktikal, pembangunan diri, kemahiran digital, dan motivasi kerjaya daripada pakar tanah air.',
    ctaText: 'Terokai Panduan',
    badgeLabel: 'Panduan Praktikal & Motivasi',
    category: 'novel',
    genre: 'agama',
    glowColor: 'bg-emerald-500/20',
    accentBorder: 'border-emerald-500/30 hover:border-emerald-400/60',
    icon: Compass,
  },
];

const AUTOPLAY_INTERVAL = 6000; // 6 saat setiap slaid

interface HeroBannerProps {
  onExploreClick: () => void;
  onSelectCategory?: (category: 'semua' | BookCategory) => void;
  onSelectGenre?: (genre: string) => void;
  onSelectBook?: (bookId: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreClick,
  onSelectCategory,
  onSelectGenre,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Preload semua gambar slaid agar peralihan pantas tanpa kelipan
  useEffect(() => {
    HERO_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setUserInteracted(true);
  };

  // Autoplay timer dengan sokongan jeda bila kursor di atas banner
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, goToNext, currentIndex]);

  // Pengendali klik tindakan bagi slaid aktif
  const handleSlideAction = (slide: HeroSlide) => {
    if (onSelectCategory && slide.category) {
      onSelectCategory(slide.category);
    }
    if (onSelectGenre && slide.genre) {
      onSelectGenre(slide.genre);
    }
    onExploreClick();
  };

  // Pengendali leret sentuhan (touch swipe) untuk peranti mudah alih
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) {
      setIsPaused(false);
      return;
    }

    const deltaX = touchStartXRef.current - e.changedTouches[0].clientX;
    const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;

    // Pastikan leretan mendatar lebih dominan daripada menegak
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
      setUserInteracted(true);
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    setIsPaused(false);
  };

  // Navigasi papan kekunci (Left & Right arrows) bila terfokus
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    }
  };

  const currentSlide = HERO_SLIDES[currentIndex];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Koleksi Pilihan Karya Digital Malaysia"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative bg-[#060A17] text-white overflow-hidden border-b border-indigo-950/80 select-none outline-none"
    >
      {/* Ambient dynamic background neon glow matching active slide */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-36 ${currentSlide.glowColor} blur-3xl pointer-events-none rounded-full transition-all duration-700 ease-in-out`}
      />

      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 py-2.5 sm:py-4 relative z-10">
        {/* Main Carousel Viewport Frame (Aspect Ratio 3:1 matches 2172x724 banners) */}
        <div
          onClick={() => handleSlideAction(currentSlide)}
          className={`relative w-full aspect-[3/1] rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border ${currentSlide.accentBorder} bg-[#070B19] group cursor-pointer transition-all duration-500 shadow-indigo-950/50 hover:shadow-indigo-950/80`}
        >
          {/* Render All Slides with Crossfade */}
          {HERO_SLIDES.map((slide, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={slide.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} daripada ${HERO_SLIDES.length}: ${slide.title}`}
                aria-hidden={!isActive}
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${
                  isActive
                    ? 'opacity-100 z-10 scale-100 pointer-events-auto'
                    : 'opacity-0 z-0 scale-[1.015] pointer-events-none'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover block select-none transform transition-transform duration-700 ease-out group-hover:scale-[1.008]"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />

                {/* Hotspot mapped directly on the rendered button area in the banner artwork */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSlideAction(slide);
                  }}
                  className="absolute bottom-[8%] left-[2.5%] sm:bottom-[13%] sm:left-[3.2%] md:bottom-[16%] md:left-[3.5%] px-3 py-1 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-lg sm:rounded-xl bg-transparent hover:bg-white/10 active:scale-95 text-transparent transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-indigo-600/40 focus:text-white cursor-pointer"
                  title={slide.ctaText}
                  aria-label={`${slide.ctaText} - Lompat ke katalog`}
                >
                  <span className="sr-only">{slide.ctaText}</span>
                </button>
              </div>
            );
          })}

          {/* Navigation Controls: Previous Slide Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
              setUserInteracted(true);
            }}
            aria-label="Slaid sebelumnya"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/75 backdrop-blur-md border border-white/15 text-white/90 hover:text-white transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 -translate-x-0.5" />
          </button>

          {/* Navigation Controls: Next Slide Arrow */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
              setUserInteracted(true);
            }}
            aria-label="Slaid seterusnya"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/75 backdrop-blur-md border border-white/15 text-white/90 hover:text-white transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 translate-x-0.5" />
          </button>

          {/* Slide Indicator Bar & Badges at Bottom Center */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15"
          >
            {/* Play/Pause state toggle for accessibility */}
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={isPaused ? 'Sambung putaran slaid automatik' : 'Jeda putaran slaid automatik'}
              className="p-0.5 text-white/70 hover:text-white transition-colors cursor-pointer mr-0.5"
              title={isPaused ? 'Main' : 'Jeda'}
            >
              {isPaused ? (
                <Play className="w-3 h-3 fill-current" />
              ) : (
                <Pause className="w-3 h-3 fill-current" />
              )}
            </button>

            {/* Slide Dots / Progress indicators */}
            {HERO_SLIDES.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Pergi ke slaid ${idx + 1}: ${slide.badgeLabel}`}
                  aria-current={isActive ? 'true' : 'false'}
                  className={`group relative h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer overflow-hidden ${
                    isActive
                      ? 'w-6 sm:w-8 bg-white shadow-sm'
                      : 'w-1.5 sm:w-2 bg-white/30 hover:bg-white/60'
                  }`}
                >
                  {/* Subtle timer fill for active slide */}
                  {isActive && !isPaused && (
                    <span
                      key={`${currentIndex}-${userInteracted}`}
                      className="absolute inset-0 bg-amber-400 rounded-full animate-progress"
                      style={{
                        animation: `heroProgress ${AUTOPLAY_INTERVAL}ms linear`,
                      }}
                    />
                  )}
                  <span className="sr-only">{slide.badgeLabel}</span>
                </button>
              );
            })}

            {/* Slide Counter */}
            <span className="text-[10px] sm:text-xs font-mono font-medium text-white/70 ml-1">
              {currentIndex + 1}/{HERO_SLIDES.length}
            </span>
          </div>

          {/* Quiet slide theme tag in top right */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-4 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/90">
            {React.createElement(currentSlide.icon, { className: 'w-3 h-3 text-amber-400' })}
            <span>{currentSlide.badgeLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
