import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMYR,
  calculateCartTotals,
  filterEbooks,
  evaluateSecurityAttempt,
  calculateReadingProgress,
  isPageBookmarked,
  toggleBookmarkInList,
  removeBookmarkFromList,
  getLastBookmark,
  getMostRecentBookmarkedBook,
  isUserBookOwner,
} from './ebookLogic.ts';
import type { EBook, CartItem, BookmarkEntry } from '../types/ebook.ts';

const mockBooks: EBook[] = [
  {
    id: 'novel-1',
    title: 'Bayang Di Sebalik Menara',
    author: 'Ramlee Awang',
    category: 'novel',
    genre: 'Misteri',
    synopsis: 'Kisah misteri pembunuhan di mercu tanda Kuala Lumpur.',
    rating: 4.8,
    reviewsCount: 350,
    price: 18.0,
    pages: 320,
    readTime: '6 jam',
    publisher: 'Karya Prima',
    publicationYear: 2025,
    isbn: '978-967-1234-01-1',
    coverGradient: 'from-amber-700 to-slate-900',
    coverAccent: '#f59e0b',
  },
  {
    id: 'komik-1',
    title: 'Lawak Kampus Generasi Z',
    author: 'Keith',
    category: 'komik',
    genre: 'Komedi',
    synopsis: 'Gelagat lucu dan santai kehidupan pelajar zaman moden.',
    rating: 4.9,
    reviewsCount: 890,
    price: 12.0,
    pages: 140,
    readTime: '1.5 jam',
    publisher: 'Gempak Media',
    publicationYear: 2026,
    isbn: '978-967-1234-02-2',
    coverGradient: 'from-blue-600 to-indigo-900',
    coverAccent: '#38bdf8',
  },
  {
    id: 'novel-free',
    title: 'Panduan Penulisan Skrip',
    author: 'Pak Hassan',
    category: 'novel',
    genre: 'Pendidikan',
    synopsis: 'E-buku asas teknik menulis karya kreatif tempatan percuma.',
    rating: 4.6,
    reviewsCount: 120,
    price: 0,
    isFree: true,
    pages: 90,
    readTime: '2 jam',
    publisher: 'Dewan Sastera',
    publicationYear: 2024,
    isbn: '978-967-1234-03-3',
    coverGradient: 'from-emerald-700 to-teal-950',
    coverAccent: '#34d399',
  },
];

test('formatMYR formats currency correctly in RM or Percuma', () => {
  assert.equal(formatMYR(0), 'Percuma');
  assert.equal(formatMYR(15), 'RM 15.00');
  assert.equal(formatMYR(19.9), 'RM 19.90');
});

test('calculateCartTotals computes subtotal and applies vouchers correctly', () => {
  const items: CartItem[] = [
    { book: mockBooks[0], addedAt: Date.now() },
    { book: mockBooks[1], addedAt: Date.now() },
  ];

  // Subtotal = 18.00 + 12.00 = 30.00
  const totalsWithoutVoucher = calculateCartTotals(items);
  assert.equal(totalsWithoutVoucher.subtotal, 30.0);
  assert.equal(totalsWithoutVoucher.discount, 0);
  assert.equal(totalsWithoutVoucher.total, 30.0);

  // Baucar KARYALOKAL: RM5 off
  const totalsWithKarya = calculateCartTotals(items, 'KARYALOKAL');
  assert.equal(totalsWithKarya.discount, 5.0);
  assert.equal(totalsWithKarya.total, 25.0);
  assert.match(totalsWithKarya.voucherApplied!, /KARYALOKAL/);

  // Baucar PESTA10: 10% off
  const totalsWithPesta = calculateCartTotals(items, 'PESTA10');
  assert.equal(totalsWithPesta.discount, 3.0);
  assert.equal(totalsWithPesta.total, 27.0);
});

test('filterEbooks filters by category and search keyword', () => {
  // Filter category novel
  const novelsOnly = filterEbooks(mockBooks, '', 'novel');
  assert.equal(novelsOnly.length, 2);
  assert.ok(novelsOnly.every((b) => b.category === 'novel'));

  // Filter category komik
  const komikOnly = filterEbooks(mockBooks, '', 'komik');
  assert.equal(komikOnly.length, 1);
  assert.equal(komikOnly[0].title, 'Lawak Kampus Generasi Z');

  // Search keyword "Ramlee"
  const searchedAuthor = filterEbooks(mockBooks, 'Ramlee', 'semua');
  assert.equal(searchedAuthor.length, 1);
  assert.equal(searchedAuthor[0].author, 'Ramlee Awang');

  // Filter percuma
  const freeBooks = filterEbooks(mockBooks, '', 'percuma');
  assert.equal(freeBooks.length, 1);
  assert.equal(freeBooks[0].price, 0);
});

