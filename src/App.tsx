/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { Footer } from './components/Footer.tsx';
import { INITIAL_EBOOKS } from './data/ebooksData.ts';
import { EBook, CartItem, UserProfile, BookCategory, SecurityToastEvent, BookmarkEntry } from './types/ebook.ts';
import { evaluateSecurityAttempt, toggleBookmarkInList, removeBookmarkFromList } from './utils/ebookLogic.ts';
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
} from './firebase.ts';

export default function App() {
  const [books, setBooks] = useState<EBook[]>(INITIAL_EBOOKS);
  const [activeCategory, setActiveCategory] = useState<'semua' | BookCategory | 'percuma' | 'koleksi'>('semua');
  const [selectedGenre, setSelectedGenre] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>(() => [
    { book: INITIAL_EBOOKS[1], addedAt: Date.now() - 60000 },
    { book: INITIAL_EBOOKS[2], addedAt: Date.now() - 30000 },
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAuthorPortalOpen, setIsAuthorPortalOpen] = useState(false);
  const [activeReadingBook, setActiveReadingBook] = useState<EBook | null>(null);
  const [selectedDetailBook, setSelectedDetailBook] = useState<EBook | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState<string>('KARYALOKAL');
  const [securityToasts, setSecurityToasts] = useState<SecurityToastEvent[]>([]);

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

  // User Profile State (Simulating registered Malaysian reader & syncing with Firebase / LocalStorage)
  const [user, setUser] = useState<UserProfile>(() => {
    let savedBookmarks: Record<string, BookmarkEntry[]> = {
      'novel-maktok': [
        {
          id: 'novel-maktok-bm',
          bookId: 'novel-maktok',
          pageNumber: 2,
          totalSteps: 2,
          chapterIndex: 1,
          chapterTitle: 'Bab 2: Rahsia Sambal Tempoyak Daun Kayu',
          excerpt: 'Tujuh jenis daun herba hutan dicari sendiri oleh Mak Tok...',
          savedAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
      'novel-4': [
        {
          id: 'novel-4-p1',
          bookId: 'novel-4',
          pageNumber: 1,
          totalSteps: 3,
          chapterIndex: 0,
          chapterTitle: 'Bab 1: Asas Manuskrip',
          excerpt: 'Langkah pertama seorang penulis bermula dengan keberanian menulis baris pertama...',
          savedAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    };
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

    return {
      name: 'Aina Zulkifli',
      email: 'aina@karyadigital.my',
      balance: 45.0,
      tier: 'Pembaca VIP Malaysia',
      ownedBookIds: ['novel-maktok', 'novel-4'], // Naskhah Mak Tok sudah dalam rak untuk Sambung Membaca
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

  // Muat turun naskhah yang diterbitkan daripada Cloudflare R2 / Stor Pelayan / Firestore / LocalStorage
  useEffect(() => {
    const mergeBooks = (newBooks: EBook[]) => {
      if (!newBooks.length) return;
      setBooks((prev) => {
        const showcaseIds = new Set(INITIAL_EBOOKS.slice(0, 10).map((b) => b.id));
        const showcaseBooks = INITIAL_EBOOKS.slice(0, 10);
        const otherPrev = prev.filter((b) => !showcaseIds.has(b.id));
        const otherMap = new Map(otherPrev.map((b) => [b.id, b]));
        for (const nb of newBooks) {
          if (!showcaseIds.has(nb.id)) {
            otherMap.set(nb.id, nb);
          }
        }
        return [...showcaseBooks, ...Array.from(otherMap.values())];
      });
    };

    // A. Muat turun dari LocalStorage serta merta
    try {
      const localSaved = localStorage.getItem('karyadigital_published_books');
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          mergeBooks(parsed);
        }
      }
    } catch (err) {
      console.warn('Ralat membaca localStorage:', err);
    }

    // B. Muat turun dari Cloudflare R2 / Server Storan Kekal
    fetch('/api/books/published')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.books) && data.books.length > 0) {
          mergeBooks(data.books);
        }
      })
      .catch((err) => console.warn('Ralat Cloudflare R2 API:', err));

    // C. Muat turun dari Firebase Firestore
    getPublishedBooksFromFirestore()
      .then((firestoreBooks) => {
        if (Array.isArray(firestoreBooks) && firestoreBooks.length > 0) {
          mergeBooks(firestoreBooks as EBook[]);
        }
      })
      .catch((err) => console.warn('Ralat Firestore:', err));
  }, []);

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
        const isSuperAdmin = fbUser.email?.trim().toLowerCase() === 'mykaryadigital@gmail.com';
        const profile = await getUserProfileFromFirestore(fbUser.uid);
        setUser((prev) => {
          const userRole = isSuperAdmin ? 'admin' : (profile?.role || prev.role || 'reader');
          const isAuthor = isSuperAdmin ? true : Boolean(profile?.isAuthor ?? prev.isAuthor);
          return {
            ...prev,
            uid: fbUser.uid,
            name: fbUser.displayName || profile?.displayName || prev.name,
            email: fbUser.email || prev.email,
            photoURL: fbUser.photoURL || profile?.photoURL || undefined,
            isLoggedIn: true,
            role: userRole,
            isAuthor,
            tier: isSuperAdmin ? 'Super Admin Platform' : (profile?.tier || prev.tier),
          };
        });
      } else {
        setUser((prev) => ({
          ...prev,
          uid: undefined,
          photoURL: undefined,
          isLoggedIn: false,
        }));
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser((prev) => ({
        ...prev,
        uid: undefined,
        photoURL: undefined,
        isLoggedIn: false,
      }));
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
        if (firestoreBooks && firestoreBooks.length > 0) {
          const bookIds = firestoreBooks.map((b) => b.bookId);
          setUser((prev) => ({
            ...prev,
            ownedBookIds: Array.from(new Set([...prev.ownedBookIds, ...bookIds])),
          }));
        }
      });
      return () => unsubscribeBooks();
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
    // 1. Kemas kini segera katalog dalam state (mengekalkan 10 naskhah showcase utama)
    setBooks((prev) => {
      const showcaseIds = new Set(INITIAL_EBOOKS.slice(0, 10).map((b) => b.id));
      const showcaseBooks = INITIAL_EBOOKS.slice(0, 10);
      const remaining = prev.filter((b) => !showcaseIds.has(b.id) && b.id !== newBook.id);
      return [...showcaseBooks, newBook, ...remaining];
    });

    // 2. Simpan secara kekal ke LocalStorage
    try {
      const existingLocal = JSON.parse(localStorage.getItem('karyadigital_published_books') || '[]');
      const updatedLocal = [newBook, ...existingLocal.filter((b: EBook) => b.id !== newBook.id)];
      localStorage.setItem('karyadigital_published_books', JSON.stringify(updatedLocal));
    } catch (err) {
      console.warn('Ralat menyimpan ke localStorage:', err);
    }

    // 3. Muat naik & simpan ke Cloudflare R2 Object Storage melalui Server API
    try {
      const resp = await fetch('/api/books/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      });
      const data = await resp.json();
      if (data.success) {
        console.log('[Cloudflare R2] Naskhah disimpan secara kekal dengan kunci R2:', data.r2Key);
      }
    } catch (err) {
      console.warn('[Server API] Gagal memuat naik naskhah ke Cloudflare R2 pelayan:', err);
    }

    // 4. Simpan ke Firebase Firestore
    try {
      await saveBookToFirestore(newBook);
    } catch (err) {
      console.warn('[Firestore] Gagal menyimpan ke pangkalan data Firestore:', err);
    }

    // 5. Kemas kini peranan pengguna secara kekal ke Penulis Sah
    handleBecomeAuthor();

    triggerSecurityWarning(
      `Karya "${newBook.title}" berjaya dimuat naik ke Cloudflare R2 dan disimpan secara kekal!`,
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
        {activeCategory === 'koleksi' && user.ownedBookIds.length > 0 && (
          <ContinueReadingSection
            ownedBooks={books.filter((b) => user.ownedBookIds.includes(b.id))}
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
          ownedBookIds={user.ownedBookIds}
          cartBookIds={cart.map((c) => c.book.id)}
          onRead={handleOpenReader}
          onAddToCart={handleAddToCart}
          onViewDetails={(book) => setSelectedDetailBook(book)}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
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
        isOwned={activeReadingBook ? user.ownedBookIds.includes(activeReadingBook.id) : false}
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
        user={user}
        allBooks={books}
        onTopUpBalance={handleTopUp}
        onReadBook={handleOpenReader}
        onViewSecureAsset={(bookId, bookTitle) =>
          setSecureAssetModal({ isOpen: true, bookId, bookTitle })
        }
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
        isOwned={selectedDetailBook ? user.ownedBookIds.includes(selectedDetailBook.id) : false}
        isInCart={selectedDetailBook ? cart.some((c) => c.book.id === selectedDetailBook.id) : false}
        onRead={(b) => {
          setSelectedDetailBook(null);
          handleOpenReader(b);
        }}
        onAddToCart={(b) => handleAddToCart(b)}
      />

      {/* Portal Penulis & Dashboard Penulis Modal */}
      <AuthorPublishModal
        isOpen={isAuthorPortalOpen}
        onClose={() => setIsAuthorPortalOpen(false)}
        onPublishBook={handlePublishBook}
        currentUserName={user.name}
        isAuthor={Boolean(user.isAuthor || user.role === 'author')}
        initialTab={authorPortalTab}
        onBecomeAuthor={handleBecomeAuthor}
        authorBooks={books.filter(
          (b) =>
            b.author.toLowerCase() === user.name.toLowerCase() ||
            b.id.startsWith('karya-user-')
        )}
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
      />

      {/* Mobile Bottom Navigation Bar (Utama, Cari, Rak Saya, Akaun) */}
      <MobileBottomNav
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setSearchQuery('');
          handleScrollToCatalog();
        }}
        ownedBooksCount={user.ownedBookIds.length}
        onOpenSearch={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (input) input.focus();
        }}
        onOpenAccount={() => setIsAccountOpen(true)}
        isSearchActive={!!searchQuery}
        isLoggedIn={Boolean(user.isLoggedIn)}
      />
    </div>
  );
}
