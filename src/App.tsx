/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header.tsx';
import { HeroBanner } from './components/HeroBanner.tsx';
import { BookGrid } from './components/BookGrid.tsx';
import { InBrowserReaderModal } from './components/InBrowserReaderModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { AccountModal } from './components/AccountModal.tsx';
import { ToyyibPayModal } from './components/ToyyibPayModal.tsx';
import { BclPaymentModal } from './components/BclPaymentModal.tsx';
import { SecureAssetModal } from './components/SecureAssetModal.tsx';
import { SecurityBannerToast } from './components/SecurityBannerToast.tsx';
import { ContinueReadingSection } from './components/ContinueReadingSection.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { BookDetailModal } from './components/BookDetailModal.tsx';
import { AuthorPublishModal } from './components/AuthorPublishModal.tsx';
import { ReaderHelpModal, ReaderHelpTab } from './components/ReaderHelpModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AdminDashboardModal } from './components/AdminDashboardModal.tsx';
import { EditBookModal } from './components/EditBookModal.tsx';
import { OfflineIndicator } from './components/PWAInstallButton.tsx';
import { Footer } from './components/Footer.tsx';
import { INITIAL_EBOOKS, OFFICIAL_PUBLISHED_BOOKS } from './data/ebooksData.ts';
import { EBook, CartItem, UserProfile, BookCategory, SecurityToastEvent, BookmarkEntry } from './types/ebook.ts';
import { evaluateSecurityAttempt, toggleBookmarkInList, removeBookmarkFromList, isUserBookOwner } from './utils/ebookLogic.ts';
import { saveManuscriptToIndexedDb, getManuscriptFromIndexedDb, deleteManuscriptFromIndexedDb } from './utils/indexedDbStorage.ts';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  onUserAuthStateChange,
  getUserProfileFromFirestore,
  subscribeToPurchasedBooks,
  savePurchasedBookToFirestore,
  recordOrderInFirestore,
  saveBookToFirestore,
  getPublishedBooksFromFirestore,
  deleteBookFromFirestore,
  subscribeToPublishedBooks,
} from './firebase.ts';

function getStoredDeletedBookIds(): Set<string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('karyadigital_deleted_book_ids') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {
    // ignore
  }
  return new Set();
}

function getInitialBooks(): EBook[] {
  const map = new Map<string, EBook>();
  OFFICIAL_PUBLISHED_BOOKS.forEach((b) => {
    if (b && b.id) map.set(b.id, b);
  });
  return Array.from(map.values());
}

