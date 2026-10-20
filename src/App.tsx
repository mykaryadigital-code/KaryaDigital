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
import { FreemiumSection } from './components/FreemiumSection.tsx';
import { Footer } from './components/Footer.tsx';
import { INITIAL_EBOOKS } from './data/ebooksData.ts';
import { EBook, CartItem, UserProfile, BookCategory, SecurityToastEvent } from './types/ebook.ts';
import { evaluateSecurityAttempt } from './utils/ebookLogic.ts';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  onUserAuthStateChange,
  subscribeToPurchasedBooks,
  savePurchasedBookToFirestore,
  recordOrderInFirestore,
} from './firebase.ts';

export default function App() {
  const [books] = useState<EBook[]>(INITIAL_EBOOKS);
  const [activeCategory, setActiveCategory] = useState<'semua' | BookCategory | 'percuma' | 'koleksi'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [activeReadingBook, setActiveReadingBook] = useState<EBook | null>(null);
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

  // User Profile State (Simulating registered Malaysian reader & syncing with Firebase)
  const [user, setUser] = useState<UserProfile>({
    name: 'Ahmad Danial',
    email: 'mykaryadigital@gmail.com',
    balance: 45.0,
    tier: 'Pembaca VIP Malaysia',
    ownedBookIds: ['novel-4'], // Naskhah percuma sudah ada dalam rak
    bookmarks: {},
  });

  const catalogRef = useRef<HTMLDivElement>(null);

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

  // Open In-Browser Reader
  const handleOpenReader = (book: EBook) => {
    setActiveReadingBook(book);
    setIsReaderOpen(true);
  };

  // Listen to Firebase Auth state on mount
  useEffect(() => {
    const unsubscribeAuth = onUserAuthStateChange((fbUser) => {
      if (fbUser) {
        setUser((prev) => ({
          ...prev,
          name: fbUser.displayName || prev.name,
          email: fbUser.email || prev.email,
        }));
      }
    });
    return () => unsubscribeAuth();
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 protected-content">
      {/* Header & Navigation */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        user={user}
      />

      {/* Hero Banner Section (shown when not searching and viewing main katalog) */}
      {!searchQuery && activeCategory !== 'koleksi' && (
        <HeroBanner
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            handleScrollToCatalog();
          }}
          onExploreClick={handleScrollToCatalog}
          onCopyVoucher={(code) => {
            setVoucherCode(code);
            triggerSecurityWarning(`Kod baucar "${code}" berjaya disalin!`, 'info');
          }}
        />
      )}

      {/* Main Book Catalog Grid */}
      <main ref={catalogRef} className="flex-1">
        <BookGrid
          books={books}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          ownedBookIds={user.ownedBookIds}
          cartBookIds={cart.map((c) => c.book.id)}
          onRead={handleOpenReader}
          onAddToCart={handleAddToCart}
          searchQuery={searchQuery}
        />
      </main>

      {/* Freemium Hook Section: Mula Membaca Secara Percuma */}
      {!searchQuery && activeCategory !== 'koleksi' && (
        <FreemiumSection
          books={books}
          onRead={handleOpenReader}
          onAddToCart={handleAddToCart}
          ownedBookIds={user.ownedBookIds}
        />
      )}

      {/* In-Browser Reader Modal */}
      <InBrowserReaderModal
        book={activeReadingBook}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        isOwned={activeReadingBook ? user.ownedBookIds.includes(activeReadingBook.id) : false}
        onAddToCart={handleAddToCart}
        onTriggerSecurityWarning={triggerSecurityWarning}
        buyerEmail={user.email}
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
        onSignOut={signOutUser}
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
