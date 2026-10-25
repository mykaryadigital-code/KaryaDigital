/**
 * @file orderStore.ts
 * Pengurusan rekod pesanan dan hak milik buku di pelayan.
 * Berfungsi sebagai modul pesanan tunggal yang selamat dan bebas daripada kebergantungan Supabase luaran.
 */

export interface OrderRecord {
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
  gateway?: string;
}

// Storan pesanan di pelayan
const ordersByBillCode: Map<string, OrderRecord> = new Map();
const userUnlockedBooks: Map<string, Set<string>> = new Map();

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
}): Promise<OrderRecord> {
  const { orderId, billCode, bookId, bookTitle, userEmail, amount, gateway = 'toyyibpay' } = params;

  const record: OrderRecord = {
    orderId,
    billCode,
    bookId,
    bookTitle,
    userEmail: userEmail.toLowerCase().trim(),
    amount,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    gateway,
  };

  ordersByBillCode.set(billCode, record);
  console.log(`[OrderStore] Pesanan dicipta: ${orderId} (Bil: ${billCode}, RM ${amount})`);
  return record;
}

/**
 * Mengesahkan pembayaran dan membuka akses buku
 */
export async function markOrderPaidAndUnlockBook(params: {
  billCode: string;
  transactionId?: string;
  status: 'SUCCESS' | 'FAILED';
  paidAmount?: number;
}): Promise<{ success: boolean; bookId?: string; userEmail?: string }> {
  const { billCode, transactionId, status } = params;

  const record = ordersByBillCode.get(billCode);
  if (!record) {
    console.warn(`[OrderStore] Bil tidak ditemui: ${billCode}`);
    return { success: false };
  }

  record.status = status;
  record.transactionId = transactionId || `TXN-${Date.now()}`;
  if (status === 'SUCCESS') {
    record.paidAt = new Date().toISOString();

    const normalizedEmail = record.userEmail.toLowerCase().trim();
    if (!userUnlockedBooks.has(normalizedEmail)) {
      userUnlockedBooks.set(normalizedEmail, new Set());
    }
    userUnlockedBooks.get(normalizedEmail)!.add(record.bookId);

    console.log(`[OrderStore] Pembayaran BERJAYA untuk bil ${billCode}. Buku ${record.bookId} dibuka untuk ${normalizedEmail}`);
    return { success: true, bookId: record.bookId, userEmail: normalizedEmail };
  }

  console.log(`[OrderStore] Pembayaran GAGAL untuk bil ${billCode}`);
  return { success: false, bookId: record.bookId, userEmail: record.userEmail };
}

/**
 * Mengambil senarai ID buku yang telah dibeli oleh pengguna
 */
export async function getUserUnlockedBookIds(userEmail: string): Promise<string[]> {
  const normalizedEmail = userEmail.toLowerCase().trim();
  const set = userUnlockedBooks.get(normalizedEmail);
  return set ? Array.from(set) : [];
}

/**
 * Mengambil maklumat pesanan berdasarkan billCode
 */
export function getOrderRecord(billCode: string): OrderRecord | undefined {
  return ordersByBillCode.get(billCode);
}
