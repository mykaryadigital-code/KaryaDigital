import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import {
  ManuscriptError,
  detectFormat,
  getStorageStatus,
  openManuscript,
  parseRange,
  readAll,
  safeBookId,
  saveManuscript,
} from '../server/manuscriptStore.ts';
import type { R2Like } from '../server/manuscriptStore.ts';

const PDF = Buffer.from('%PDF-1.7\n' + 'x'.repeat(200) + '\n%%EOF');
const EPUB = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('epub-bytes-here')]);

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ms-test-'));
}

/** R2 palsu dalam memori; boleh dipaksa gagal. */
function fakeR2(opts: { failPut?: boolean; failGet?: boolean } = {}) {
  const objects = new Map<string, Buffer>();
  const r2: R2Like = {
    async put(key, data) {
      if (opts.failPut) throw new Error('R2 down');
      objects.set(key, data);
    },
    async get(key, range) {
      if (opts.failGet) throw new Error('R2 down');
      const data = objects.get(key);
      if (!data) return null;
      const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range) : null;
      if (m) {
        const start = m[1] === '' ? 0 : parseInt(m[1], 10);
        const end = m[2] === '' ? data.length - 1 : Math.min(parseInt(m[2], 10), data.length - 1);
        const slice = data.subarray(start, end + 1);
        return {
          stream: Readable.from([slice]),
          contentLength: slice.length,
          contentRange: `bytes ${start}-${end}/${data.length}`,
        };
      }
      return { stream: Readable.from([data]), contentLength: data.length };
    },
  };
  return { r2, objects };
}

// ---------- pengesahan ID & format ----------

test('safeBookId: terima ID sah sepenuhnya, tolak yang pelik (tidak dibersihkan senyap)', () => {
  assert.equal(safeBookId('karya-user-1792918321445'), 'karya-user-1792918321445');
  assert.equal(safeBookId('novel_4'), 'novel_4');
  assert.equal(safeBookId('../etc/passwd'), null);
  assert.equal(safeBookId('a b'), null);
  assert.equal(safeBookId(''), null);
  assert.equal(safeBookId('x'.repeat(129)), null);
  assert.equal(safeBookId(42), null);
});

test('detectFormat: kenal PDF dan EPUB daripada kandungan, tolak selebihnya', () => {
  assert.equal(detectFormat(PDF), 'pdf');
  assert.equal(detectFormat(EPUB), 'epub');
  assert.equal(detectFormat(Buffer.from('<html>bukan pdf</html>')), null);
  assert.equal(detectFormat(Buffer.from('')), null);
  assert.equal(detectFormat(Buffer.concat([Buffer.alloc(2000), Buffer.from('%PDF-')])), null); // terlalu jauh
});

// ---------- simpan ----------

test('saveManuscript: dengan R2 -> simpan di R2, durable, tiada fail setempat', async () => {
  const { r2, objects } = fakeR2();
  const localDir = tmpDir();
  const saved = await saveManuscript({ bookId: 'b1', buffer: PDF }, { r2, localDir });
  assert.deepEqual(
    { storage: saved.storage, durable: saved.durable, key: saved.key, format: saved.format },
    { storage: 'r2', durable: true, key: 'manuscripts/b1.pdf', format: 'pdf' }
  );
  assert.ok(objects.has('manuscripts/b1.pdf'));
  assert.deepEqual(fs.readdirSync(localDir), []);
});

test('saveManuscript: R2 gagal -> RALAT 502, TIDAK jatuh senyap ke cakera', async () => {
  const { r2 } = fakeR2({ failPut: true });
  const localDir = tmpDir();
  await assert.rejects(
    () => saveManuscript({ bookId: 'b1', buffer: PDF }, { r2, localDir, allowLocal: true }),
    (err: any) => err instanceof ManuscriptError && err.status === 502 && err.code === 'R2_UPLOAD_FAILED'
  );
  assert.deepEqual(fs.readdirSync(localDir), []);
});

test('saveManuscript: tiada R2 + production -> ralat 503 (tiada penyimpanan palsu)', async () => {
  const localDir = tmpDir();
  await assert.rejects(
    () => saveManuscript({ bookId: 'b1', buffer: PDF }, { r2: null, localDir, allowLocal: false }),
    (err: any) => err.status === 503 && err.code === 'STORAGE_NOT_CONFIGURED'
  );
  assert.deepEqual(fs.readdirSync(localDir), []);
});

test('saveManuscript: tiada R2 + pembangunan -> simpan setempat, ditandakan TIDAK kekal, tiada fail .tmp', async () => {
  const localDir = tmpDir();
  const saved = await saveManuscript({ bookId: 'b1', buffer: PDF }, { r2: null, localDir, allowLocal: true });
  assert.equal(saved.storage, 'local');
  assert.equal(saved.durable, false);
  assert.deepEqual(fs.readdirSync(localDir), ['manuscripts_b1.pdf']);
});

test('saveManuscript: tolak ID tidak sah dan fail yang bukan PDF/EPUB', async () => {
  const { r2 } = fakeR2();
  await assert.rejects(() => saveManuscript({ bookId: '../x', buffer: PDF }, { r2 }), (e: any) => e.status === 400);
  await assert.rejects(
    () => saveManuscript({ bookId: 'b1', buffer: Buffer.from('<html>palsu</html>') }, { r2 }),
    (e: any) => e.status === 400 && e.code === 'BAD_FORMAT'
  );
});

// ---------- buka ----------

