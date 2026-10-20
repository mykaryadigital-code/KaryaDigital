/**
 * @file supabase.ts
 * Integrasi Pangkalan Data Supabase (PostgreSQL) untuk Platform E-Book KaryaDigital.
 * Mengendalikan rekod pesanan, pemilikan buku pengguna, dan status lesen.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Baca konfigurasi env
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http')) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });
    console.log('[Supabase] Berjaya disambungkan ke Supabase Cloud DB.');
  } catch (err) {
    console.warn('[Supabase] Gagal menginisialisasi client Supabase, menggunakan storan memori sandaran.', err);
  }
} else {
  console.log('[Supabase] Kunci SUPABASE_URL belum dikonfigurasi. Menggunakan in-memory store aktif untuk prototaip.');
}

// In-Memory Fallback Store (Memastikan aplikasi boleh diuji serta-merta tanpa perlu setup cloud database terlebih dahulu)
interface InMemoryDb {
  orders: Record<string, {
    orderId: string;
    billCode: string;
    bookId: string;
    bookTitle: string;
    userEmail: string;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    transactionId?: string;
    createdAt: string;
    paidAt?: string;
  }>;
  userLibrary: Record<string, {
    bookIds: string[];
    updatedAt: string;
  }>;
}

const memoryDb: InMemoryDb = {
  orders: {},
  userLibrary: {
    'mykaryadigital@gmail.com': {
      bookIds: ['novel-4'], // Naskhah percuma sedia ada
      updatedAt: new Date().toISOString(),
    },
  },
};

/**
 * Cipta pesanan baharu dengan status 'PENDING'
 */
export async function createOrderRecord(params: {
  orderId: string;
  billCode: string;
  bookId: string;
  bookTitle: string;
  userEmail: string;
  amount: number;
  gateway?: string;
}) {
  const { orderId, billCode, bookId, bookTitle, userEmail, amount, gateway = 'toyyibpay' } = params;

  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_id: orderId,
        bill_code: billCode,
        book_id: bookId,
        book_title: bookTitle,
        user_email: userEmail,
        amount_myr: amount,
        payment_status: 'PENDING',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Ralat menyimpan pesanan:', error.message);
    } else {
      return data;
    }
  }

  // Simpan dalam memori sandaran
  const record = {
    orderId,
    billCode,
    bookId,
    bookTitle,
    userEmail,
    amount,
    gateway,
    status: 'PENDING' as const,
    createdAt: new Date().toISOString(),
  };

  memoryDb.orders[billCode] = record;
  memoryDb.orders[orderId] = record;

  return record;
}

/**
 * Kemas kini status pesanan ToyyibPay (SUCCESS / FAILED)
 * dan buka akses buku dalam perpustakaan pengguna secara automatik.
 */
export async function markOrderPaidAndUnlockBook(params: {
  billCode: string;
  transactionId: string;
  status: 'SUCCESS' | 'FAILED';
  paidAmount?: number;
}) {
  const { billCode, transactionId, status, paidAmount } = params;
  let orderInfo = memoryDb.orders[billCode] || Object.values(memoryDb.orders).find(o => o.orderId === billCode || o.billCode === billCode);

  if (supabase) {
    const { data: dbOrder, error: orderErr } = await supabase
      .from('orders')
      .update({
        payment_status: status,
        transaction_id: transactionId,
        paid_at: new Date().toISOString(),
      })
      .eq('bill_code', billCode)
      .select()
      .single();

    if (!orderErr && dbOrder) {
      if (status === 'SUCCESS') {
        // Masukkan buku ke dalam jadual user_library
        await supabase.from('user_library').upsert(
          {
            user_email: dbOrder.user_email,
            book_id: dbOrder.book_id,
            unlocked_at: new Date().toISOString(),
            order_id: dbOrder.order_id,
          },
          { onConflict: 'user_email,book_id' }
        );
      }
      return { success: true, order: dbOrder };
    }
  }

  // Fallback in-memory
  if (orderInfo) {
    orderInfo.status = status;
    orderInfo.transactionId = transactionId;
    orderInfo.paidAt = new Date().toISOString();

    if (status === 'SUCCESS') {
      const email = orderInfo.userEmail;
      if (!memoryDb.userLibrary[email]) {
        memoryDb.userLibrary[email] = { bookIds: [], updatedAt: new Date().toISOString() };
      }
      if (!memoryDb.userLibrary[email].bookIds.includes(orderInfo.bookId)) {
        memoryDb.userLibrary[email].bookIds.push(orderInfo.bookId);
        memoryDb.userLibrary[email].updatedAt = new Date().toISOString();
      }
    }
    return { success: true, order: orderInfo };
  }

  return { success: false, error: 'Pesanan tidak ditemui untuk bill code: ' + billCode };
}

/**
 * Dapatkan senarai ID buku yang dimiliki oleh pengguna
 */
export async function getUserUnlockedBookIds(userEmail: string): Promise<string[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('user_library')
      .select('book_id')
      .eq('user_email', userEmail);

    if (!error && data) {
      return data.map((row: any) => row.book_id);
    }
  }

  // Fallback memori
  const record = memoryDb.userLibrary[userEmail];
  return record ? record.bookIds : ['novel-4'];
}
