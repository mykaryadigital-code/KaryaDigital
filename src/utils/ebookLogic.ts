import type { EBook, CartItem, BookCategory, BookmarkEntry } from '../types/ebook.ts';

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

/**
 * Menyemak sama ada sesuatu halaman tertentu telah ditandakan (Bookmarked).
 */
export function isPageBookmarked(
  bookmarks: Record<string, BookmarkEntry[]> | undefined,
  bookId: string,
  pageNumber: number
): boolean {
  if (!bookmarks || !bookmarks[bookId]) return false;
  return bookmarks[bookId].some((b) => b.pageNumber === pageNumber);
}

/**
 * Menogol (Toggle) penanda buku bagi sesuatu halaman.
 * Jika sudah ada, padam penanda tersebut. Jika tiada, tambahkan ke dalam senarai.
 */
export function toggleBookmarkInList(
  bookmarks: Record<string, BookmarkEntry[]> | undefined,
  newBookmark: BookmarkEntry
): Record<string, BookmarkEntry[]> {
  const currentBookmarks = bookmarks ? { ...bookmarks } : {};
  const bookList = currentBookmarks[newBookmark.bookId] ? [...currentBookmarks[newBookmark.bookId]] : [];

  const existingIndex = bookList.findIndex((b) => b.pageNumber === newBookmark.pageNumber);
  if (existingIndex >= 0) {
    // Padam jika sudah wujud
    bookList.splice(existingIndex, 1);
  } else {
    // Tambah penanda baharu
    bookList.push(newBookmark);
    // Susun mengikut nombor halaman meningkat
    bookList.sort((a, b) => a.pageNumber - b.pageNumber);
  }

  currentBookmarks[newBookmark.bookId] = bookList;
  return currentBookmarks;
}

/**
 * Memadam penanda buku spesifik berdasarkan nombor halaman.
 */
export function removeBookmarkFromList(
  bookmarks: Record<string, BookmarkEntry[]> | undefined,
  bookId: string,
  pageNumber: number
): Record<string, BookmarkEntry[]> {
  if (!bookmarks || !bookmarks[bookId]) return bookmarks || {};
  const updated = { ...bookmarks };
  updated[bookId] = updated[bookId].filter((b) => b.pageNumber !== pageNumber);
  return updated;
}

/**
 * Mengambil penanda buku terkini (terakhir disimpan) bagi sesuatu e-buku.
 */
export function getLastBookmark(
  bookmarks: Record<string, BookmarkEntry[]> | undefined,
  bookId: string
): BookmarkEntry | null {
  if (!bookmarks || !bookmarks[bookId] || bookmarks[bookId].length === 0) return null;
  const list = bookmarks[bookId];
  return list.reduce((latest, current) => {
    return new Date(current.savedAt).getTime() > new Date(latest.savedAt).getTime() ? current : latest;
  }, list[0]);
}

/**
 * Mencari naskhah yang paling terkini dibaca daripada senarai naskhah yang dimiliki.
 */
export function getMostRecentBookmarkedBook(
  bookmarks: Record<string, BookmarkEntry[]> | undefined,
  availableBookIds: string[]
): { bookId: string; bookmark: BookmarkEntry } | null {
  if (!bookmarks || availableBookIds.length === 0) return null;

  let mostRecent: { bookId: string; bookmark: BookmarkEntry } | null = null;
  let latestTime = -1;

  for (const bookId of availableBookIds) {
    const lastBookmark = getLastBookmark(bookmarks, bookId);
    if (lastBookmark) {
      const time = new Date(lastBookmark.savedAt).getTime();
      if (time > latestTime) {
        latestTime = time;
        mostRecent = { bookId, bookmark: lastBookmark };
      }
    }
  }

  return mostRecent;
}

/**
 * Menyemak sama ada sesuatu naskhah adalah kepunyaan sah pengguna (penulis karya).
 * Mengutamakan semakan Firebase UID, emel, dan nama pena yang disahkan.
 */
export function isUserBookOwner(
  book: EBook,
  user?: { uid?: string; email?: string; name?: string; isLoggedIn?: boolean } | null
): boolean {
  if (!user || !user.isLoggedIn) return false;

  const userEmail = (user.email || '').trim().toLowerCase();
  const bookEmail = (book.authorEmail || '').trim().toLowerCase();
  const bookUid = book.authorUid || '';
  const userUid = user.uid || '';

  // 1. Padanan kukuh melalui Firebase UID
  if (userUid && bookUid) {
    if (userUid === bookUid) return true;
    // Jika UID berbeza dan tidak sepadan, akses dinafikan
    return false;
  }

  // 2. Padanan terus melalui Emel Akaun
  if (userEmail && bookEmail && userEmail === bookEmail) {
    return true;
  }

  // 3a. Pengiktirafan hak pengarang akaun Bang Karim (bangkarim79@gmail.com)
  if (userEmail === 'bangkarim79@gmail.com') {
    const bookTitleLower = (book.title || '').trim().toLowerCase();
    const authorLower = (book.author || '').trim().toLowerCase();
    if (
      bookTitleLower.includes('janda bukan akhir') ||
      authorLower.includes('karim')
    ) {
      if (!bookEmail || bookEmail === userEmail) {
        return true;
      }
    }
  }

  // 3b. Pengiktirafan hak pemilik & penerbit rasmi platform (mykaryadigital@gmail.com / karyadigital@mykaryadigital.com)
  if (
    userEmail === 'mykaryadigital@gmail.com' ||
    userEmail === 'karyadigital@mykaryadigital.com'
  ) {
    if (
      bookEmail === 'mykaryadigital@gmail.com' ||
      bookEmail === 'karyadigital@mykaryadigital.com' ||
      (book.author || '').toLowerCase().includes('karyadigital') ||
      (book.title || '').toLowerCase().includes('anim')
    ) {
      return true;
    }
  }

  // Jika kedua-dua emel wujud tetapi jelas merujuk kepada pengguna lain, akses dinafikan
  if (userEmail && bookEmail && userEmail !== bookEmail) {
    return false;
  }

  // 4. Jika naskhah belum mempunyai authorUid atau authorEmail (karya legacy/luar talian):
  // Hanya benarkan jika tiada pertikaian identiti dan nama sepadan tepat (TIDAK benarkan substring sembarangan)
  const authorName = (book.author || '').trim().toLowerCase();
  const userName = (user.name || '').trim().toLowerCase();
  const emailPrefix = userEmail ? userEmail.split('@')[0] : '';

  const normAuthor = authorName.replace(/[^a-z]/g, '');
  const normUser = userName.replace(/[^a-z]/g, '');
  const normPrefix = emailPrefix.replace(/[^a-z]/g, '');

  const isGenericName =
    !normUser ||
    normUser === 'pembacakaryadigital' ||
    normUser === 'pembaca' ||
    normUser === 'tetamu' ||
    normUser === 'pengguna';

  // Strict: Hanya jika pengarang belum ditetapkan emel/UID, dan nama pengguna atau awalan emel sepadan TEPAT
  if (!isGenericName && normAuthor && normAuthor.length >= 4) {
    const isExactMatch = normAuthor === normUser || normAuthor === normPrefix;
    if (isExactMatch) {
      if (bookUid && userUid && bookUid !== userUid) return false;
      if (bookEmail && userEmail && bookEmail !== userEmail) return false;
      return true;
    }
  }

  return false;
}