export default function App() {
  const [deletedBookIds, setDeletedBookIds] = useState<Set<string>>(() => getStoredDeletedBookIds());
  const [books, setBooks] = useState<EBook[]>(() => getInitialBooks());
  const [activeCategory, setActiveCategory] = useState<'semua' | BookCategory | 'percuma' | 'koleksi'>('semua');
  const [selectedGenre, setSelectedGenre] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('karyadigital_user_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Ralat membaca bakul dari localStorage:', e);
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAuthorPortalOpen, setIsAuthorPortalOpen] = useState(false);
  const [activeReadingBook, setActiveReadingBook] = useState<EBook | null>(null);
  const [selectedDetailBook, setSelectedDetailBook] = useState<EBook | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState<string>('KARYALOKAL');
  const [securityToasts, setSecurityToasts] = useState<SecurityToastEvent[]>([]);
  const [editingBook, setEditingBook] = useState<EBook | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // BCL (Bayarcash Commerce Layer) Bill Data State
  const [bclBill, setBclBill] = useState<{
    orderId: string;
    billCode: string;
    bookTitle: string;
    amount: number;
    paymentUrl: string;
    isSandbox: boolean;
    userEmail: string;
    gateway?: string;
    purchasedBooks?: EBook[];
  } | null>(null);

  // ToyyibPay Bill Data State
  const [toyyibPayBill, setToyyibPayBill] = useState<{
    orderId: string;
    billCode: string;
    bookTitle: string;
    amount: number;
    paymentUrl: string;
    isSandbox: boolean;
    userEmail: string;
    purchasedBooks?: EBook[];
  } | null>(null);

  // Cloudflare R2 Secure Asset Modal State
  const [secureAssetModal, setSecureAssetModal] = useState<{
    isOpen: boolean;
    bookId: string;
    bookTitle: string;
  } | null>(null);

  // User Profile State (Bersih untuk pengunjung & disegerak dengan Firebase / LocalStorage)
  const [user, setUser] = useState<UserProfile>(() => {
    let savedBookmarks: Record<string, BookmarkEntry[]> = {};
    try {
      const localBm = localStorage.getItem('karyadigital_user_bookmarks');
      if (localBm) {
        const parsed = JSON.parse(localBm);
        if (parsed && typeof parsed === 'object') {
          savedBookmarks = parsed;
        }
      }
    } catch (e) {
      console.warn('Ralat membaca penanda buku dari localStorage:', e);
    }

    let savedRole: 'reader' | 'author' = 'reader';
    let savedIsAuthor = false;
    try {
      const roleStr = localStorage.getItem('karyadigital_user_role');
      const isAuthStr = localStorage.getItem('karyadigital_is_author');
      if (roleStr === 'author' || isAuthStr === 'true') {
        savedRole = 'author';
        savedIsAuthor = true;
      }
    } catch (e) {
      console.warn('Ralat membaca peranan pengguna:', e);
    }

    let savedOwnedBookIds: string[] = [];
    try {
      const localOwned = localStorage.getItem('karyadigital_owned_books');
      if (localOwned) {
        const parsed = JSON.parse(localOwned);
        if (Array.isArray(parsed)) {
          savedOwnedBookIds = parsed;
        }
      }
    } catch (e) {
      console.warn('Ralat membaca buku milik dari localStorage:', e);
    }

    return {
      name: 'Pembaca KaryaDigital',
      email: '',
      balance: 0.0,
      tier: 'Pembaca Malaysia',
      ownedBookIds: savedOwnedBookIds,
      bookmarks: savedBookmarks,
      role: savedRole,
      isAuthor: savedIsAuthor,
      isLoggedIn: Boolean(auth.currentUser),
    };
  });

  // Auth Modal State (Log Masuk / Daftar Akaun)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(undefined);

  // Super Admin Dashboard State
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login', msg?: string) => {
    setAuthModalMode(mode);
    setAuthModalMessage(msg);
    setIsAuthModalOpen(true);
  };

  const [authorPortalTab, setAuthorPortalTab] = useState<'dashboard' | 'borang' | 'panduan' | 'royalti'>('borang');

  // Track initial page when resuming reading from bookmark
  const [readerInitialPage, setReaderInitialPage] = useState<number | undefined>(undefined);

  const catalogRef = useRef<HTMLDivElement>(null);

  // Author Portal Opener with target tab and role awareness
  const handleOpenAuthorPortal = (tab?: 'register' | 'guide' | 'royalty' | 'dashboard') => {
    const isUserAuthor = Boolean(user.isAuthor || user.role === 'author');
    let targetTab: 'dashboard' | 'borang' | 'panduan' | 'royalti' = 'borang';
    if (tab === 'guide') targetTab = 'panduan';
    else if (tab === 'royalty') targetTab = 'royalti';
    else if (tab === 'register') targetTab = 'borang';
    else if (tab === 'dashboard') targetTab = isUserAuthor ? 'dashboard' : 'borang';
    else targetTab = isUserAuthor ? 'dashboard' : 'borang';

    setAuthorPortalTab(targetTab);
    setIsAuthorPortalOpen(true);
  };

  // Reader Help Modal State (Panduan Membaca, FAQ & Bayaran, Polisi Privasi & Terma)
  const [readerHelpState, setReaderHelpState] = useState<{
    isOpen: boolean;
    tab: ReaderHelpTab;
  }>({
    isOpen: false,
    tab: 'panduan',
  });

  const handleOpenReaderHelp = (tab: ReaderHelpTab = 'panduan') => {
    setReaderHelpState({ isOpen: true, tab });
  };

  // Promote user to Author on publishing or registration
  const handleBecomeAuthor = () => {
    setUser((prev) => {
      const updated: UserProfile = { ...prev, isAuthor: true, role: 'author' };
      try {
        localStorage.setItem('karyadigital_user_role', 'author');
        localStorage.setItem('karyadigital_is_author', 'true');
      } catch (e) {
        console.warn('Ralat menyimpan peranan penulis:', e);
      }
      return updated;
    });
  };

  // Toggle user author role for testing reader vs author UI
  const handleToggleAuthorRole = () => {
    setUser((prev) => {
      const nextIsAuthor = !(prev.isAuthor || prev.role === 'author');
      const updated: UserProfile = {
        ...prev,
        isAuthor: nextIsAuthor,
        role: nextIsAuthor ? 'author' : 'reader',
      };
      try {
        localStorage.setItem('karyadigital_user_role', nextIsAuthor ? 'author' : 'reader');
        localStorage.setItem('karyadigital_is_author', String(nextIsAuthor));
      } catch (e) {
        console.warn('Ralat simpan peranan:', e);
      }
      triggerSecurityWarning(
        nextIsAuthor
          ? 'Peranan ditukar kepada Penulis Sah (Dashboard Penulis diaktifkan).'
          : 'Peranan ditukar kepada Pembaca Biasa.',
        'info'
      );
      return updated;
    });
  };

  // Security Toast Trigger Helper
  const triggerSecurityWarning = (
    message: string,
    type: 'warning' | 'shield' | 'info' = 'warning'
  ) => {
    const newToast: SecurityToastEvent = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: Date.now(),
    };

    setSecurityToasts((prev) => [...prev.slice(-2), newToast]);

    setTimeout(() => {
      setSecurityToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4000);
  };

  // =========================================================================
  // PENYELARASAN BUKU: 100% TERUS DARI FIREBASE FIRESTORE & CLOUDFLARE R2
  // =========================================================================
  // SENARAI BUKU DARI SATU SUMBER KEBENARAN (FIRESTORE REALTIME SYNC)
  // =========================================================================
  useEffect(() => {
    // Langganan Langsung Masa Nyata (Realtime Live Sync) dari Firebase Firestore
    const unsubscribeLiveBooks = subscribeToPublishedBooks((firestoreBooks) => {
      if (Array.isArray(firestoreBooks)) {
        const livePublishedList: EBook[] = firestoreBooks.map((b) => {
          const isFree = Boolean(b.isFree || Number(b.price) === 0);
          return {
            ...b,
            isFree,
            price: isFree ? 0 : Number(b.price) || 0,
          };
        });

        // Gabungkan naskhah rasmi platform bersama naskhah terbitan Firestore
        const catalogMap = new Map<string, EBook>();
        OFFICIAL_PUBLISHED_BOOKS.forEach((b) => catalogMap.set(b.id, b));
        livePublishedList.forEach((b) => catalogMap.set(b.id, b));

        const finalCatalog = Array.from(catalogMap.values()).sort((a, b) => {
          const timeA = a.createdAt || 0;
          const timeB = b.createdAt || 0;
          return timeB - timeA;
        });

        setBooks(finalCatalog);
      }
    });

    return () => {
      unsubscribeLiveBooks();
    };
  }, []);

  // Senarai ID Naskhah Karya Terbitan Sendiri (Sebagai Pengarang)
  const authorBookIds = useMemo(() => {
    let localMyIds: string[] = [];
    try {
      const raw = localStorage.getItem('karyadigital_my_author_book_ids');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localMyIds = parsed;
      }
    } catch (e) {}

    return books
      .filter((b) => localMyIds.includes(b.id) || isUserBookOwner(b, user))
      .map((b) => b.id);
  }, [user, books]);

  // Gabungan naskhah dibeli + naskhah karya sendiri yang sah (100% percuma untuk pengarang asal) + SEMUA naskhah percuma
  const effectiveOwnedBookIds = useMemo(() => {
    const freeBookIds = books.filter((b) => b.isFree || b.price === 0).map((b) => b.id);
    return Array.from(new Set([...user.ownedBookIds, ...authorBookIds, ...freeBookIds]));
  }, [user.ownedBookIds, authorBookIds, books]);

  // Global Security Protection Event Listeners (Sekat right-click dan copy)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const evalResult = evaluateSecurityAttempt('contextmenu');
      if (evalResult.shouldBlock && evalResult.alertMessage) {
        triggerSecurityWarning(evalResult.alertMessage, 'shield');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      const evalResult = evaluateSecurityAttempt('copy');
      if (evalResult.shouldBlock && evalResult.alertMessage) {
        triggerSecurityWarning(evalResult.alertMessage, 'warning');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const evalResult = evaluateSecurityAttempt('keydown', e.key, isCtrlOrMeta);
      if (evalResult.shouldBlock && evalResult.alertMessage) {
        e.preventDefault();
        triggerSecurityWarning(evalResult.alertMessage, 'shield');
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Simpan bakul belian pengguna ke localStorage apabila berlaku pertambahan atau pengurangan
  useEffect(() => {
    try {
      localStorage.setItem('karyadigital_user_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Ralat menyimpan bakul belian ke localStorage:', e);
    }
  }, [cart]);

  // Add Book to Cart
  const handleAddToCart = (book: EBook) => {
    if (user.ownedBookIds.includes(book.id)) {
      triggerSecurityWarning(`Anda sudah memiliki naskhah "${book.title}" dalam rak buku.`, 'info');
      handleOpenReader(book);
      return;
    }

    if (cart.some((item) => item.book.id === book.id)) {
      setIsCartOpen(true);
      return;
    }

    // If the book is free, add directly to user library!
    if (book.isFree || book.price === 0) {
      setUser((prev) => ({
        ...prev,
        ownedBookIds: [...prev.ownedBookIds, book.id],
      }));
      triggerSecurityWarning(
        `Naskhah percuma "${book.title}" berjaya ditambahkan ke Rak Perpustakaan anda!`,
        'info'
      );
      handleOpenReader(book);
      return;
    }

    setCart((prev) => [...prev, { book, addedAt: Date.now() }]);
    setIsCartOpen(true);
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (bookId: string) => {
    setCart((prev) => prev.filter((item) => item.book.id !== bookId));
  };

  // Open In-Browser Reader (supports resuming from bookmark)
  const handleOpenReader = (book: EBook, initialPage?: number) => {
    setActiveReadingBook(book);
    setReaderInitialPage(initialPage);
    setIsReaderOpen(true);
  };

  // Toggle bookmark for specific page and store in user profile state & localStorage
  const handleToggleBookmark = (newBookmark: BookmarkEntry) => {
    setUser((prev) => {
      const updatedBookmarks = toggleBookmarkInList(prev.bookmarks, newBookmark);
      try {
        localStorage.setItem(
          'karyadigital_user_bookmarks',
          JSON.stringify(updatedBookmarks)
        );
      } catch (e) {
        console.warn('Ralat menyimpan penanda buku ke localStorage:', e);
      }
      return {
        ...prev,
        bookmarks: updatedBookmarks,
      };
    });
  };

  // Remove specific bookmark by page number
  const handleRemoveBookmark = (bookId: string, pageNumber: number) => {
    setUser((prev) => {
      const updatedBookmarks = removeBookmarkFromList(prev.bookmarks, bookId, pageNumber);
      try {
        localStorage.setItem(
          'karyadigital_user_bookmarks',
          JSON.stringify(updatedBookmarks)
        );
      } catch (e) {
        console.warn('Ralat mengemas kini penanda buku:', e);
      }
      return {
        ...prev,
        bookmarks: updatedBookmarks,
      };
    });
  };

  // Listen to Firebase Auth state on mount
  useEffect(() => {
    const unsubscribeAuth = onUserAuthStateChange(async (fbUser) => {
      if (fbUser) {
        const cleanEmail = (fbUser.email || '').trim().toLowerCase();
        const isSuperAdmin = cleanEmail === 'mykaryadigital@gmail.com';
        const isBangKarim = cleanEmail === 'bangkarim79@gmail.com';
        const profile = await getUserProfileFromFirestore(fbUser.uid);

        setUser((prev) => {
          const userRole = isSuperAdmin
            ? 'admin'
            : isBangKarim
            ? 'author'
            : profile?.role || prev.role || 'reader';
          const isAuthor = isSuperAdmin || isBangKarim ? true : Boolean(profile?.isAuthor ?? prev.isAuthor);
          const defaultName = isBangKarim ? 'Bang Karim' : (fbUser.email ? fbUser.email.split('@')[0] : prev.name);

          return {
            ...prev,
            uid: fbUser.uid,
            name: fbUser.displayName || profile?.displayName || defaultName,
            email: fbUser.email || prev.email,
            photoURL: fbUser.photoURL || profile?.photoURL || undefined,
            isLoggedIn: true,
            role: userRole,
            isAuthor,
            ownedBookIds: prev.ownedBookIds,
            balance: profile?.balance ?? 0.0,
            tier: isSuperAdmin ? 'Super Admin Platform' : (profile?.tier || 'Pembaca Malaysia'),
          };
        });
      } else {
        setUser({
          name: 'Pembaca KaryaDigital',
          email: '',
          balance: 0.0,
          tier: 'Pembaca Malaysia',
          ownedBookIds: [],
          bookmarks: {},
          role: 'reader',
          isAuthor: false,
          isLoggedIn: false,
        });
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOutUser();
      try {
        localStorage.removeItem('karyadigital_owned_books');
        localStorage.removeItem('karyadigital_user_bookmarks');
      } catch (e) {}
      setUser({
        name: 'Pembaca KaryaDigital',
        email: '',
        balance: 0.0,
        tier: 'Pembaca Malaysia',
        ownedBookIds: [],
        bookmarks: {},
        role: 'reader',
        isAuthor: false,
        isLoggedIn: false,
      });
      triggerSecurityWarning('Anda telah berjaya log keluar dari akaun.', 'info');
    } catch (err: any) {
      console.warn('Gagal log keluar:', err);
    }
  };

  // Real-time Firestore sync for purchased books
  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      const unsubscribeBooks = subscribeToPurchasedBooks(currentUid, (firestoreBooks) => {
        const bookIds = Array.isArray(firestoreBooks) ? firestoreBooks.map((b) => b.bookId) : [];
        setUser((prev) => ({
          ...prev,
          ownedBookIds: bookIds,
        }));
      });
      return () => unsubscribeBooks();
    } else {
      try {
        const localOwned = localStorage.getItem('karyadigital_owned_books');
        if (localOwned) {
          const parsed = JSON.parse(localOwned);
          if (Array.isArray(parsed)) {
            setUser((prev) => ({ ...prev, ownedBookIds: parsed }));
            return;
          }
        }
      } catch (e) {}
      setUser((prev) => ({ ...prev, ownedBookIds: [] }));
    }
  }, [auth.currentUser?.uid]);

  // Handle Checkout Success & Sync with Firebase Firestore
  const handleCheckoutSuccess = async (
    purchasedBooks: EBook[],
    gateway: 'bcl' | 'toyyibpay' | 'manual' = 'bcl',
    txnRef = ''
  ) => {
    const newOwnedIds = purchasedBooks.map((b) => b.id);
    setUser((prev) => ({
      ...prev,
      ownedBookIds: Array.from(new Set([...prev.ownedBookIds, ...newOwnedIds])),
    }));
    setCart([]);

    // Simpan ke Firebase Firestore jika pengguna berdaftar
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      for (const b of purchasedBooks) {
        try {
          await savePurchasedBookToFirestore(currentUid, {
            bookId: b.id,
            title: b.title,
            author: b.author,
            coverImage: b.coverBadge || b.coverGradient,
            price: b.price,
            purchasedAt: new Date().toISOString(),
            paymentGateway: gateway,
            transactionId: txnRef || `TXN-${Date.now()}`,
            format: b.category === 'komik' ? 'comic' : 'epub',
          });
        } catch (err) {
          console.warn('[Firestore] Gagal menyimpan rekod buku:', err);
        }
      }
    }
  };

  // Handle Top Up
  const handleTopUp = (amount: number) => {
    setUser((prev) => ({
      ...prev,
      balance: +(prev.balance + amount).toFixed(2),
    }));
  };

  // Scroll to Catalogue
  const handleScrollToCatalog = () => {
    if (catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle Self-Publishing by Authors (Menyimpan secara kekal ke Cloudflare R2, Firestore & LocalStorage)
  const handlePublishBook = async (newBook: EBook) => {
    // Ikat identiti pengarang secara kukuh supaya orang lain tidak boleh menyunting
    const assignedUid = user.uid || (user.email ? `auth-${user.email}` : undefined);
    const assignedEmail = user.email || (user.isLoggedIn ? user.email : undefined);

    const bookWithAuthorAndTimestamp: EBook = {
      ...newBook,
      authorUid: newBook.authorUid || assignedUid,
      authorEmail: newBook.authorEmail || assignedEmail,
      createdAt: newBook.createdAt || Date.now(),
    };

    // Nyah-rekod daripada senarai naskhah dipadam jika ID naskhah sama
    setDeletedBookIds((prev) => {
      const updated = new Set(prev);
      updated.delete(bookWithAuthorAndTimestamp.id);
      try {
        localStorage.setItem('karyadigital_deleted_book_ids', JSON.stringify(Array.from(updated)));
      } catch (e) {}
      return updated;
    });

    const bookId = bookWithAuthorAndTimestamp.id;

    // 1. Simpan rekod kepunyaan dan fail manuskrip pada peranti ini
    try {
      const myPublishedIds: string[] = JSON.parse(localStorage.getItem('karyadigital_my_author_book_ids') || '[]');
      if (!myPublishedIds.includes(bookId)) {
        myPublishedIds.push(bookId);
        localStorage.setItem('karyadigital_my_author_book_ids', JSON.stringify(myPublishedIds));
      }

      // Pastikan pengarang memiliki naskhah mereka sendiri secara automatik di Rak Perpustakaan
      const currentOwned: string[] = JSON.parse(localStorage.getItem('karyadigital_owned_books') || '[]');
      if (!currentOwned.includes(bookId)) {
        currentOwned.push(bookId);
        localStorage.setItem('karyadigital_owned_books', JSON.stringify(currentOwned));
      }

      // Simpan fail manuskrip penuh ke IndexedDB (sangat selamat, tiada had kuota 5MB seperti localStorage)
      if (bookWithAuthorAndTimestamp.pdfUrl && bookWithAuthorAndTimestamp.pdfUrl.startsWith('data:')) {
        saveManuscriptToIndexedDb(
          bookId,
          bookWithAuthorAndTimestamp.pdfUrl,
          bookWithAuthorAndTimestamp.pdfFileName || `${bookWithAuthorAndTimestamp.title}.pdf`,
          'pdf'
        ).catch(console.warn);
      } else if (bookWithAuthorAndTimestamp.epubUrl && bookWithAuthorAndTimestamp.epubUrl.startsWith('data:')) {
        saveManuscriptToIndexedDb(
          bookId,
          bookWithAuthorAndTimestamp.epubUrl,
          bookWithAuthorAndTimestamp.epubFileName || `${bookWithAuthorAndTimestamp.title}.epub`,
          'epub'
        ).catch(console.warn);
      }

      // Simpan salinan naskhah ringan (metadata ~2KB) ke localStorage peranti supaya tidak pernah terkena ralat kuota
      const cleanBookForLocal: EBook = {
        ...bookWithAuthorAndTimestamp,
        pdfUrl: bookWithAuthorAndTimestamp.pdfUrl?.startsWith('data:')
          ? `/api/books/pdf/${bookId}`
          : bookWithAuthorAndTimestamp.pdfUrl,
        epubUrl: bookWithAuthorAndTimestamp.epubUrl?.startsWith('data:')
          ? `/api/books/epub/${bookId}`
          : bookWithAuthorAndTimestamp.epubUrl,
      };
      const currentPubList: EBook[] = JSON.parse(localStorage.getItem('karyadigital_published_books') || '[]');
      const updatedPubList = [cleanBookForLocal, ...currentPubList.filter((b) => b.id !== bookId)];
      localStorage.setItem('karyadigital_published_books', JSON.stringify(updatedPubList));
    } catch (e) {
      console.warn('Ralat menyimpan naskhah ke storan tempatan:', e);
    }

    // Masukkan ke dalam senarai ownedBookIds pengguna serta-merta
    setUser((prev) => ({
      ...prev,
      isAuthor: true,
      role: 'author',
      ownedBookIds: Array.from(new Set([...prev.ownedBookIds, bookId])),
    }));

    // Jika pengguna log masuk, simpan rekod pemilikan ke Firestore akaun pengguna
    if (user.uid) {
      savePurchasedBookToFirestore(user.uid, {
        bookId,
        title: bookWithAuthorAndTimestamp.title,
        author: bookWithAuthorAndTimestamp.author,
        coverImage: bookWithAuthorAndTimestamp.coverImage || bookWithAuthorAndTimestamp.coverBadge,
        price: bookWithAuthorAndTimestamp.price,
        purchasedAt: new Date().toISOString(),
        paymentGateway: 'manual',
        transactionId: `AUTHOR-${Date.now()}`,
        format: bookWithAuthorAndTimestamp.category === 'komik' ? 'comic' : 'epub',
      }).catch(console.warn);
    }

    // 2. Kemas kini segera katalog dalam state - letakkan naskhah TERBARU di bahagian PALING ATAS
    setBooks((prev) => [
      bookWithAuthorAndTimestamp,
      ...prev.filter((b) => b.id !== bookWithAuthorAndTimestamp.id),
    ]);

    // 3. Muat naik fail manuskrip ke Cloudflare R2 Object Storage melalui Server API
    let bookToBroadcast = bookWithAuthorAndTimestamp;
    try {
      const resp = await fetch('/api/books/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookWithAuthorAndTimestamp),
      });
      const data = await resp.json();
      if (data.success && data.book) {
        bookToBroadcast = data.book;
        console.log('[Cloudflare R2] Naskhah disimpan secara kekal dengan kunci R2:', data.r2Key);
      }
    } catch (err) {
      console.warn('[Server API] Gagal memuat naik naskhah ke Cloudflare R2 pelayan:', err);
    }

    // 4. Simpan naskhah ringan ke Firebase Firestore (Hanya ~2KB tanpa data binari berat)
    try {
      await saveBookToFirestore(bookToBroadcast);
      // Kemas kini state paparan dengan naskhah yang mempunyai pautan strim R2
      setBooks((prev) => [
        bookToBroadcast,
        ...prev.filter((b) => b.id !== bookToBroadcast.id),
      ]);
    } catch (err) {
      console.warn('[Firestore] Gagal menyimpan ke pangkalan data Firestore:', err);
    }

    // 5. Kemas kini peranan pengguna secara kekal ke Penulis Sah
    handleBecomeAuthor();

    triggerSecurityWarning(
      `Karya "${bookToBroadcast.title}" berjaya diterbitkan dan sedia dibaca dalam Rak Perpustakaan & Katalog!`,
      'info'
    );
  };

  // Open Edit Book Modal: HANYA PENGARANG ASAL DIBENARKAN (Super Admin tidak boleh menyunting naskhah orang lain demi privasi)
  const handleOpenEditBook = (book: EBook) => {
    const isOwner = isUserBookOwner(book, user);

    if (!isOwner) {
      triggerSecurityWarning(
        `Akses dinafikan: Demi menjaga privasi & hak cipta, hanya pengarang asal dibenarkan menyunting naskhah "${book.title}". Pihak pentadbir platform tidak dibenarkan mengubah isi penulisan pengarang lain.`,
        'warning'
      );
      return;
    }
    setEditingBook(book);
    setIsEditModalOpen(true);
  };

  // Save Edited Book: HANYA PENGARANG ASAL DIBENARKAN
  const handleSaveEditedBook = async (updatedBook: EBook) => {
    const isOwner = isUserBookOwner(editingBook || updatedBook, user);

    if (!isOwner) {
      triggerSecurityWarning(
        `Akses dinafikan: Anda bukan pengarang sah bagi naskhah "${updatedBook.title}". Kandungan karya dilindungi di bawah privasi & hak cipta pengarang asal.`,
        'warning'
      );
      return;
    }

    const isFree = Boolean(updatedBook.isFree || Number(updatedBook.price) === 0);
    const safeUpdatedBook: EBook = {
      ...updatedBook,
      isFree,
      price: isFree ? 0 : Number(updatedBook.price) || 0,
      authorUid: updatedBook.authorUid || editingBook?.authorUid || user.uid,
      authorEmail: updatedBook.authorEmail || editingBook?.authorEmail || user.email,
      updatedAt: Date.now(),
    };

    // Pastikan naskhah yang dikemas kini dinyah-padam daripada sebarang tombstone
    setDeletedBookIds((prev) => {
      const updated = new Set(prev);
      updated.delete(safeUpdatedBook.id);
      try {
        localStorage.setItem('karyadigital_deleted_book_ids', JSON.stringify(Array.from(updated)));
      } catch (e) {}
      return updated;
    });

    // 1. Simpan ke Pelayan / R2 dahulu untuk memproses sebarang fail PDF/EPUB besar
    let bookToSave = safeUpdatedBook;
    try {
      const resp = await fetch(`/api/books/${safeUpdatedBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeUpdatedBook),
      });
      const data = await resp.json();
      if (data.success && data.book) {
        bookToSave = data.book;
      }
    } catch (err) {
      console.warn('[Server API] Gagal mengemas kini naskhah:', err);
    }

    setBooks((prev) => prev.map((b) => (b.id === bookToSave.id ? bookToSave : b)));

    // 2. Simpan naskhah ringan terus ke Firestore (Realtime Live Sync ke semua pembaca)
    saveBookToFirestore(bookToSave).catch(console.warn);

    triggerSecurityWarning(`Naskhah "${bookToSave.title}" berjaya dikemas kini!`, 'info');
  };

  // Padam / Tarik Balik Naskhah secara Kekal (Menghalang sebarang resurrection pada refresh)
  const handleDeleteBook = (bookId: string) => {
    const targetBook = books.find((b) => b.id === bookId);
    if (!targetBook) return;

    const isOwner = isUserBookOwner(targetBook, user);
    const isSuperAdmin = user.role === 'admin' || user.email?.trim().toLowerCase() === 'mykaryadigital@gmail.com';

    if (!isOwner && !isSuperAdmin) {
      triggerSecurityWarning(
        `Akses dinafikan: Anda tidak mempunyai kebenaran untuk memadam naskhah "${targetBook.title}". Hanya pengarang asal atau Super Admin dibenarkan.`,
        'warning'
      );
      return;
    }

    // 1. Padam serta-merta daripada state paparan
    setBooks((prev) => prev.filter((b) => b.id !== bookId));

    // 2. Padam daripada Firestore (Single Source of Truth)
    deleteBookFromFirestore(bookId).catch(console.warn);

    // 3. Padam fail manuskrip daripada IndexedDB
    deleteManuscriptFromIndexedDb(bookId).catch(console.warn);

    // 4. Padam daripada Pelayan
    fetch(`/api/books/${bookId}`, { method: 'DELETE' }).catch(console.warn);

    // 5. Bersihkan semua kunci storan tempatan
    try {
      const myIds: string[] = JSON.parse(localStorage.getItem('karyadigital_my_author_book_ids') || '[]');
      const filtered = myIds.filter((id) => id !== bookId);
      localStorage.setItem('karyadigital_my_author_book_ids', JSON.stringify(filtered));

      const owned: string[] = JSON.parse(localStorage.getItem('karyadigital_owned_books') || '[]');
      const filteredOwned = owned.filter((id) => id !== bookId);
      localStorage.setItem('karyadigital_owned_books', JSON.stringify(filteredOwned));

      const pubList: any[] = JSON.parse(localStorage.getItem('karyadigital_published_books') || '[]');
      const filteredPub = pubList.filter((b) => b.id !== bookId);
      localStorage.setItem('karyadigital_published_books', JSON.stringify(filteredPub));
    } catch (e) {}

    triggerSecurityWarning(
      `Naskhah "${targetBook.title}" telah berjaya dipadam secara kekal.`,
      'info'
    );
  };

  // Padam Naskhah Muat Naik Sementara mengikut arahan pemilik/Super Admin
  const handlePurgeAllUploadedBooks = async () => {
    const allToPurge = books
      .filter((b) => b.id.startsWith('karya-user-'))
      .map((b) => b.id);

    if (allToPurge.length === 0) {
      triggerSecurityWarning('Tiada naskhah draf sementara untuk dipadam.', 'info');
      return;
    }

    setBooks((prev) => prev.filter((b) => !allToPurge.includes(b.id)));

    for (const id of allToPurge) {
      deleteBookFromFirestore(id).catch(console.warn);
    }

    triggerSecurityWarning(
      'Naskhah draf muat naik sementara telah dibersihkan daripada pangkalan data.',
      'info'
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 protected-content pb-16 md:pb-0 overflow-x-hidden w-full max-w-full">
      {/* Header & Navigation */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAuthModal={() => handleOpenAuthModal('login')}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        user={user}
        isAuthor={Boolean(user.isAuthor || user.role === 'author')}
        onOpenAuthorPortal={handleOpenAuthorPortal}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
      />

      {/* Hero Banner Section (shown when not searching and viewing main katalog) */}
      {!searchQuery && activeCategory !== 'koleksi' && (
        <HeroBanner
          onExploreClick={handleScrollToCatalog}
          onSelectCategory={setActiveCategory}
          onSelectGenre={setSelectedGenre}
          onSelectBook={(bookId) => {
            const found = books.find((b) => b.id === bookId);
            if (found) setSelectedDetailBook(found);
          }}
        />
      )}

      {/* Main Book Catalog Grid or Rak Saya Shelf */}
      <main ref={catalogRef} className="flex-1">
        {/* Sambung Membaca Section: Dialihkan sepenuhnya dari halaman Utama ke halaman "Rak Saya" */}
        {activeCategory === 'koleksi' && effectiveOwnedBookIds.length > 0 && (
          <ContinueReadingSection
            ownedBooks={books.filter((b) => effectiveOwnedBookIds.includes(b.id))}
            onRead={handleOpenReader}
            bookmarks={user.bookmarks}
            isInShelfPage={true}
          />
        )}
        <BookGrid
          books={books}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          ownedBookIds={effectiveOwnedBookIds}
          cartBookIds={cart.map((c) => c.book.id)}
          onRead={handleOpenReader}
          onAddToCart={handleAddToCart}
          onViewDetails={(book) => setSelectedDetailBook(book)}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          authorBookIds={authorBookIds}
          onOpenAuthorPortal={handleOpenAuthorPortal}
          onEditBook={handleOpenEditBook}
        />
      </main>

      {/* In-Browser Reader Modal */}
      <InBrowserReaderModal
        book={activeReadingBook}
        isOpen={isReaderOpen}
        onClose={() => {
          setIsReaderOpen(false);
          setReaderInitialPage(undefined);
        }}
        isOwned={activeReadingBook ? (effectiveOwnedBookIds.includes(activeReadingBook.id) || isUserBookOwner(activeReadingBook, user)) : false}
        isAuthorOrAdmin={activeReadingBook ? (isUserBookOwner(activeReadingBook, user) || user.role === 'admin' || user.email?.trim().toLowerCase() === 'mykaryadigital@gmail.com') : false}
        onAddToCart={handleAddToCart}
        onTriggerSecurityWarning={triggerSecurityWarning}
        buyerEmail={user.email}
        initialPageNumber={readerInitialPage}
        bookmarks={activeReadingBook ? user.bookmarks[activeReadingBook.id] || [] : []}
        onToggleBookmark={handleToggleBookmark}
        onRemoveBookmark={(pageNum) => {
          if (activeReadingBook) {
            handleRemoveBookmark(activeReadingBook.id, pageNum);
          }
        }}
      />

      {/* Cart Drawer Slide-over */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemoveItem={handleRemoveFromCart}
        onCheckoutSuccess={(purchased) => handleCheckoutSuccess(purchased, 'manual')}
        voucherCode={voucherCode}
        onApplyVoucher={(code) => setVoucherCode(code)}
        onTriggerToyyibPay={(billData) => setToyyibPayBill(billData)}
        onTriggerBclPayment={(billData) => setBclBill(billData)}
        currentUserEmail={user.email}
        currentUserName={user.name}
        isLoggedIn={Boolean(user.isLoggedIn)}
        onOpenAuthModal={() => handleOpenAuthModal('login', 'Log masuk untuk simpan naskhah ke akaun anda.')}
      />

      {/* Account Profile Modal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        user={{ ...user, ownedBookIds: effectiveOwnedBookIds }}
        allBooks={books}
        onTopUpBalance={handleTopUp}
        onReadBook={handleOpenReader}
        onViewSecureAsset={(bookId, bookTitle) =>
          setSecureAssetModal({ isOpen: true, bookId, bookTitle })
        }
        onEditBook={handleOpenEditBook}
        firebaseUser={auth.currentUser}
        onSignInGoogle={signInWithGoogle}
        onSignOut={handleSignOut}
        onOpenAuthModal={() => handleOpenAuthModal('login')}
        onOpenAuthorPortal={handleOpenAuthorPortal}
        isAuthor={Boolean(user.isAuthor || user.role === 'author')}
        onToggleAuthorRole={handleToggleAuthorRole}
        onOpenReaderHelp={handleOpenReaderHelp}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
      />

      {/* BCL (Bayarcash Commerce Layer) Payment Portal Modal */}
      <BclPaymentModal
        isOpen={!!bclBill}
        onClose={() => setBclBill(null)}
        billData={bclBill}
        onPaymentSuccess={(orderId, billCode) => {
          if (bclBill?.purchasedBooks) {
            handleCheckoutSuccess(bclBill.purchasedBooks, 'bcl', billCode);
          }
          triggerSecurityWarning(
            `Bayaran BCL (Bayarcash) berjaya disahkan! Rekod telah disimpan dalam Firebase Firestore.`,
            'info'
          );
        }}
      />

      {/* ToyyibPay Payment Portal Modal (FPX / Webhook) */}
      <ToyyibPayModal
        isOpen={!!toyyibPayBill}
        onClose={() => setToyyibPayBill(null)}
        billData={toyyibPayBill}
        onPaymentSuccess={(orderId, billCode) => {
          if (toyyibPayBill?.purchasedBooks) {
            handleCheckoutSuccess(toyyibPayBill.purchasedBooks, 'toyyibpay', billCode);
          }
          triggerSecurityWarning(
            `Bayaran ToyyibPay berjaya disahkan! Kod Bil ${billCode} telah diaktifkan dalam perpustakaan.`,
            'info'
          );
        }}
      />

      {/* Cloudflare R2 Secure Asset Modal (Signed URL) */}
      <SecureAssetModal
        isOpen={!!secureAssetModal?.isOpen}
        onClose={() => setSecureAssetModal(null)}
        bookId={secureAssetModal?.bookId || ''}
        bookTitle={secureAssetModal?.bookTitle || ''}
        userEmail={user.email}
      />

      {/* Security Toast Warnings */}
      <SecurityBannerToast
        toasts={securityToasts}
        onDismiss={(id) => setSecurityToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedDetailBook}
        isOpen={!!selectedDetailBook}
        onClose={() => setSelectedDetailBook(null)}
        isOwned={selectedDetailBook ? (effectiveOwnedBookIds.includes(selectedDetailBook.id) || isUserBookOwner(selectedDetailBook, user)) : false}
        isInCart={selectedDetailBook ? cart.some((c) => c.book.id === selectedDetailBook.id) : false}
        onRead={(b) => {
          setSelectedDetailBook(null);
          handleOpenReader(b);
        }}
        onAddToCart={(b) => handleAddToCart(b)}
        currentUserName={user.isLoggedIn && user.name && user.name !== 'Pembaca KaryaDigital' ? user.name : ''}
      />

      {/* Portal Penulis & Dashboard Penulis Modal */}
      <AuthorPublishModal
        isOpen={isAuthorPortalOpen}
        onClose={() => setIsAuthorPortalOpen(false)}
        onPublishBook={handlePublishBook}
        currentUserName={user.name}
        currentUserEmail={user.email}
        currentUserUid={user.uid}
        isAuthor={Boolean(user.isAuthor || user.role === 'author')}
        initialTab={authorPortalTab}
        onBecomeAuthor={handleBecomeAuthor}
        authorBooks={books.filter((b) => {
          const isSuperAdmin =
            user.role === 'admin' ||
            user.email?.trim().toLowerCase() === 'mykaryadigital@gmail.com';
          if (isSuperAdmin) {
            // Super Admin dapat melihat semua naskhah yang diterbitkan di platform untuk tujuan pengurusan & royalti
            return b.id.startsWith('karya-') || Boolean(b.createdAt) || isUserBookOwner(b, user);
          }
          if (user.isLoggedIn) {
            return isUserBookOwner(b, user);
          }
          try {
            const myIds: string[] = JSON.parse(localStorage.getItem('karyadigital_my_author_book_ids') || '[]');
            return myIds.includes(b.id);
          } catch (e) {
            return false;
          }
        })}
        onEditBook={handleOpenEditBook}
        onDeleteBook={handleDeleteBook}
        onOpenAuthModal={() => handleOpenAuthModal('login')}
      />

      {/* Reader Help Modal (Panduan Membaca dalam Pelayar, FAQ & Bayaran, Polisi Privasi & Terma) */}
      <ReaderHelpModal
        isOpen={readerHelpState.isOpen}
        initialTab={readerHelpState.tab}
        onClose={() => setReaderHelpState((prev) => ({ ...prev, isOpen: false }))}
        onExploreClick={() => {
          setReaderHelpState((prev) => ({ ...prev, isOpen: false }));
          handleScrollToCatalog();
        }}
      />

      {/* Footer */}
      <Footer
        isAuthor={Boolean(user.isAuthor || user.role === 'author')}
        isLoggedIn={Boolean(user.isLoggedIn)}
        isAdmin={Boolean(user.email?.trim().toLowerCase() === 'mykaryadigital@gmail.com' || user.role === 'admin')}
        onOpenAuthorPortal={handleOpenAuthorPortal}
        onOpenReaderHelp={handleOpenReaderHelp}
        onOpenAuthModal={() => handleOpenAuthModal('login')}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
      />

      {/* Auth Modal (Log Masuk / Daftar Akaun) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        redirectMessage={authModalMessage}
        onSuccess={() => {
          triggerSecurityWarning('Log masuk berjaya disahkan!', 'info');
        }}
      />

      {/* Super Admin Dashboard Modal */}
      <AdminDashboardModal
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        books={books}
        currentUser={user}
        onPreviewBook={handleOpenReader}
        onEditBook={handleOpenEditBook}
        onDeleteBook={handleDeleteBook}
        onPurgeAllBooks={handlePurgeAllUploadedBooks}
      />

      {/* Edit Book Modal (Kemas Kini Butiran & Tarik Balik Naskhah) */}
      {isEditModalOpen && (
        <EditBookModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingBook(null);
          }}
          book={editingBook}
          onSave={handleSaveEditedBook}
          onDelete={handleDeleteBook}
        />
      )}

      {/* Mobile Bottom Navigation Bar (Utama, Cari, Rak Saya, Akaun) */}
      <MobileBottomNav
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setSearchQuery('');
          handleScrollToCatalog();
        }}
        ownedBooksCount={effectiveOwnedBookIds.length}
        onOpenSearch={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (input) input.focus();
        }}
        onOpenAccount={() => setIsAccountOpen(true)}
        isSearchActive={!!searchQuery}
        isLoggedIn={Boolean(user.isLoggedIn)}
      />

      {/* Offline Connectivity Toast Indicator */}
      <OfflineIndicator />
    </div>
  );
}
