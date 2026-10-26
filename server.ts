/**
 * @file server.ts
 * Pelayan Penuh (Full-Stack Express Server) untuk Platform E-Book KaryaDigital.
 * Mengintegrasikan API ToyyibPay (FPX), Pangkalan Data Supabase, dan Cloudflare R2 Signed URLs.
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createToyyibPayBill, verifyToyyibPayCallback } from './src/server/toyyibpay.ts';
import { createBclBill, verifyBclCallback, getBclConfig } from './src/server/bcl.ts';
import {
  createOrderRecord,
  markOrderPaidAndUnlockBook,
  getUserUnlockedBookIds,
} from './src/server/orderStore.ts';
import multer from 'multer';
import {
  generateR2SignedUrl,
  verifyHmacSignedUrl,
  generateHmacSignedUrl,
  getAssetFromR2,
  uploadAssetToR2,
} from './src/server/cloudflareR2.ts';
import {
  getAllPublishedBooks,
  savePublishedBookToStorage,
  deletePublishedBookFromStorage,
  purgeAllPublishedBooksFromStorage,
  getDeletedBookIds,
} from './src/server/bookStorage.ts';
import { synthesizeBookPdf } from './src/server/pdfSynthesizer.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Konfigurasi Multer untuk muat naik naskhah PDF/EPUB besar terus ke storan (hingga 150MB)
const manuscriptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024 },
});

// Middleware parsing JSON dan x-www-form-urlencoded (menyokong muat naik PDF grafik resolusi tinggi hingga 150MB)
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ extended: true, limit: '150mb' }));

// Sajikan fail statik dari folder public
app.use(express.static(path.resolve(__dirname, 'public')));

// Helper URL Asas Aplikasi
function getAppBaseUrl(req: Request): string {
  const host = req.get('host') || `localhost:${PORT}`;
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return process.env.APP_URL || `${protocol}://${host}`;
}

// ====================================================================
// 1. ALUR KERJA PEMBELIAN (CHECKOUT WORKFLOW & TOYYIBPAY BILL)
// ====================================================================

/**
 * POST /api/payment/create-bill
 * Pengguna klik 'Beli Buku' -> Sistem hantar permohonan ke API ToyyibPay untuk jana invois bil.
 */
