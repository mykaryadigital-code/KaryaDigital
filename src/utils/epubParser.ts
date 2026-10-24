import JSZip from 'jszip';
import { Chapter } from '../types/ebook.ts';

export interface ParsedEpubResult {
  title?: string;
  author?: string;
  chapters: Chapter[];
  dataUrl: string;
  fileName: string;
  fileSize: string;
  totalChapters: number;
  totalParagraphs: number;
}

/**
 * Corak regex pengesanan penanda permulaan bab / episod
 */
export const CHAPTER_HEADING_REGEX =
  /^(?:EPISOD|EPISODE|BAB|CHAPTER|BAHAGIAN|PART|FASAL|ACT)\s*(\d+|[IVXLCDM]+)?(?:\s*[:\-–—]\s*(.*))?$/i;

export const SPECIAL_CHAPTER_REGEX =
  /^(?:PROLOG|EPILOG|PROLOGUE|EPILOGUE|PENGENALAN|PRAKATA|PENUTUP|INTRO|OUTRO)(?:\s*[:\-–—]\s*(.*))?$/i;

/**
 * Semak sama ada sesuatu teks merupakan tajuk bab atau episod
 */
export function isChapterTitleText(text: string): boolean {
  const clean = text.trim();
  if (!clean || clean.length > 120) return false;
  return CHAPTER_HEADING_REGEX.test(clean) || SPECIAL_CHAPTER_REGEX.test(clean);
}

/**
 * Pisahkan senarai perenggan kepada berbilang bab secara automatik
 * jika di dalam perenggan tersebut terdapat penanda EPISOD / BAB baharu.
 */
export function splitParagraphsIntoChapters(
  paragraphs: string[],
  baseChapterTitle?: string,
  startId = 1
): Chapter[] {
  const chapters: Chapter[] = [];
  let currentTitle = baseChapterTitle || `Bab ${startId}`;
  let currentParagraphs: string[] = [];
  let chapterIndex = startId;

  for (let i = 0; i < paragraphs.length; i++) {
    const rawP = paragraphs[i].trim();
    if (!rawP) continue;

    // Periksa jika perenggan ini adalah tajuk bab/episod baharu
    if (isChapterTitleText(rawP)) {
      if (currentParagraphs.length > 0) {
        chapters.push({
          id: chapterIndex++,
          title: currentTitle,
          paragraphs: currentParagraphs,
        });
        currentParagraphs = [];
      }
      currentTitle = rawP;
      continue;
    }

    currentParagraphs.push(rawP);
  }

  if (currentParagraphs.length > 0 || chapters.length === 0) {
    chapters.push({
      id: chapterIndex,
      title: currentTitle,
      paragraphs: currentParagraphs.length > 0 ? currentParagraphs : ['(Tiada perenggan)'],
    });
  }

  return chapters;
}

/**
 * Mengimbas dan mengekstrak bab-bab daripada dokumen HTML EPUB secara pintar.
 * Mampu memotong bab jika terdapat berbilang tag heading atau penanda EPISOD dalam 1 fail HTML tunggal.
 */
