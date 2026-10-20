import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMYR,
  calculateCartTotals,
  filterEbooks,
  evaluateSecurityAttempt,
  calculateReadingProgress,
} from './ebookLogic.ts';
import type { EBook, CartItem } from '../types/ebook.ts';

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
