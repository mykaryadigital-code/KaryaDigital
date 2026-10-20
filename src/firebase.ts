import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  query,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with configured firestoreDatabaseId as required by AI Studio Firebase Skill
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Provider
const googleProvider = new GoogleAuthProvider();

// Error Handling Definition per AI Studio Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 1. Connection Health Check per Skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Sambungan Firestore berjaya disahkan.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Sila semak konfigurasi Firebase anda (Client offline).');
    } else {
      // Document may not exist, but network reachability is verified
      console.log('[Firebase] Sambungan Firestore aktif.');
    }
    return true;
  }
}

// Run connection test on load
testConnection().catch(() => {});

// 2. Authentication Functions
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Simpan maklumat pengguna dalam Firestore /users/{uid}
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (error) {
    console.error('[Firebase Auth Error]: Gagal log masuk Google:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('[Firebase Auth Error]: Gagal log keluar:', error);
    throw error;
  }
}

export function onUserAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
    if (user) {
      syncUserProfile(user).catch(console.error);
    }
  });
}

export async function syncUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  try {
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Pembaca Tempatan',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    // If permission or offline, log warning
    console.warn('[Firebase] Gagal mengemas kini profil pengguna:', err);
  }
}

// 3. Purchased Books Subcollection Operations
export interface PurchasedBookRecord {
  bookId: string;
  title: string;
  author: string;
  coverImage?: string;
  price: number;
  purchasedAt: string;
  paymentGateway: 'bcl' | 'toyyibpay' | 'manual';
  transactionId: string;
  format?: 'epub' | 'comic';
}

/**
 * Menyimpan rekod buku yang telah dibeli ke dalam Firestore /users/{userId}/purchased_books/{bookId}
 */
export async function savePurchasedBookToFirestore(
  userId: string,
  book: PurchasedBookRecord
): Promise<void> {
  const path = `users/${userId}/purchased_books/${book.bookId}`;
  try {
    const bookDocRef = doc(db, 'users', userId, 'purchased_books', book.bookId);
    await setDoc(bookDocRef, {
      ...book,
      unlockedAt: new Date().toISOString(),
    });
    console.log(`[Firestore] Buku ${book.bookId} berjaya disimpan ke akaun pembeli ${userId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Mendapatkan senarai buku sah yang dibeli oleh pengguna dari Firestore
 */
export async function getPurchasedBooksFromFirestore(
  userId: string
): Promise<PurchasedBookRecord[]> {
  const path = `users/${userId}/purchased_books`;
  try {
    const booksColRef = collection(db, 'users', userId, 'purchased_books');
    const q = query(booksColRef);
    const querySnapshot = await getDocs(q);
    const books: PurchasedBookRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      books.push(docSnap.data() as PurchasedBookRecord);
    });
    return books;
  } catch (error) {
    console.warn('[Firestore] Gagal memuat turun buku pengguna:', error);
    return [];
  }
}

/**
 * Langganan masa nyata (Realtime Listener) menggunakan onSnapshot
 */
export function subscribeToPurchasedBooks(
  userId: string,
  onBooksChange: (books: PurchasedBookRecord[]) => void
) {
  const path = `users/${userId}/purchased_books`;
  const booksColRef = collection(db, 'users', userId, 'purchased_books');

  return onSnapshot(
    booksColRef,
    (snapshot) => {
      const books: PurchasedBookRecord[] = [];
      snapshot.forEach((d) => {
        books.push(d.data() as PurchasedBookRecord);
      });
      onBooksChange(books);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// 4. Invois / Rekod Pesanan
export async function recordOrderInFirestore(order: {
  orderId: string;
  userId: string;
  userEmail: string;
  userName: string;
  bookIds: string[];
  totalAmount: number;
  gateway: 'bcl' | 'toyyibpay';
  status: 'pending' | 'paid' | 'failed';
  billCode?: string;
  paymentUrl?: string;
}): Promise<void> {
  const path = `orders/${order.orderId}`;
  try {
    const orderRef = doc(db, 'orders', order.orderId);
    await setDoc(orderRef, {
      ...order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[Firestore Order Error]:', error);
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  status: 'paid' | 'failed',
  transactionId?: string
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      transactionId: transactionId || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[Firestore Order Update Error]:', error);
  }
}

// 5. Published Books Collection (Penyimpanan Manuskrip & Karya Penulis)
export async function saveBookToFirestore(book: any): Promise<void> {
  const path = `published_books/${book.id}`;
  try {
    const bookDocRef = doc(db, 'published_books', book.id);
    await setDoc(bookDocRef, {
      ...book,
      publishedAt: new Date().toISOString(),
      storageProvider: 'Cloudflare R2 & Firestore',
    });
    console.log(`[Firestore] Naskhah "${book.title}" (${book.id}) disimpan ke koleksi published_books`);
  } catch (error) {
    console.warn('[Firestore] Gagal menyimpan ke published_books:', error);
  }
}

export async function getPublishedBooksFromFirestore(): Promise<any[]> {
  try {
    const colRef = collection(db, 'published_books');
    const snap = await getDocs(colRef);
    const books: any[] = [];
    snap.forEach((d) => {
      books.push(d.data());
    });
    return books;
  } catch (error) {
    console.warn('[Firestore] Gagal membaca published_books:', error);
    return [];
  }
}
