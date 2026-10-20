import type { EBook, CartItem, BookCategory } from '../types/ebook.ts';

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discount: number;
  voucherApplied: string | null;
  tax: number;
  total: number;
}

/**
 * Memformatkan nilai nombor kepada format Ringgit Malaysia (RM).
 */
export function formatMYR(amount: number): string {
  if (amount <= 0) return 'Percuma';
  return `RM ${amount.toFixed(2)}`;
}

/**
 * Mengira jumlah keseluruhan bakul termasuk diskaun baucar.
 */
export function calculateCartTotals(items: CartItem[], voucherCode?: string): CartTotals {
  const itemCount = items.length;
  const subtotal = items.reduce((sum, item) => sum + (item.book.price || 0), 0);

  let discount = 0;
  let voucherApplied: string | null = null;

  if (voucherCode) {
    const cleanCode = voucherCode.trim().toUpperCase();
    if (cleanCode === 'KARYALOKAL') {
      // Diskaun RM 5.00 jika subtotal melebihi RM 10.00
      discount = subtotal > 10 ? 5.0 : Math.min(subtotal, 3.0);
      voucherApplied = 'KARYALOKAL (Potongan RM 5.00)';
    } else if (cleanCode === 'PESTA10') {
      // Diskaun 10%
      discount = +(subtotal * 0.1).toFixed(2);
      voucherApplied = 'PESTA10 (Diskaun 10%)';
    } else if (cleanCode === 'KOMIKLOKAL') {
      // Diskaun RM 3.00 untuk peminat komik
      discount = 3.0;
      voucherApplied = 'KOMIKLOKAL (Potongan RM 3.00)';
    }
  }

  // Tiada cukai SST untuk buku/bahan bacaan pendidikan di Malaysia
  const tax = 0;
  const total = Math.max(0, +(subtotal - discount).toFixed(2));

  return {
    itemCount,
    subtotal: +subtotal.toFixed(2),
    discount: +discount.toFixed(2),
    voucherApplied,
    tax,
    total,
  };
}

/**
 * Menapis dan menyusun katalog e-book berdasarkan kata kunci, kategori, dan susunan.
 */
export function filterEbooks(
  books: EBook[],
  query: string,
  categoryFilter: 'semua' | BookCategory | 'percuma',
  selectedGenre: string = 'semua',
  sortBy: 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'newest' = 'popular'
): EBook[] {
  let filtered = [...books];

  // 1. Tapis kategori
  if (categoryFilter === 'percuma') {
    filtered = filtered.filter((b) => b.price === 0 || b.isFree);
  } else if (categoryFilter !== 'semua') {
    filtered = filtered.filter((b) => b.category === categoryFilter);
  }

  // 2. Tapis genre jika dipilih
  if (selectedGenre !== 'semua') {
    filtered = filtered.filter((b) => b.genre.toLowerCase() === selectedGenre.toLowerCase());
  }

  // 3. Tapis kata kunci carian
  if (query && query.trim() !== '') {
    const q = query.trim().toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q) ||
        b.synopsis.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q)
    );
  }

  // 4. Susun (Sorting)
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return b.publicationYear - a.publicationYear;
      case 'popular':
      default:
        return b.reviewsCount - a.reviewsCount;
    }
  });

  return filtered;
}

/**
 * Logik keselamatan untuk mengesan dan menyekat cubaan salin/akses kod sumber.
 */
export function evaluateSecurityAttempt(
  eventType: 'contextmenu' | 'copy' | 'keydown',
  key?: string,
  ctrlOrMeta?: boolean
): { shouldBlock: boolean; alertMessage?: string } {
  if (eventType === 'contextmenu') {
    return {
      shouldBlock: true,
      alertMessage: '⚠️ Perlindungan Hak Cipta: Klik kanan disekat untuk melindungi hak cipta penulis e-buku tempatan.',
    };
  }

  if (eventType === 'copy') {
    return {
      shouldBlock: true,
      alertMessage: '🔒 Kandungan Dilindungi: Salinan teks disekat bagi memelihara karya asli intelek.',
    };
  }

  if (eventType === 'keydown' && key) {
    const k = key.toLowerCase();
    // Sekat Ctrl+C, Ctrl+U, Ctrl+P, Ctrl+S
    if (ctrlOrMeta && ['c', 'u', 'p', 's'].includes(k)) {
      let reason = 'Tindakan pintasan ini disekat.';
      if (k === 'c') reason = 'Salinan teks disekat.';
      if (k === 'p') reason = 'Ciri mencetak e-buku disekat.';
      if (k === 'u') reason = 'Melihat kod sumber halaman e-buku disekat.';
      if (k === 's') reason = 'Menyimpan fail mentah e-buku disekat.';
      return {
        shouldBlock: true,
        alertMessage: `🛡️ Sekatan Keselamatan: ${reason} Hak cipta terpelihara.`,
      };
    }

    // Sekat kekunci F12 (Developer Tools)
    if (key === 'F12') {
      return {
        shouldBlock: true,
        alertMessage: '🛡️ Keselamatan Digital: Pembukaan panel pemeriksa disekat pada halaman bacaan.',
      };
    }
  }

  return { shouldBlock: false };
}

/**
 * Mengira peratusan kemajuan bacaan e-book.
 */
export function calculateReadingProgress(currentStep: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  const progress = Math.round((currentStep / totalSteps) * 100);
  return Math.min(100, Math.max(0, progress));
}