test('evaluateSecurityAttempt blocks right click, copy, and dev shortcuts', () => {
  // Contextmenu block
  const ctxResult = evaluateSecurityAttempt('contextmenu');
  assert.equal(ctxResult.shouldBlock, true);
  assert.match(ctxResult.alertMessage!, /Klik kanan disekat/);

  // Copy block
  const copyResult = evaluateSecurityAttempt('copy');
  assert.equal(copyResult.shouldBlock, true);
  assert.match(copyResult.alertMessage!, /Salinan teks disekat/);

  // Ctrl+C block
  const ctrlCResult = evaluateSecurityAttempt('keydown', 'c', true);
  assert.equal(ctrlCResult.shouldBlock, true);

  // Ctrl+P block
  const ctrlPResult = evaluateSecurityAttempt('keydown', 'p', true);
  assert.equal(ctrlPResult.shouldBlock, true);
  assert.match(ctrlPResult.alertMessage!, /mencetak e-buku disekat/);

  // F12 block
  const f12Result = evaluateSecurityAttempt('keydown', 'F12', false);
  assert.equal(f12Result.shouldBlock, true);

  // Normal typing allowed
  const normalKey = evaluateSecurityAttempt('keydown', 'a', false);
  assert.equal(normalKey.shouldBlock, false);
});

test('calculateReadingProgress computes reading percentage accurately', () => {
  assert.equal(calculateReadingProgress(1, 4), 25);
  assert.equal(calculateReadingProgress(3, 4), 75);
  assert.equal(calculateReadingProgress(4, 4), 100);
  assert.equal(calculateReadingProgress(0, 10), 0);
});

test('bookmark operations manage page bookmarks and resume positions', () => {
  const bookmarkP1: BookmarkEntry = {
    id: 'novel-1-p1',
    bookId: 'novel-1',
    pageNumber: 1,
    totalSteps: 3,
    chapterTitle: 'Bab 1: Dentuman Hujan',
    excerpt: 'Hujan lebat yang membasahi...',
    savedAt: '2026-10-21T10:00:00.000Z',
  };

  const bookmarkP2: BookmarkEntry = {
    id: 'novel-1-p2',
    bookId: 'novel-1',
    pageNumber: 2,
    totalSteps: 3,
    chapterTitle: 'Bab 2: Kunci Enkripsi',
    excerpt: 'Bilik pelayan itu sedingin...',
    savedAt: '2026-10-21T11:00:00.000Z',
  };

  // 1. Initial toggle adds bookmark
  let bookmarks: Record<string, BookmarkEntry[]> = {};
  bookmarks = toggleBookmarkInList(bookmarks, bookmarkP1);
  assert.equal(bookmarks['novel-1'].length, 1);
  assert.equal(isPageBookmarked(bookmarks, 'novel-1', 1), true);
  assert.equal(isPageBookmarked(bookmarks, 'novel-1', 2), false);

  // 2. Add second page bookmark
  bookmarks = toggleBookmarkInList(bookmarks, bookmarkP2);
  assert.equal(bookmarks['novel-1'].length, 2);
  assert.equal(isPageBookmarked(bookmarks, 'novel-1', 2), true);

  // 3. getLastBookmark returns the latest saved page (Page 2)
  const last = getLastBookmark(bookmarks, 'novel-1');
  assert.ok(last);
  assert.equal(last?.pageNumber, 2);
  assert.equal(last?.chapterTitle, 'Bab 2: Kunci Enkripsi');

  // 4. Toggle page 1 again removes it
  bookmarks = toggleBookmarkInList(bookmarks, bookmarkP1);
  assert.equal(bookmarks['novel-1'].length, 1);
  assert.equal(isPageBookmarked(bookmarks, 'novel-1', 1), false);
  assert.equal(isPageBookmarked(bookmarks, 'novel-1', 2), true);

  // 5. removeBookmarkFromList removes specific page
  bookmarks = removeBookmarkFromList(bookmarks, 'novel-1', 2);
  assert.equal(bookmarks['novel-1'].length, 0);
  assert.equal(isPageBookmarked(bookmarks, 'novel-1', 2), false);
  assert.equal(getLastBookmark(bookmarks, 'novel-1'), null);

  // 6. getMostRecentBookmarkedBook picks book with latest bookmark
  const multiBookmarks: Record<string, BookmarkEntry[]> = {
    'novel-1': [bookmarkP1],
    'komik-1': [
      {
        id: 'komik-1-p4',
        bookId: 'komik-1',
        pageNumber: 4,
        totalSteps: 6,
        chapterTitle: 'Halaman 4: Gelagat Kelas',
        savedAt: '2026-10-21T12:00:00.000Z',
      },
    ],
  };

  const mostRecent = getMostRecentBookmarkedBook(multiBookmarks, ['novel-1', 'komik-1']);
  assert.ok(mostRecent);
  assert.equal(mostRecent?.bookId, 'komik-1');
  assert.equal(mostRecent?.bookmark.pageNumber, 4);
});