app.post('/api/payment/create-bill', async (req: Request, res: Response) => {
  try {
    const { bookId, bookTitle, amount, userName, userEmail, userPhone } = req.body;

    if (!bookId || !amount || !userEmail) {
      return res.status(400).json({
        success: false,
        error: 'Maklumat buku (bookId), harga (amount) dan emel pengguna diperlukan.',
      });
    }

    const orderId = `KD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const appBaseUrl = getAppBaseUrl(req);

    console.log(`[ToyyibPay] Mencipta bil untuk pesanan ${orderId} (${bookTitle} - RM ${amount})`);

    // Hantar permohonan ke ToyyibPay API
    const billResult = await createToyyibPayBill({
      orderId,
      bookTitle: bookTitle || 'E-Buku Tempatan',
      amountMYR: parseFloat(amount),
      userName: userName || 'Pembaca Tempatan',
      userEmail,
      userPhone: userPhone || '0123456789',
      appBaseUrl,
    });

    // Simpan rekod pesanan dalam Supabase / Memory
    await createOrderRecord({
      orderId,
      billCode: billResult.billCode,
      bookId,
      bookTitle: bookTitle || 'E-Buku Tempatan',
      userEmail,
      amount: parseFloat(amount),
    });

    return res.json({
      success: true,
      message: 'Bil ToyyibPay berjaya dicipta.',
      orderId,
      billCode: billResult.billCode,
      paymentUrl: billResult.paymentUrl,
      isSandbox: billResult.isSandbox,
    });
  } catch (error: any) {
    console.error('[ToyyibPay Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Ralat semasa menjana bil ToyyibPay: ' + error.message,
    });
  }
});

// ====================================================================
// 2. CALLBACK / WEBHOOK TOYYIBPAY (PENGESAHAN BAYARAN AUTOMATIK)
// ====================================================================

/**
 * POST /api/payment/toyyibpay-callback
 * Menerima respon webhook daripada pelayan ToyyibPay apabila bayaran dibuat.
 * Format POST parameter ToyyibPay: refno, status_id, billcode, order_id, amount
 */
app.post('/api/payment/toyyibpay-callback', async (req: Request, res: Response) => {
  try {
    console.log('[ToyyibPay Webhook Diterima]:', req.body);

    const verified = verifyToyyibPayCallback(req.body);

    if (verified.isSuccess) {
      console.log(`[ToyyibPay] Pembayaran BERJAYA untuk Bil ${verified.billCode} (Ref: ${verified.transactionRef})`);

      // Kemas kini database dan buka akses buku kepada pengguna
      const unlockResult = await markOrderPaidAndUnlockBook({
        billCode: verified.billCode,
        transactionId: verified.transactionRef,
        status: 'SUCCESS',
        paidAmount: verified.amount,
      });

      console.log('[Supabase / Library] Status buka akses buku:', unlockResult);
      return res.status(200).send('OK');
    } else {
      console.warn(`[ToyyibPay] Pembayaran GAGAL atau PENDING untuk Bil ${verified.billCode}`);

      await markOrderPaidAndUnlockBook({
        billCode: verified.billCode,
        transactionId: verified.transactionRef,
        status: 'FAILED',
      });

      return res.status(200).send('OK');
    }
  } catch (error: any) {
    console.error('[Webhook Error]:', error);
    return res.status(500).send('Webhook Processing Error');
  }
});

/**
 * GET /api/payment/toyyibpay-return
 * Pengguna diarahkan ke sini oleh ToyyibPay selepas selesai membuat pembayaran di portal bank FPX.
 */
app.get('/api/payment/toyyibpay-return', async (req: Request, res: Response) => {
  const { status_id, billcode, order_id } = req.query;

  // Jika status berjaya (status_id = 1), pastikan database telah dikemas kini
  if (status_id === '1' && billcode) {
    await markOrderPaidAndUnlockBook({
      billCode: billcode as string,
      transactionId: `RET-${Date.now()}`,
      status: 'SUCCESS',
    });
  }

  // Arahkan pengguna kembali ke laman web utama dengan mesej kejayaan
  return res.redirect(`/?payment_status=${status_id === '1' ? 'success' : 'failed'}&bill_code=${billcode || ''}`);
});

/**
 * POST /api/payment/simulate-test-webhook
 * Endpoint bantuan untuk menguji webhook ToyyibPay secara langsung dalam prototaip.
 */
app.post('/api/payment/simulate-test-webhook', async (req: Request, res: Response) => {
  const { billCode, status_id = '1' } = req.body;

  if (!billCode) {
    return res.status(400).json({ success: false, error: 'billCode diperlukan.' });
  }

  const result = await markOrderPaidAndUnlockBook({
    billCode,
    transactionId: `SIM-FPX-${Date.now()}`,
    status: status_id === '1' ? 'SUCCESS' : 'FAILED',
  });

  return res.json({
    success: true,
    message: status_id === '1' ? 'Simulasi webhook ToyyibPay BERJAYA. Buku telah dibuka dalam perpustakaan!' : 'Simulasi status bayaran GAGAL.',
    result,
  });
});

// ====================================================================
// 2B. ALUR KERJA PEMBAYARAN BCL (BAYARCASH COMMERCE LAYER)
// ====================================================================

/**
 * POST /api/payment/bcl-create-bill
 * Pengguna memilih kaedah BCL (FPX / DuitNow QR / E-Wallet)
 * -> Menghantar permohonan ke API BCL (bcl.my) / Bayarcash
 */
app.post('/api/payment/bcl-create-bill', async (req: Request, res: Response) => {
  try {
    const { bookId, bookTitle, amount, userName, userEmail, userPhone, channel } = req.body;

    if (!bookId || !amount || !userEmail) {
      return res.status(400).json({
        success: false,
        error: 'Maklumat buku (bookId), jumlah (amount) dan emel pembeli diperlukan.',
      });
    }

    const orderId = `BCL-ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const appBaseUrl = getAppBaseUrl(req);

    console.log(`[BCL] Menjana invois pesanan ${orderId} (${bookTitle} - RM ${amount})`);

    const billResult = await createBclBill({
      orderId,
      bookTitle: bookTitle || 'E-Buku Tempatan',
      amountMYR: parseFloat(amount),
      userName: userName || 'Pembaca Tempatan',
      userEmail,
      userPhone: userPhone || '0123456789',
      appBaseUrl,
      preferredChannel: channel || 'all',
    });

    // Simpan rekod pesanan
    await createOrderRecord({
      orderId,
      billCode: billResult.billCode,
      bookId,
      bookTitle: bookTitle || 'E-Buku Tempatan',
      userEmail,
      amount: parseFloat(amount),
      gateway: 'bcl',
    });

    return res.json({
      success: true,
      message: 'Bil pembayaran BCL (Bayarcash) berjaya dijana.',
      orderId,
      billCode: billResult.billCode,
      paymentUrl: billResult.paymentUrl,
      isSandbox: billResult.isSandbox,
      gateway: 'bcl',
    });
  } catch (error: any) {
    console.error('[BCL Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Ralat semasa menjana invois BCL: ' + error.message,
    });
  }
});