export function extractChaptersFromHtmlDoc(
  doc: Document,
  startChapterId: number,
  fallbackTitle?: string,
  bookTitle?: string
): { chapters: Chapter[]; nextId: number; totalParagraphs: number } {
  const chapters: Chapter[] = [];
  let currentId = startChapterId;
  let currentTitle = fallbackTitle || '';
  let currentSubtitle: string | undefined = undefined;
  let currentParagraphs: string[] = [];

  const cleanBookTitle = (bookTitle || '').trim().toLowerCase();

  // Dapatkan semua elemen blok teks dalam urutan DOM sebenar
  const blockSelector = 'h1, h2, h3, h4, h5, h6, p, blockquote, div.chapter, div.chapter-title';
  let elements = Array.from(doc.body ? doc.body.querySelectorAll(blockSelector) : []);

  if (elements.length === 0) {
    elements = Array.from(doc.querySelectorAll('p, div, h1, h2, h3'));
  }

  for (const el of elements) {
    const tag = el.tagName.toLowerCase();
    const text = el.textContent?.trim() || '';
    if (!text) continue;

    const isHeadingTag = ['h1', 'h2', 'h3', 'h4'].includes(tag);
    const matchesPattern = isChapterTitleText(text);
    const isBookTitleRepeat = cleanBookTitle && text.toLowerCase() === cleanBookTitle;

    // Jika ini adalah penanda tajuk bab baharu (heading atau teks berformat bab)
    if ((isHeadingTag || matchesPattern) && text.length <= 140 && !isBookTitleRepeat) {
      if (currentParagraphs.length > 0) {
        chapters.push({
          id: currentId++,
          title: currentTitle || `Bab ${currentId - 1}`,
          subtitle: currentSubtitle,
          paragraphs: currentParagraphs,
        });
        currentParagraphs = [];
        currentSubtitle = undefined;
      }
      currentTitle = text;
      continue;
    }

    if (isBookTitleRepeat && !currentSubtitle) {
      currentSubtitle = text;
      continue;
    }

    // Pemprosesan perenggan teks
    if (tag === 'p' || tag === 'blockquote' || (tag === 'div' && !el.querySelector('p'))) {
      const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (isChapterTitleText(line)) {
          if (currentParagraphs.length > 0) {
            chapters.push({
              id: currentId++,
              title: currentTitle || `Bab ${currentId - 1}`,
              subtitle: currentSubtitle,
              paragraphs: currentParagraphs,
            });
            currentParagraphs = [];
            currentSubtitle = undefined;
          }
          currentTitle = line;
        } else {
          currentParagraphs.push(line);
        }
      }
    }
  }

  // Masukkan bab terakhir jika ada perenggan yang terkumpul
  if (currentParagraphs.length > 0) {
    chapters.push({
      id: currentId++,
      title: currentTitle || fallbackTitle || `Bab ${currentId - 1}`,
      subtitle: currentSubtitle,
      paragraphs: currentParagraphs,
    });
  }

  const totalParagraphs = chapters.reduce((sum, c) => sum + (c.paragraphs?.length || 0), 0);
  return { chapters, nextId: currentId, totalParagraphs };
}

/**
 * Membaca dan menghurai fail .epub secara terus di dalam pelayar.
 * Mengekstrak tajuk buku, nama pengarang, dan keseluruhan bab & perenggan teks dengan Smart Chapter Splitter.
 */
