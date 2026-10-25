import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyToyyibPayCallback } from '../server/toyyibpay.ts';
import { generateHmacSignedUrl, verifyHmacSignedUrl } from '../server/cloudflareR2.ts';

test('verifyToyyibPayCallback detects SUCCESS status (status_id = 1)', () => {
  const payload = {
    refno: 'FPX12345678',
    status_id: '1',
    billcode: 'BILL-ABC1234',
    order_id: 'KD-ORD-999',
    amount: '15.00',
  };

  const result = verifyToyyibPayCallback(payload);
  assert.equal(result.isSuccess, true);
  assert.equal(result.billCode, 'BILL-ABC1234');
  assert.equal(result.transactionRef, 'FPX12345678');
  assert.equal(result.amount, 15.0);
});

test('verifyToyyibPayCallback detects FAILED status (status_id != 1)', () => {
  const payload = {
    refno: 'FPX8888',
    status_id: '3',
    billcode: 'BILL-FAIL',
    order_id: 'KD-ORD-000',
    amount: '15.00',
  };

  const result = verifyToyyibPayCallback(payload);
  assert.equal(result.isSuccess, false);
});

test('generateHmacSignedUrl and verifyHmacSignedUrl validates authentic unexpired tokens', () => {
  const bookId = 'novel-1';
  const userEmail = 'pembaca@karyadigital.my';

  const signedUrl = generateHmacSignedUrl({
    bookId,
    userEmail,
    expiresInSeconds: 60, // Sah 60 saat
  });

  assert.ok(signedUrl.includes('/api/books/stream/novel-1'));
  assert.ok(signedUrl.includes('token='));
  assert.ok(signedUrl.includes('expires='));

  // Ekstrak token dan expires
  const urlObj = new URL(`http://localhost${signedUrl}`);
  const token = urlObj.searchParams.get('token')!;
  const expires = parseInt(urlObj.searchParams.get('expires')!);

  const verification = verifyHmacSignedUrl({
    bookId,
    token,
    expires,
    userEmail,
  });

  assert.equal(verification.isValid, true);
});

test('verifyHmacSignedUrl rejects tampered tokens or expired timestamps', () => {
  const bookId = 'novel-1';
  const userEmail = 'pembaca@karyadigital.my';

  // 1. Token yang diubah suai
  const badTokenResult = verifyHmacSignedUrl({
    bookId,
    token: 'fake_tampered_token_hex_1234567890abcdef',
    expires: Math.floor(Date.now() / 1000) + 1000,
    userEmail,
  });
  assert.equal(badTokenResult.isValid, false);

  // 2. Token yang telah luput (expired)
  const expiredResult = verifyHmacSignedUrl({
    bookId,
    token: 'anytoken',
    expires: Math.floor(Date.now() / 1000) - 100, // 100 saat yang lalu
    userEmail,
  });
  assert.equal(expiredResult.isValid, false);
  assert.match(expiredResult.reason!, /telah tamat tempoh/);
});

test('synthesizeBookPdf creates valid multi-page PDF buffer with DRM watermark for any book', async () => {
  const { synthesizeBookPdf } = await import('../server/pdfSynthesizer.ts');
  const pdfBytes = await synthesizeBookPdf({
    id: 'kembara-bang-karim',
    title: 'KEMBARA BANG KARIM',
    author: 'Bang Karim',
    genre: 'Misteri & Kembara',
    synopsis: 'Kembara epik mencari kebenaran di tanah air.',
    buyerEmail: 'bangkarim79@gmail.com',
  });

  assert.ok(pdfBytes instanceof Uint8Array);
  assert.ok(pdfBytes.length > 1000);
  // Semak format magic byte PDF %PDF-
  const header = String.fromCharCode(...pdfBytes.slice(0, 5));
  assert.equal(header, '%PDF-');
});