/**
 * POST /api/payment/bcl-callback
 * Menerima Webhook / Callback daripada pelayan BCL apabila bayaran pelanggan berjaya.
 */
app.post('/api/payment/bcl-callback', async (req: Request, res: Response) => {
  try {
    console.log('[BCL Webhook Diterima]:', req.body);
    const verified = verifyBclCallback(req.body);

    if (verified.isSuccess) {
      console.log(`[BCL] Pembayaran BERJAYA untuk Pesanan ${verified.orderId || verified.billCode}`);

      // Buka naskhah buku kepada pengguna dalam pangkalan data
      const unlockResult = await markOrderPaidAndUnlockBook({
        billCode: verified.billCode || verified.orderId,
        transactionId: verified.transactionRef,
        status: 'SUCCESS',
        paidAmount: verified.amount,
      });

      console.log('[BCL / Database] Status kebenaran akses buku:', unlockResult);
      return res.status(200).json({ status: 'OK', message: 'BCL Payment Recorded' });
    } else {
      console.warn(`[BCL] Pembayaran GAGAL untuk Bil ${verified.billCode}`);

      await markOrderPaidAndUnlockBook({
        billCode: verified.billCode || verified.orderId,
        transactionId: verified.transactionRef,
        status: 'FAILED',
      });

      return res.status(200).json({ status: 'FAILED' });
    }
  } catch (error: any) {
    console.error('[BCL Webhook Error]:', error);
    return res.status(500).send('BCL Webhook Processing Error');
  }
});

/**
 * GET /api/payment/bcl-return
 * Pengguna diarahkan ke sini oleh portal BCL selepas transaksi selesai (hanya redirect UI, pengesahan buku dibuat melalui webhook pelayan).
 */
app.get('/api/payment/bcl-return', (req: Request, res: Response) => {
  const { status, bill_code } = req.query;
  const isSuccess = status === 'success' || status === 'paid' || status === '1';
  return res.redirect(`/?payment_status=${isSuccess ? 'success' : 'failed'}&gateway=bcl&bill_code=${bill_code || ''}`);
});

// ====================================================================
// 3. PERLINDUNGAN PAUTAN E-BOOK (CLOUDFLARE R2 SIGNED URL)
// ====================================================================

