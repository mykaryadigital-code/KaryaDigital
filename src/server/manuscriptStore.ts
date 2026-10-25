/**
 * @file manuscriptStore.ts
 * Penyimpanan dan penyajian fail manuskrip (PDF / EPUB).
 *
 * Peraturan:
 *  1. Cloudflare R2 ialah satu-satunya sumber kebenaran bila ia dikonfigurasi. Muat naik yang gagal
 *     dilaporkan sebagai ralat, TIDAK senyap jatuh ke cakera.
 *  2. Cakera setempat hanya digunakan bila R2 TIDAK dikonfigurasi dan bukan production, dan
 *     respon sentiasa menyatakan `durable: false` (fail itu hilang bila pelayan restart/redeploy).
 *  3. ID buku dipadankan tepat (kunci `manuscripts/<id>.<ext>`), bukan separa.
 *  4. Tiada fail yang dijana atau dipalsukan. Jika fail tiada, pemanggil dapat `null` (404).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import type { R2ObjectStream } from './cloudflareR2.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ManuscriptFormat = 'pdf' | 'epub';

export const CONTENT_TYPES: Record<ManuscriptFormat, string> = {
  pdf: 'application/pdf',
  epub: 'application/epub+zip',
};

export class ManuscriptError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ManuscriptError';
    this.status = status;
    this.code = code;
  }
}

/** Antara muka minimum R2 supaya boleh diuji dengan R2 palsu. */
export interface R2Like {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string, range?: string): Promise<R2ObjectStream | null>;
}

export interface StoreDeps {
  /** null = paksa tanpa R2. Tidak diberi = guna R2 sebenar jika dikonfigurasi. */
  r2?: R2Like | null;
  localDir?: string;
  allowLocal?: boolean;
}

// Modul R2 dimuat malas supaya logik di fail ini boleh diuji tanpa SDK AWS (ujian memberi `r2` sendiri).
let realR2Promise: Promise<R2Like | null> | null = null;
function getRealR2(): Promise<R2Like | null> {
  if (!realR2Promise) {
    realR2Promise = import('./cloudflareR2.ts').then((mod) =>
      mod.isR2Configured() ? { put: mod.putObjectToR2, get: mod.getObjectFromR2 } : null
    );
  }
  return realR2Promise;
}

async function resolveDeps(deps: StoreDeps = {}) {
  const r2 = deps.r2 !== undefined ? deps.r2 : await getRealR2();
  const localDir =
    deps.localDir ?? (process.env.MANUSCRIPT_LOCAL_DIR || path.resolve(__dirname, '../../storage/manuscripts'));
  const allowLocal = deps.allowLocal ?? process.env.NODE_ENV !== 'production';
  return { r2, localDir, allowLocal };
}

/** Status penyimpanan untuk diagnosis (tiada rahsia). */
export async function getStorageStatus(deps: StoreDeps = {}) {
  const { r2, allowLocal } = await resolveDeps(deps);
  return {
    r2Configured: Boolean(r2),
    durable: Boolean(r2),
    localFallbackAllowed: !r2 && allowLocal,
    mode: r2 ? 'r2' : allowLocal ? 'local-temporary' : 'unavailable',
  };
}

/** ID buku mesti sah SEPENUHNYA; tidak dibersihkan senyap (itu boleh menyebabkan perlanggaran ID). */
export function safeBookId(input: unknown): string | null {
  return typeof input === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(input) ? input : null;
}

/** Kenal pasti format sebenar daripada kandungan, bukan nama fail atau mimetype daripada client. */
export function detectFormat(buffer: Buffer): ManuscriptFormat | null {
  if (buffer.length < 8) return null;
  // Spesifikasi PDF membenarkan "%PDF-" dalam 1024 bait pertama.
  if (buffer.subarray(0, 1024).includes('%PDF-')) return 'pdf';
  // EPUB ialah arkib ZIP.
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) return 'epub';
  return null;
}

export function manuscriptKey(bookId: string, format: ManuscriptFormat): string {
  return `manuscripts/${bookId}.${format}`;
}

function localPath(localDir: string, bookId: string, format: ManuscriptFormat): string {
  return path.join(localDir, `manuscripts_${bookId}.${format}`);
}

export interface SavedManuscript {
  format: ManuscriptFormat;
  key: string;
  storage: 'r2' | 'local';
  durable: boolean;
  size: number;
}