export async function parseEpubFile(file: File): Promise<ParsedEpubResult> {
  // 1. Dapatkan DataURL fail asal untuk simpanan & muat turun
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const fileSizeStr =
    file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

  // 2. Muat fail zip epub
  const zip = await JSZip.loadAsync(file);

  // 3. Cari container.xml untuk mendapatkan laluan fail .opf
  let opfPath = '';
  const containerFile = zip.file('META-INF/container.xml');
  if (containerFile) {
    const containerXml = await containerFile.async('string');
    const match = containerXml.match(/full-path=["']([^"']+\.opf)["']/i);
    if (match && match[1]) {
      opfPath = match[1];
    }
  }

  // Jika tiada dalam container, cari mana-mana fail .opf
  if (!opfPath) {
    const opfKey = Object.keys(zip.files).find((k) => k.toLowerCase().endsWith('.opf'));
    if (opfKey) {
      opfPath = opfKey;
    }
  }

  let extractedTitle = '';
  let extractedAuthor = '';
  const spineFiles: string[] = [];

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  if (opfPath && zip.file(opfPath)) {
    const opfContent = await zip.file(opfPath)!.async('string');

    // Dapatkan Tajuk
    const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    if (titleMatch && titleMatch[1]) {
      extractedTitle = titleMatch[1].trim();
    }

    // Dapatkan Penulis
    const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
    if (authorMatch && authorMatch[1]) {
      extractedAuthor = authorMatch[1].trim();
    }

    // Manifest: petakan id -> href
    const manifestMap = new Map<string, string>();
    const itemRegex =
      /<item\s+[^>]*id=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*\/?>|<item\s+[^>]*href=["']([^"']+)["'][^>]*id=["']([^"']+)["'][^>]*\/?>/gi;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = itemRegex.exec(opfContent)) !== null) {
      const id = itemMatch[1] || itemMatch[4];
      const href = itemMatch[2] || itemMatch[3];
      if (id && href) {
        manifestMap.set(id, href);
      }
    }

    // Spine: susunan bab
    const spineRegex = /<itemref\s+[^>]*idref=["']([^"']+)["']/gi;
    let spineMatch: RegExpExecArray | null;
    while ((spineMatch = spineRegex.exec(opfContent)) !== null) {
      const idref = spineMatch[1];
      const href = manifestMap.get(idref);
      if (href) {
        const decodedHref = decodeURIComponent(href);
        const fullPath = opfDir + decodedHref;
        spineFiles.push(fullPath);
      }
    }
  }

  // Jika tiada spine didapati, cari fail-fail .html / .xhtml mengikut susunan nama
  if (spineFiles.length === 0) {
    const htmlKeys = Object.keys(zip.files)
      .filter((k) => {
        const lower = k.toLowerCase();
        return (
          (lower.endsWith('.xhtml') || lower.endsWith('.html') || lower.endsWith('.htm')) &&
          !lower.includes('toc') &&
          !lower.includes('nav') &&
          !lower.includes('cover')
        );
      })
      .sort();
    spineFiles.push(...htmlKeys);
  }

  const chapters: Chapter[] = [];
  const parser = new DOMParser();

  let chapterCounter = 1;
  let totalParagraphCount = 0;

  for (const filePath of spineFiles) {
    let chapterFile = zip.file(filePath);
    if (!chapterFile) {
      const baseName = filePath.split('/').pop();
      if (baseName) {
        const matchingKey = Object.keys(zip.files).find((k) => k.endsWith(baseName));
        if (matchingKey) {
          chapterFile = zip.file(matchingKey);
        }
      }
    }

    if (!chapterFile) continue;

    try {
      const rawHtml = await chapterFile.async('string');
      const doc = parser.parseFromString(rawHtml, 'text/html');

      // Guna Smart Chapter Splitter untuk mengekstrak bab daripada fail HTML ini
      const extracted = extractChaptersFromHtmlDoc(
        doc,
        chapterCounter,
        `Bab ${chapterCounter}`,
        extractedTitle || file.name
      );

      if (extracted.chapters.length > 0) {
        chapters.push(...extracted.chapters);
        chapterCounter = extracted.nextId;
        totalParagraphCount += extracted.totalParagraphs;
      }
    } catch (err) {
      console.warn(`[EpubParser] Gagal menghurai fail ${filePath}:`, err);
    }
  }

  // Jika tiada bab berjaya diekstrak secara spesifik, buatkan sekurang-kurangnya 1 bab fallback
  if (chapters.length === 0) {
    chapters.push({
      id: 1,
      title: 'Bab 1: Manuskrip EPUB',
      subtitle: file.name,
      paragraphs: [
        `Fail EPUB "${file.name}" berjaya dimuat naik ke platform.`,
        'Kandungan digital bersedia untuk dibaca oleh pembeli dengan pembaca selamat.',
      ],
    });
    totalParagraphCount = 2;
  }

  // Pastikan ID bab tersusun rapi dari 1 hingga N
  const reindexedChapters = chapters.map((ch, idx) => ({
    ...ch,
    id: idx + 1,
  }));

  return {
    title: extractedTitle || file.name.replace(/\.[^/.]+$/, ''),
    author: extractedAuthor || '',
    chapters: reindexedChapters,
    dataUrl,
    fileName: file.name,
    fileSize: fileSizeStr,
    totalChapters: reindexedChapters.length,
    totalParagraphs: totalParagraphCount,
  };
}