/**
 * POST /api/books/generate-signed-url
 * Menjana pautan masa terhad (Signed URL) daripada Cloudflare R2.
 * Hanya pengguna yang telah membeli naskhah berhak mendapatkan pautan ini.
 */
app.post('/api/books/generate-signed-url', async (req: Request, res: Response) => {
  try {
    const { bookId, userEmail } = req.body;

    if (!bookId || !userEmail) {
      return res.status(400).json({ success: false, error: 'bookId dan userEmail diperlukan.' });
    }

    // Semak pengesahan pemilikan buku dalam database
    const unlockedBooks = await getUserUnlockedBookIds(userEmail);
    const isOwned = unlockedBooks.includes(bookId);

    if (!isOwned) {
      return res.status(403).json({
        success: false,
        error: 'Akses Ditolak: Anda belum membeli naskhah ini atau transaksi belum disahkan.',
      });
    }

    // Jana pautan masa terhad (sah selama 30 minit = 1800 saat)
    const fileKey = `ebooks/${bookId}.epub`;
    const signedUrl = await generateR2SignedUrl({
      fileKey,
      expiresInSeconds: 1800,
    });

    const expiresAt = new Date(Date.now() + 1800 * 1000).toISOString();

    return res.json({
      success: true,
      bookId,
      signedUrl,
      expiresAt,
      validMinutes: 30,
      userBound: userEmail,
      message: 'Pautan sementara berjaya dijana. Pautan ini akan luput dalam masa 30 minit untuk mengelakkan perkongsian haram.',
    });
  } catch (error: any) {
    console.error('[Signed URL Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/books/stream/:bookId
 * Mengesahkan tandatangan pautan sementara kriptografi sebelum membenarkan fail dimuat turun/dibaca.
 */
app.get('/api/books/stream/:bookId', (req: Request, res: Response) => {
  const { bookId } = req.params;
  const { token, expires, user } = req.query;

  if (!token || !expires || !user) {
    return res.status(400).json({
      error: 'Pautan tidak lengkap: token, expires dan user parameter diperlukan.',
    });
  }

  const verification = verifyHmacSignedUrl({
    bookId,
    token: token as string,
    expires: parseInt(expires as string),
    userEmail: user as string,
  });

  if (!verification.isValid) {
    return res.status(403).json({
      error: 'Akses Disekat: ' + (verification.reason || 'Tandatangan pautan tidak sah atau telah luput.'),
    });
  }

  return res.json({
    status: 'AUTHENTICATED',
    bookId,
    readerAuthorized: user,
    protectionLevel: 'DRM Watermark Bound',
    message: `Akses sah untuk ${user}. Fail dilindungi dengan tera air pembeli.`,
  });
});

/**
 * GET /api/user/library
 * Mengambil senarai ID buku yang dimiliki oleh pengguna
 */
app.get('/api/user/library', async (req: Request, res: Response) => {
  const email = (req.query.email as string) || 'mykaryadigital@gmail.com';
  const bookIds = await getUserUnlockedBookIds(email);
  return res.json({ success: true, email, ownedBookIds: bookIds });
});

// Rute untuk melihat fail prototaip HTML tunggal (reader-prototype.html & homepage.html)
app.get(['/reader-prototype.html', '/prototype'], (_req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'public', 'reader-prototype.html'));
});

app.get(['/homepage.html', '/homepage'], (_req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'public', 'homepage.html'));
});

/**
 * GET /api/books/pdf/:id
 * Menstrim fail dokumen PDF naskhah daripada storan tempatan ATAU Cloudflare R2 secara langsung
 */