test('openManuscript: baca daripada R2, dan julat (Range) dihormati', async () => {
  const { r2 } = fakeR2();
  await saveManuscript({ bookId: 'b1', buffer: PDF }, { r2 });

  const full = await openManuscript('b1', 'pdf', undefined, { r2 });
  assert.ok(full);
  assert.equal(full!.partial, false);
  assert.deepEqual(await readAll(full!.stream), PDF);

  const part = await openManuscript('b1', 'pdf', 'bytes=0-9', { r2 });
  assert.ok(part);
  assert.equal(part!.partial, true);
  assert.equal(part!.contentRange, `bytes 0-9/${PDF.length}`);
  assert.deepEqual(await readAll(part!.stream), PDF.subarray(0, 10));
});

test('openManuscript: fail tiada -> null (404), BUKAN PDF yang dijana', async () => {
  const { r2 } = fakeR2();
  assert.equal(await openManuscript('tiada-fail', 'pdf', undefined, { r2, localDir: tmpDir() }), null);
  assert.equal(await openManuscript('tiada-fail', 'epub', undefined, { r2: null, localDir: tmpDir() }), null);
});

test('openManuscript: R2 ralat rangkaian -> 502, BUKAN dianggap "tiada fail"', async () => {
  const { r2 } = fakeR2({ failGet: true });
  await assert.rejects(
    () => openManuscript('b1', 'pdf', undefined, { r2, localDir: tmpDir() }),
    (e: any) => e.status === 502 && e.code === 'R2_READ_FAILED'
  );
});

test('openManuscript: padanan ID TEPAT (id "1" tidak sepadan fail "karya-1")', async () => {
  const localDir = tmpDir();
  await saveManuscript({ bookId: 'karya-1', buffer: PDF }, { r2: null, localDir, allowLocal: true });
  assert.equal(await openManuscript('1', 'pdf', undefined, { r2: null, localDir }), null);
  assert.equal(await openManuscript('karya', 'pdf', undefined, { r2: null, localDir }), null);
  assert.ok(await openManuscript('karya-1', 'pdf', undefined, { r2: null, localDir }));
});

test('openManuscript: PDF tidak dikelirukan dengan EPUB untuk ID sama', async () => {
  const { r2 } = fakeR2();
  await saveManuscript({ bookId: 'b1', buffer: PDF }, { r2 });
  assert.equal(await openManuscript('b1', 'epub', undefined, { r2, localDir: tmpDir() }), null);
});

test('openManuscript: R2 menang atas fail setempat yang lapuk (tiada "shadow")', async () => {
  const { r2 } = fakeR2();
  const localDir = tmpDir();
  await saveManuscript({ bookId: 'b1', buffer: Buffer.from('%PDF-1.4 LAPUK-PALSU') }, { r2: null, localDir, allowLocal: true });
  await saveManuscript({ bookId: 'b1', buffer: PDF }, { r2 });

  const opened = await openManuscript('b1', 'pdf', undefined, { r2, localDir });
  assert.equal(opened!.source, 'r2');
  assert.deepEqual(await readAll(opened!.stream), PDF);
});

test('openManuscript: fail setempat lama masih boleh dibaca bila R2 tiada objek itu (migrasi)', async () => {
  const { r2 } = fakeR2();
  const localDir = tmpDir();
  await saveManuscript({ bookId: 'lama', buffer: PDF }, { r2: null, localDir, allowLocal: true });
  const opened = await openManuscript('lama', 'pdf', undefined, { r2, localDir });
  assert.equal(opened!.source, 'local');
});

test('openManuscript setempat: julat sah, julat luar, dan julat rosak', async () => {
  const localDir = tmpDir();
  await saveManuscript({ bookId: 'b1', buffer: PDF }, { r2: null, localDir, allowLocal: true });

  const part = await openManuscript('b1', 'pdf', 'bytes=2-5', { r2: null, localDir });
  assert.equal(part!.contentRange, `bytes 2-5/${PDF.length}`);
  assert.deepEqual(await readAll(part!.stream), PDF.subarray(2, 6));

  const tail = await openManuscript('b1', 'pdf', 'bytes=-4', { r2: null, localDir });
  assert.deepEqual(await readAll(tail!.stream), PDF.subarray(PDF.length - 4));

  await assert.rejects(
    () => openManuscript('b1', 'pdf', `bytes=${PDF.length + 10}-`, { r2: null, localDir }),
    (e: any) => e.status === 416
  );
  await assert.rejects(
    () => openManuscript('b1', 'pdf', 'items=1-2', { r2: null, localDir }),
    (e: any) => e.status === 416
  );
});

test('parseRange: kes tepi', () => {
  assert.equal(parseRange(undefined, 100), null);
  assert.deepEqual(parseRange('bytes=0-', 100), { start: 0, end: 99 });
  assert.deepEqual(parseRange('bytes=10-500', 100), { start: 10, end: 99 });
  assert.deepEqual(parseRange('bytes=-10', 100), { start: 90, end: 99 });
  assert.equal(parseRange('bytes=-', 100), 'invalid');
  assert.equal(parseRange('bytes=50-10', 100), 'invalid');
  assert.equal(parseRange('bytes=0-1,5-6', 100), 'invalid');
  assert.equal(parseRange('bytes=0-1', 0), 'invalid');
});

test('getStorageStatus: melapor mod sebenar', async () => {
  const { r2 } = fakeR2();
  assert.deepEqual(await getStorageStatus({ r2 }), {
    r2Configured: true,
    durable: true,
    localFallbackAllowed: false,
    mode: 'r2',
  });
  assert.equal((await getStorageStatus({ r2: null, allowLocal: true })).mode, 'local-temporary');
  assert.equal((await getStorageStatus({ r2: null, allowLocal: false })).mode, 'unavailable');
});