test('isUserBookOwner correctly grants access to author bangkarim79@gmail.com and blocks unauthorized accounts', () => {
  const jandaBook: EBook = {
    id: 'karya-janda-bukan-akhir',
    title: 'Janda Bukan Akhir',
    author: 'Bang Karim',
    authorEmail: 'bangkarim79@gmail.com',
    category: 'novel',
    genre: 'Romantik',
    synopsis: 'Kisah ketabahan seorang wanita tabah membina hidup baharu.',
    price: 10,
    rating: 4.9,
    reviewsCount: 12,
    pages: 180,
    readTime: '4 jam',
    publisher: 'KaryaDigital',
    publicationYear: 2026,
    isbn: '978-967-KD-88',
    coverGradient: 'from-rose-950 via-pink-950 to-slate-950',
    coverAccent: '#fb7185',
  };

  const animBook: EBook = {
    id: 'karya-user-1792809354728',
    title: 'Anim - Aku Bukan Tomboy',
    author: 'KaryaDigital',
    authorEmail: 'karyadigital@mykaryadigital.com',
    category: 'novel',
    genre: 'Romantik',
    synopsis: 'Anim bukan tomboy...',
    price: 10,
    rating: 5,
    reviewsCount: 1,
    pages: 120,
    readTime: '2 jam',
    publisher: 'KaryaDigital',
    publicationYear: 2026,
    isbn: '978-967-KD-02',
    coverGradient: 'from-slate-900 to-indigo-950',
    coverAccent: '#818cf8',
  };

  const bangKarimUser = {
    uid: 'uid-karim-123',
    email: 'bangkarim79@gmail.com',
    name: 'Bang Karim',
    isLoggedIn: true,
  };

  const otherUser = {
    uid: 'uid-other-999',
    email: 'siti@gmail.com',
    name: 'Siti Rahmah',
    isLoggedIn: true,
  };

  const guestUser = {
    name: 'Pembaca KaryaDigital',
    isLoggedIn: false,
  };

  // 1. bangkarim79@gmail.com owns Janda Bukan Akhir
  assert.equal(isUserBookOwner(jandaBook, bangKarimUser), true);

  // 2. bangkarim79@gmail.com even with username fallback 'bangkarim79'
  assert.equal(isUserBookOwner(jandaBook, { ...bangKarimUser, name: 'bangkarim79' }), true);

  // 3. bangkarim79@gmail.com does NOT own Anim
  assert.equal(isUserBookOwner(animBook, bangKarimUser), false);

  // 4. Other user siti@gmail.com cannot access Janda Bukan Akhir
  assert.equal(isUserBookOwner(jandaBook, otherUser), false);

  // 5. Guest user cannot access anything
  assert.equal(isUserBookOwner(jandaBook, guestUser), false);
  assert.equal(isUserBookOwner(jandaBook, null), false);

  // 6. Super Admin / Platform owner mykaryadigital@gmail.com owns Anim platform publication
  const adminUser = {
    uid: 'uid-admin-1',
    email: 'mykaryadigital@gmail.com',
    name: 'Super Admin KaryaDigital',
    isLoggedIn: true,
  };
  assert.equal(isUserBookOwner(animBook, adminUser), true);
});

test('isUserBookOwner strictly prevents unauthorized users from editing or hijacking uploaded books', () => {
  const userBook: EBook = {
    id: 'karya-user-9999',
    title: 'Kembara Ahmad',
    author: 'Ahmad Albab',
    authorUid: 'uid-ahmad-real',
    authorEmail: 'ahmad@example.com',
    category: 'novel',
    genre: 'Kembara',
    synopsis: 'Kisah pengembaraan...',
    price: 15,
    pages: 150,
    rating: 4.8,
    reviewsCount: 10,
    readTime: '3 jam',
    publisher: 'Karya Prima',
    publicationYear: 2026,
    isbn: '978-967-1234-99-9',
    coverGradient: 'from-amber-700 to-slate-900',
    coverAccent: '#f59e0b',
  };

  // Stranger with similar substring in name (e.g. "Ahmad Dani")
  const impostorUser = {
    uid: 'uid-impostor-fake',
    email: 'impostor@gmail.com',
    name: 'Ahmad Dani',
    isLoggedIn: true,
  };

  // Must be strictly blocked!
  assert.equal(isUserBookOwner(userBook, impostorUser), false);

  // Stranger with same name but different UID and Email
  const anotherAhmad = {
    uid: 'uid-ahmad-fake-2',
    email: 'ahmad.other@gmail.com',
    name: 'Ahmad Albab',
    isLoggedIn: true,
  };
  assert.equal(isUserBookOwner(userBook, anotherAhmad), false);

  // Legitimate author with matching UID
  const realAuthorByUid = {
    uid: 'uid-ahmad-real',
    email: 'ahmad@example.com',
    name: 'Ahmad Albab',
    isLoggedIn: true,
  };
  assert.equal(isUserBookOwner(userBook, realAuthorByUid), true);
});