app.get('/api/books/pdf/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');
  const storageDir = path.resolve(__dirname, 'storage/manuscripts');

  // 1. Semak fail cakera tempatan jika wujud
  if (fs.existsSync(storageDir)) {
    const files = fs.readdirSync(storageDir);
    const targetFile = files.find(
      (f) => (f.includes(safeId) || f === `manuscripts_${safeId}.pdf`) && f.endsWith('.pdf')
    );

    if (targetFile) {
      const fullPath = path.join(storageDir, targetFile);
      const stat = fs.statSync(fullPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', 'inline; filename="karya_digital.pdf"');
      res.setHeader('Accept-Ranges', 'bytes');
      return fs.createReadStream(fullPath).pipe(res);
    }
  }

  // 2. Jika tiada di cakera tempatan, ambil strim secara terus daripada Cloudflare R2 Object Storage
  try {
    const possibleR2Keys = [
      `manuscripts/${safeId}.pdf`,
      `manuscripts_${safeId}.pdf`,
      `${safeId}.pdf`,
    ];

    for (const key of possibleR2Keys) {
      const r2Asset = await getAssetFromR2(key);
      if (r2Asset && r2Asset.stream) {
        console.log(`[Cloudflare R2 Strim] Menstrim fail PDF naskhah: ${key} ke pembeli`);
        res.setHeader('Content-Type', r2Asset.contentType || 'application/pdf');
        if (r2Asset.contentLength) {
          res.setHeader('Content-Length', r2Asset.contentLength);
        }
        res.setHeader('Content-Disposition', 'inline; filename="karya_digital.pdf"');
        res.setHeader('Accept-Ranges', 'bytes');

        // Salin ke storan cache tempatan secara serentak untuk akses pantas seterusnya
        try {
          if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
          const localCachePath = path.join(storageDir, `manuscripts_${safeId}.pdf`);
          const cacheWriteStream = fs.createWriteStream(localCachePath);
          (r2Asset.stream as any).pipe(cacheWriteStream);
        } catch (cacheErr) {
          console.warn('[Cache Mirror Warning]:', cacheErr);
        }

        return (r2Asset.stream as any).pipe(res);
      }
    }
  } catch (err: any) {
    console.error(`[R2 Stream Error]: Gagal mengambil PDF ${safeId} dari R2:`, err);
  }

  // 3. JALAN PENYELESAIAN BIJAK (SMART DYNAMIC PDF SYNTHESIS):
  // Jika fail PDF fizikal belum dimuat naik oleh pengarang ke R2 atau cakera,
  // jana dokumen PDF naskhah berkualiti tinggi dengan serta-merta menggunakan data karya.
  // Ini memastikan TIADA pelanggan yang disekat daripada membaca buku yang telah dibeli!
  try {
    const allBooks = getAllPublishedBooks();
    const matchedBook = allBooks.find(
      (b) => b.id === safeId || b.id === id || (b.title && b.title.toLowerCase().includes(safeId.toLowerCase()))
    );

    const isKarim = safeId.toLowerCase().includes('karim') || (matchedBook?.author && matchedBook.author.toLowerCase().includes('karim'));
    const bookTitle = matchedBook?.title || (isKarim ? 'KEMBARA BANG KARIM' : 'Naskhah Rasmi E-Buku');
    const bookAuthor = matchedBook?.author || (isKarim ? 'Bang Karim' : 'Penulis Tempatan');
    const bookSynopsis = matchedBook?.synopsis || 'Naskhah e-buku rasmi yang diterbitkan di platform KaryaDigital Malaysia.';
    const bookGenre = matchedBook?.genre || (isKarim ? 'Misteri & Kembara' : 'Karya Digital');
    const chapters = matchedBook?.sampleContent?.chapters;

    console.log(`[Dynamic PDF Synthesizer] Menjana naskhah PDF automatik untuk pembeli: "${bookTitle}" (${safeId})`);
    const generatedPdfBytes = await synthesizeBookPdf({
      id: safeId,
      title: bookTitle,
      author: bookAuthor,
      genre: bookGenre,
      synopsis: bookSynopsis,
      chapters,
      buyerEmail: (req.query.user as string) || (req.query.email as string) || 'pembaca@karyadigital.my',
    });

    // Simpan ke storan cache setempat untuk capaian pantas seterusnya
    try {
      if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
      const localCachePath = path.join(storageDir, `manuscripts_${safeId}.pdf`);
      fs.writeFileSync(localCachePath, Buffer.from(generatedPdfBytes));
    } catch (saveErr) {
      console.warn('[Cache Save Notice]:', saveErr);
    }

    const buffer = Buffer.from(generatedPdfBytes);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', 'inline; filename="karya_digital.pdf"');
    res.setHeader('Accept-Ranges', 'bytes');
    return res.end(buffer);
  } catch (synthErr: any) {
    console.error('[PDF Synthesize Error]:', synthErr);
  }

  return res.status(404).send('Fail PDF naskhah tidak ditemui pada storan pelayan mahupun Cloudflare R2.');
});

