/**
 * @file bookStorage.ts
 * Menguruskan penyimpanan naskhah e-buku & komik secara kekal (Persistent Storage)
 * bersepadu dengan Cloudflare R2 Object Storage dan fail pangkalan data pelayan.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadAssetToR2, generateHmacSignedUrl } from './cloudflareR2.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const BOOKS_FILE = path.join(DATA_DIR, 'published_books.json');

// Pastikan direktori data wujud
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface PublishedBookPayload {
  id: string;
  title: string;
  author: string;
  authorUid?: string;
  authorEmail?: string;
  createdAt?: number;
  category: 'novel' | 'komik';
  genre: string;
  synopsis: string;
  price: number;
  isFree: boolean;
  coverImage?: string;
  coverGradient?: string;
  coverAccent?: string;
  coverBadge?: string;
  pages?: number;
  readTime?: string;
  publisher?: string;
  publicationYear?: number;
  isbn?: string;
  rating?: number;
  reviewsCount?: number;
  r2Key?: string;
  r2StorageUrl?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  pdfFileSize?: string;
  sampleContent?: {
    chapters: {
      id: number;
      title: string;
      subtitle?: string;
      paragraphs: string[];
    }[];
  };
}

/**
 * Membaca semua buku yang telah diterbitkan dari fail persistent pelayan
 */
export function getAllPublishedBooks(): PublishedBookPayload[] {
  try {
    if (!fs.existsSync(BOOKS_FILE)) {
      fs.writeFileSync(BOOKS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(BOOKS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[BookStorage] Ralat membaca fail published_books.json:', error);
    return [];
  }
}

/**
 * Menyimpan naskhah e-buku baharu ke Cloudflare R2 dan fail data pelayan
 */
export async function savePublishedBookToStorage(book: PublishedBookPayload): Promise<{
  book: PublishedBookPayload;
  r2Key: string;
  isR2Direct: boolean;
}> {
  const r2Key = `ebooks/${book.id}.json`;
  const manuscriptContent = JSON.stringify(book, null, 2);

  // 1. Muat naik naskhah ke Cloudflare R2 Object Storage
  const r2Result = await uploadAssetToR2({
    fileKey: r2Key,
    data: manuscriptContent,
    contentType: 'application/json',
  });

  const signedStreamUrl = generateHmacSignedUrl({
    bookId: book.id,
    userEmail: 'author@karyadigital.my',
    expiresInSeconds: 86400, // 24 jam untuk pengarang
  });

  const enrichedBook: PublishedBookPayload = {
    ...book,
    r2Key,
    r2StorageUrl: signedStreamUrl,
  };

  // 2. Simpan ke dalam storan fail pelayan
  const currentBooks = getAllPublishedBooks();
  const existingIdx = currentBooks.findIndex((b) => b.id === book.id);

  if (existingIdx >= 0) {
    currentBooks[existingIdx] = enrichedBook;
  } else {
    currentBooks.unshift(enrichedBook);
  }

  try {
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(currentBooks, null, 2), 'utf-8');
    console.log(`[BookStorage] Naskhah "${book.title}" (${book.id}) berjaya disimpan secara kekal.`);
  } catch (err) {
    console.error('[BookStorage] Gagal menulis ke published_books.json:', err);
  }

  return {
    book: enrichedBook,
    r2Key,
    isR2Direct: r2Result.isR2Direct,
  };
}

/**
 * Memadam naskhah daripada storan pelayan
 */
export function deletePublishedBookFromStorage(bookId: string): boolean {
  try {
    const currentBooks = getAllPublishedBooks();
    const filtered = currentBooks.filter((b) => b.id !== bookId);
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    console.log(`[BookStorage] Naskhah "${bookId}" berjaya dipadam dari simpanan pelayan.`);
    return true;
  } catch (err) {
    console.error('[BookStorage] Gagal memadam dari published_books.json:', err);
    return false;
  }
}