export async function saveManuscript(
  params: { bookId: unknown; buffer: Buffer },
  deps?: StoreDeps
): Promise<SavedManuscript> {
  const bookId = safeBookId(params.bookId);
  if (!bookId) throw new ManuscriptError(400, 'BAD_ID', 'ID buku tidak sah.');

  const format = detectFormat(params.buffer);
  if (!format) {
    throw new ManuscriptError(400, 'BAD_FORMAT', 'Fail bukan PDF atau EPUB yang sah (kandungan tidak dikenali).');
  }

  const { r2, localDir, allowLocal } = await resolveDeps(deps);
  const key = manuscriptKey(bookId, format);

  if (r2) {
    try {
      await r2.put(key, params.buffer, CONTENT_TYPES[format]);
    } catch (err: any) {
      console.error(`[Manuskrip] Muat naik ke R2 gagal (${key}):`, err?.message || err);
      throw new ManuscriptError(502, 'R2_UPLOAD_FAILED', 'Gagal menyimpan fail ke Cloudflare R2. Sila cuba lagi.');
    }
    return { format, key, storage: 'r2', durable: true, size: params.buffer.length };
  }

  if (!allowLocal) {
    throw new ManuscriptError(
      503,
      'STORAGE_NOT_CONFIGURED',
      'Storan fail belum dikonfigurasi pada pelayan (Cloudflare R2). Muat naik tidak boleh disimpan.'
    );
  }

  fs.mkdirSync(localDir, { recursive: true });
  const finalPath = localPath(localDir, bookId, format);
  const tmpPath = `${finalPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tmpPath, params.buffer);
    fs.renameSync(tmpPath, finalPath); // atomik: pembaca tidak pernah nampak fail separuh siap
  } catch (err: any) {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {}
    throw new ManuscriptError(500, 'LOCAL_WRITE_FAILED', 'Gagal menyimpan fail pada pelayan: ' + (err?.message || err));
  }
  console.warn(
    `[Manuskrip] R2 belum dikonfigurasi: ${key} disimpan SEMENTARA di cakera pelayan dan akan hilang bila restart/redeploy.`
  );
  return { format, key, storage: 'local', durable: false, size: params.buffer.length };
}

export interface OpenedManuscript {
  stream: NodeJS.ReadableStream;
  contentType: string;
  /** Panjang kandungan yang dihantar (bukan keseluruhan fail jika 206). */
  contentLength?: number;
  /** Header Content-Range jika respon separa (206). */
  contentRange?: string;
  partial: boolean;
  /** Dari mana fail dibaca. */
  source: 'r2' | 'local';
}

export type RangeResult = { start: number; end: number } | 'invalid' | null;

/** Hurai header Range satu julat: bytes=a-b | bytes=a- | bytes=-n. Pulangkan null jika tiada Range. */
export function parseRange(header: string | undefined, size: number): RangeResult {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === '' && m[2] === '')) return 'invalid';
  if (size <= 0) return 'invalid';

  let start: number;
  let end: number;
  if (m[1] === '') {
    const suffix = parseInt(m[2], 10);
    if (suffix <= 0) return 'invalid';
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = parseInt(m[1], 10);
    end = m[2] === '' ? size - 1 : Math.min(parseInt(m[2], 10), size - 1);
  }
  if (start >= size || start > end) return 'invalid';
  return { start, end };
}

export async function openManuscript(
  bookIdInput: unknown,
  format: ManuscriptFormat,
  rangeHeader?: string,
  deps?: StoreDeps
): Promise<OpenedManuscript | null> {
  const bookId = safeBookId(bookIdInput);
  if (!bookId) throw new ManuscriptError(400, 'BAD_ID', 'ID buku tidak sah.');

  const { r2, localDir } = await resolveDeps(deps);

  // 1. R2 dahulu (sumber kebenaran).
  if (r2) {
    const key = manuscriptKey(bookId, format);
    // R2 menerima julat mudah sahaja; abaikan header yang pelik.
    const simpleRange = rangeHeader && /^bytes=\d*-\d*$/.test(rangeHeader.trim()) ? rangeHeader.trim() : undefined;
    let obj: R2ObjectStream | null;
    try {
      obj = await r2.get(key, simpleRange);
    } catch (err: any) {
      console.error(`[Manuskrip] Ralat membaca ${key} dari R2:`, err?.message || err);
      throw new ManuscriptError(502, 'R2_READ_FAILED', 'Gagal mengambil fail daripada Cloudflare R2.');
    }
    if (obj) {
      return {
        stream: obj.stream,
        contentType: CONTENT_TYPES[format],
        contentLength: obj.contentLength,
        contentRange: obj.contentRange,
        partial: Boolean(obj.contentRange),
        source: 'r2',
      };
    }
  }

  // 2. Cakera setempat, nama TEPAT sahaja (fail lama sebelum R2 dikonfigurasi, atau mod pembangunan).
  const file = localPath(localDir, bookId, format);
  let size: number;
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile()) return null;
    size = stat.size;
  } catch {
    return null;
  }

  const range = parseRange(rangeHeader, size);
  if (range === 'invalid') {
    throw new ManuscriptError(416, 'BAD_RANGE', `bytes */${size}`);
  }
  if (range) {
    return {
      stream: fs.createReadStream(file, { start: range.start, end: range.end }),
      contentType: CONTENT_TYPES[format],
      contentLength: range.end - range.start + 1,
      contentRange: `bytes ${range.start}-${range.end}/${size}`,
      partial: true,
      source: 'local',
    };
  }
  return {
    stream: fs.createReadStream(file),
    contentType: CONTENT_TYPES[format],
    contentLength: size,
    partial: false,
    source: 'local',
  };
}

/** Pembantu ujian: baca semua bait daripada stream. */
export async function readAll(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of Readable.from(stream as any)) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