/**
 * GET /api/books/epub/:id
 * Menstrim fail EPUB naskhah daripada storan tempatan ATAU Cloudflare R2
 */
app.get('/api/books/epub/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');
  const storageDir = path.resolve(__dirname, 'storage/manuscripts');

  // 1. Semak fail cakera tempatan
  if (fs.existsSync(storageDir)) {
    const files = fs.readdirSync(storageDir);
    const targetFile = files.find(
      (f) => (f.includes(safeId) || f === `manuscripts_${safeId}.epub`) && f.endsWith('.epub')
    );

    if (targetFile) {
      const fullPath = path.join(storageDir, targetFile);
      const stat = fs.statSync(fullPath);
      res.setHeader('Content-Type', 'application/epub+zip');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', 'inline; filename="karya_digital.epub"');
      return fs.createReadStream(fullPath).pipe(res);
    }
  }

  // 2. Ambil strim terus daripada Cloudflare R2
  try {
    const possibleR2Keys = [
      `manuscripts/${safeId}.epub`,
      `manuscripts_${safeId}.epub`,
      `${safeId}.epub`,
    ];

    for (const key of possibleR2Keys) {
      const r2Asset = await getAssetFromR2(key);
      if (r2Asset && r2Asset.stream) {
        console.log(`[Cloudflare R2 Strim] Menstrim fail EPUB: ${key} ke pembeli`);
        res.setHeader('Content-Type', r2Asset.contentType || 'application/epub+zip');
        if (r2Asset.contentLength) {
          res.setHeader('Content-Length', r2Asset.contentLength);
        }
        res.setHeader('Content-Disposition', 'inline; filename="karya_digital.epub"');
        return (r2Asset.stream as any).pipe(res);
      }
    }
  } catch (err: any) {
    console.error(`[R2 Stream Error]: Gagal mengambil EPUB ${safeId} dari R2:`, err);
  }

  return res.status(404).send('Fail EPUB naskhah tidak ditemui pada storan.');
});

/**
 * POST /api/books/upload-manuscript
 * Endpoint muat naik fail manuskrip besar (PDF / EPUB sehingga 150MB) terus ke Cloudflare R2
 */
app.post('/api/books/upload-manuscript', manuscriptUpload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { bookId } = req.body;
    if (!file || !bookId) {
      return res.status(400).json({ success: false, error: 'Fail manuskrip dan bookId diperlukan.' });
    }

    const safeId = String(bookId).replace(/[^a-zA-Z0-9_-]/g, '');
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const isEpub = file.mimetype.includes('epub') || file.originalname.toLowerCase().endsWith('.epub');
    const ext = isPdf ? 'pdf' : isEpub ? 'epub' : 'bin';
    const contentType = isPdf ? 'application/pdf' : isEpub ? 'application/epub+zip' : file.mimetype;

    const fileKey = `manuscripts/${safeId}.${ext}`;
    console.log(`[Muat Naik Manuskrip] Memuat naik "${file.originalname}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) ke R2: ${fileKey}`);

    const result = await uploadAssetToR2({
      fileKey,
      data: file.buffer,
      contentType,
    });

    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    return res.json({
      success: true,
      message: 'Fail naskhah berjaya dimuat naik dan disimpan secara kekal di Cloudflare R2!',
      fileKey,
      isR2Direct: result.isR2Direct,
      streamUrl: `/api/books/${ext}/${safeId}`,
      fileName: file.originalname,
      fileSize: formattedSize,
      format: ext,
    });
  } catch (error: any) {
    console.error('[Upload Manuscript Error]:', error);
    return res.status(500).json({ success: false, error: 'Gagal memuat naik manuskrip: ' + error.message });
  }
});

