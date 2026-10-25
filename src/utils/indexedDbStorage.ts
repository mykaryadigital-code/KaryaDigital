/**
 * @file indexedDbStorage.ts
 * Pengurusan storan fail manuskrip besar (.PDF & .EPUB sehingga 100MB+) menggunakan IndexedDB pelayar.
 * IndexedDB tidak mempunyai sekatan 5MB seperti localStorage, membolehkan fail e-buku disimpan secara kekal di telefon/peranti pengguna.
 */

const DB_NAME = 'KaryaDigitalStorage';
const DB_VERSION = 1;
const STORE_NAME = 'manuscripts';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB tidak disokong pada pelayar ini.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'bookId' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Menyimpan fail manuskrip (Blob atau Data) ke dalam IndexedDB
 */
export async function saveManuscriptToIndexedDb(
  bookId: string,
  blobOrData: Blob | string,
  fileName: string,
  format: 'pdf' | 'epub'
): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        bookId,
        data: blobOrData,
        fileName,
        format,
        updatedAt: Date.now(),
      };

      const putRequest = store.put(record);

      putRequest.onsuccess = () => {
        console.log(`[IndexedDB] Manuskrip "${fileName}" (${bookId}) berjaya disimpan secara kekal.`);
        resolve(true);
      };

      putRequest.onerror = () => {
        console.warn('[IndexedDB] Ralat menyimpan manuskrip:', putRequest.error);
        reject(putRequest.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Gagal membuka pangkalan data:', err);
    return false;
  }
}

/**
 * Membaca fail manuskrip dari IndexedDB
 */
export async function getManuscriptFromIndexedDb(
  bookId: string
): Promise<{ data: Blob | string; fileName: string; format: 'pdf' | 'epub' } | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(bookId);

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    return null;
  }
}

/**
 * Memadam fail manuskrip dari IndexedDB
 */
export async function deleteManuscriptFromIndexedDb(bookId: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const delRequest = store.delete(bookId);

      delRequest.onsuccess = () => resolve(true);
      delRequest.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}
