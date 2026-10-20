/**
 * @file cloudflareR2.ts
 * Integrasi Cloudflare R2 (S3-Compatible Object Storage) untuk Menjana Signed URL.
 * Memastikan fail e-book dan komik dilindungi dan hanya boleh diakses melalui pautan masa terhad.
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadCacheDir = path.resolve(__dirname, '../../public/uploads/r2-cache');

// Kredential Cloudflare R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'karyadigital-ebooks';
const SECURE_ASSET_SECRET = process.env.SECURE_ASSET_SECRET || 'karya_secret_signing_key_2026';

let r2Client: S3Client | null = null;

if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  try {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
    console.log('[Cloudflare R2] Klien S3 berjaya diinisialisasi untuk storan e-book.');
  } catch (err) {
    console.warn('[Cloudflare R2] Ralat menginisialisasi S3 client:', err);
  }
}

/**
 * 1. Jana Presigned URL daripada Cloudflare R2
 * Menghasilkan pautan masa terhad (cth: sah selama 30 minit). Selepas tamat tempoh, pautan mati secara automatik.
 */
export async function generateR2SignedUrl(params: {
  fileKey: string; // Nama fail dalam bucket R2 (cth: "novels/bayang-di-sebalik-menara.epub")
  expiresInSeconds?: number; // Lalai: 1800 saat (30 minit)
}): Promise<string> {
  const { fileKey, expiresInSeconds = 1800 } = params;

  if (r2Client && R2_BUCKET_NAME) {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
      });

      const signedUrl = await getSignedUrl(r2Client, command, {
        expiresIn: expiresInSeconds,
      });

      return signedUrl;
    } catch (error) {
      console.error('[Cloudflare R2] Gagal menjana S3 Presigned URL:', error);
    }
  }

  // Fallback: Jana Pautan Selamat Berasaskan Kriptografi HMAC (HMAC Token Signed URL)
  return generateHmacSignedUrl({
    bookId: fileKey,
    userEmail: 'user@karyadigital.my',
    expiresInSeconds,
  });
}

/**
 * 2. Jana Pautan Masa Terhad Kriptografi (HMAC Token Signature)
 * Berfungsi sebagai sandaran selamat sekiranya bucket R2 belum dipasang.
 */
export function generateHmacSignedUrl(params: {
  bookId: string;
  userEmail: string;
  expiresInSeconds?: number;
}): string {
  const { bookId, userEmail, expiresInSeconds = 1800 } = params;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // Cipta tandatangan digital menggunakan HMAC SHA-256
  const dataToSign = `${bookId}:${userEmail}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', SECURE_ASSET_SECRET)
    .update(dataToSign)
    .digest('hex');

  // Hasilkan pautan sementara selamat
  return `/api/books/stream/${encodeURIComponent(bookId)}?token=${signature}&expires=${expiresAt}&user=${encodeURIComponent(userEmail)}`;
}

/**
 * 3. Sahkan Pautan Sementara (Token Verification)
 */
export function verifyHmacSignedUrl(params: {
  bookId: string;
  token: string;
  expires: number;
  userEmail: string;
}): { isValid: boolean; reason?: string } {
  const { bookId, token, expires, userEmail } = params;
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Semak sama ada pautan telah luput
  if (currentTimestamp > expires) {
    return { isValid: false, reason: 'Pautan sementara e-buku telah tamat tempoh (Expired).' };
  }

  // Semak integriti tandatangan digital
  const dataToSign = `${bookId}:${userEmail}:${expires}`;
  const expectedSignature = crypto
    .createHmac('sha256', SECURE_ASSET_SECRET)
    .update(dataToSign)
    .digest('hex');

  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expectedSignature);

  if (tokenBuf.length === expectedBuf.length && crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
    return { isValid: true };
  }

  return { isValid: false, reason: 'Tandatangan pautan tidak sah atau telah diubah suai.' };
}

/**
 * 4. Muat Naik Fail Naskhah / Komik / Imej ke Cloudflare R2
 */
export async function uploadAssetToR2(params: {
  fileKey: string;
  data: string | Buffer;
  contentType?: string;
}): Promise<{
  success: boolean;
  fileKey: string;
  isR2Direct: boolean;
  sizeBytes: number;
}> {
  const { fileKey, data, contentType = 'application/octet-stream' } = params;
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');

  // A. Jika klien Cloudflare R2 sedia ada, hantar ke S3 Bucket R2
  if (r2Client && R2_BUCKET_NAME) {
    try {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        Body: buffer,
        ContentType: contentType,
      });
      await r2Client.send(command);
      console.log(`[Cloudflare R2] Fail berjaya dimuat naik ke Bucket R2: ${fileKey}`);
      return {
        success: true,
        fileKey,
        isR2Direct: true,
        sizeBytes: buffer.length,
      };
    } catch (err) {
      console.warn(`[Cloudflare R2] Gagal muat naik terus ke R2, menggunakan sandaran cache:`, err);
    }
  }

  // B. Sandaran Fail Tempatan (Local Mirror Cache)
  try {
    if (!fs.existsSync(uploadCacheDir)) {
      fs.mkdirSync(uploadCacheDir, { recursive: true });
    }
    const safeFileName = fileKey.replace(/[\/\\]/g, '_');
    const localFilePath = path.join(uploadCacheDir, safeFileName);
    fs.writeFileSync(localFilePath, buffer);
    console.log(`[Cloudflare R2 Storage Mirror] Disimpan dalam cache: ${localFilePath}`);
  } catch (err) {
    console.error('[Cloudflare R2 Storage Mirror Error]:', err);
  }

  return {
    success: true,
    fileKey,
    isR2Direct: false,
    sizeBytes: buffer.length,
  };
}
