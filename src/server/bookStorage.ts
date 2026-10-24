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
  updatedAt?: number | string;
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

const DELETED_BOOKS_FILE = path.join(DATA_DIR, 'deleted_books.json');

/**
 * Mendapatkan senarai ID naskhah yang telah dipadam secara kekal
 */
export function getDeletedBookIds(): string[] {
  try {
    if (!fs.existsSync(DELETED_BOOKS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DELETED_BOOKS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[BookStorage] Ralat membaca deleted_books.json:', err);
    return [];
  }
}

/**
 * Merekod ID naskhah ke dalam senarai naskhah dipadam (tombstone)
 */
export function recordDeletedBookId(bookId: string): void {
  try {
    const list = getDeletedBookIds();
    if (!list.includes(bookId)) {
      list.push(bookId);
      fs.writeFileSync(DELETED_BOOKS_FILE, JSON.stringify(list, null, 2), 'utf-8');
      console.log(`[BookStorage] Tombstone direkodkan untuk naskhah: ${bookId}`);
    }
  } catch (err) {
    console.error('[BookStorage] Gagal menulis ke deleted_books.json:', err);
  }
}

/**
 * Menyah-rekod naskhah daripada tombstone jika diterbitkan semula
 */
export function unmarkDeletedBookId(bookId: string): void {
  try {
    const list = getDeletedBookIds().filter((id) => id !== bookId);
    fs.writeFileSync(DELETED_BOOKS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[BookStorage] Gagal mengemas kini deleted_books.json:', err);
  }
}

/**
 * Membaca semua buku yang telah diterbitkan dari fail persistent pelayan (menolak naskhah yang telah dipadam)
 */
export function getAllPublishedBooks(): PublishedBookPayload[] {
  try {
    if (!fs.existsSync(BOOKS_FILE)) {
      fs.writeFileSync(BOOKS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(BOOKS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const deletedIds = new Set(getDeletedBookIds());
    return parsed.filter((b) => !deletedIds.has(b.id));
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
  // Jika pernah dipadam, nyah-rekod daripada senarai tombstone
  unmarkDeletedBookId(book.id);

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
 * Memadam naskhah daripada storan pelayan secara kekal dan menyimpan rekod tombstone
 */
export function deletePublishedBookFromStorage(bookId: string): boolean {
  try {
    recordDeletedBookId(bookId);
    const raw = fs.existsSync(BOOKS_FILE) ? fs.readFileSync(BOOKS_FILE, 'utf-8') : '[]';
    const allBooks: PublishedBookPayload[] = JSON.parse(raw);
    const filtered = allBooks.filter((b) => b.id !== bookId);
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    console.log(`[BookStorage] Naskhah "${bookId}" berjaya dipadam dari simpanan pelayan dan direkod ke tombstone.`);
    return true;
  } catch (err) {
    console.error('[BookStorage] Gagal memadam dari published_books.json:', err);
    return false;
  }
}

/**
 * Memadam SEMUA naskhah muat naik daripada storan pelayan secara kekal
 */
export function purgeAllPublishedBooksFromStorage(): string[] {
  try {
    const raw = fs.existsSync(BOOKS_FILE) ? fs.readFileSync(BOOKS_FILE, 'utf-8') : '[]';
    const allBooks: PublishedBookPayload[] = JSON.parse(raw);
    const purgedIds = allBooks.map((b) => b.id);
    for (const id of purgedIds) {
      recordDeletedBookId(id);
    }
    // Hanya rekod ID naskhah yang benar-benar wujud dalam senarai yang dipadam
    recordDeletedBookId('karya-janda-bukan-akhir');

    fs.writeFileSync(BOOKS_FILE, JSON.stringify([], null, 2), 'utf-8');
    console.log(`[BookStorage] Semua naskhah muat naik berjaya dipadam secara pukal.`);
    return Array.from(new Set([...purgedIds, 'karya-janda-bukan-akhir']));
  } catch (err) {
    console.error('[BookStorage] Gagal mengosongkan published_books.json:', err);
    return [];
  }
}