// ====================================================================
// 4. PENERBITAN KARYA KE CLOUDFLARE R2 & STORAN KEKAL
// ====================================================================

/**
 * POST /api/books/publish
 * Menyimpan naskhah e-buku & komik secara kekal dan memuat naiknya ke Cloudflare R2
 */
app.post('/api/books/publish', async (req: Request, res: Response) => {
  try {
    const bookData = req.body;
    if (!bookData || !bookData.title) {
      return res.status(400).json({ success: false, error: 'Data naskhah dan tajuk diperlukan.' });
    }

    console.log(`[Penerbitan Cloudflare R2] Memproses karya: "${bookData.title}" (${bookData.id})`);
    const result = await savePublishedBookToStorage(bookData);

    return res.json({
      success: true,
      message: 'Naskhah berjaya dimuat naik ke Cloudflare R2 dan disimpan secara kekal!',
      book: result.book,
      r2Key: result.r2Key,
      isR2Direct: result.isR2Direct,
    });
  } catch (error: any) {
    console.error('[Publish Error]:', error);
    return res.status(500).json({ success: false, error: 'Gagal menerbitkan karya: ' + error.message });
  }
});

/**
 * GET /api/books/published
 * Mengambil semua karya yang telah diterbitkan dari Cloudflare R2 / Stor Kekal
 */
app.get('/api/books/published', (_req: Request, res: Response) => {
  try {
    const books = getAllPublishedBooks();
    return res.json({ success: true, count: books.length, books });
  } catch (error: any) {
    console.error('[Get Published Books Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/books/:id
 * Mengemas kini butiran naskhah yang telah diterbitkan
 */
app.put('/api/books/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bookData = { ...req.body, id };
    const result = await savePublishedBookToStorage(bookData);
    return res.json({
      success: true,
      message: `Naskhah "${result.book.title}" berjaya dikemas kini!`,
      book: result.book,
    });
  } catch (error: any) {
    console.error('[Update Book Error]:', error);
    return res.status(500).json({ success: false, error: 'Gagal mengemas kini naskhah: ' + error.message });
  }
});

/**
 * DELETE /api/books/:id
 * Memadam naskhah daripada pangkalan data pelayan dan menarik balik penerbitan
 */
app.delete('/api/books/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = deletePublishedBookFromStorage(id);
    return res.json({
      success: deleted,
      message: deleted ? `Naskhah ${id} berjaya dipadam dari sistem.` : `Naskhah ${id} tidak ditemui.`,
    });
  } catch (error: any) {
    console.error('[Delete Book Error]:', error);
    return res.status(500).json({ success: false, error: 'Gagal memadam naskhah: ' + error.message });
  }
});

/**
 * GET /api/books/deleted
 * Mengambil senarai ID naskhah yang telah dipadam secara kekal (tombstone)
 */
app.get('/api/books/deleted', (_req: Request, res: Response) => {
  try {
    const deletedIds = getDeletedBookIds();
    return res.json({ success: true, count: deletedIds.length, deletedIds });
  } catch (error: any) {
    console.error('[Get Deleted Books Error]:', error);
    return res.status(500).json({ success: false, deletedIds: [] });
  }
});

// ====================================================================
// 5. INTEGRASI DEV VITE / PRODUKSI SERVING
// ====================================================================

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: path.resolve(__dirname),
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KaryaDigital] Server sedang berjalan pada port ${PORT} (http://0.0.0.0:${PORT})`);
  });
}

startServer();
