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
 * Membaca dan menghurai fail .epub secara terus di dalam pelayar.
 * Mengekstrak tajuk buku, nama pengarang, dan keseluruhan bab & perenggan teks.
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
    const itemRegex = /<item\s+[^>]*id=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*\/?>|<item\s+[^>]*href=["']([^"']+)["'][^>]*id=["']([^"']+)["'][^>]*\/?>/gi;
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
        // Dekod URI component jika ada %20 dsb.
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
    // Cari fail dalam zip (cuba laluan tepat atau padanan nama fail)
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

      // Cari tajuk bab dari h1, h2, h3, atau title
      let chapterTitle = '';
      const heading = doc.querySelector('h1, h2, h3');
      if (heading && heading.textContent?.trim()) {
        chapterTitle = heading.textContent.trim();
      } else {
        const docTitle = doc.querySelector('title');
        if (docTitle && docTitle.textContent?.trim()) {
          chapterTitle = docTitle.textContent.trim();
        }
      }

      // Cari perenggan teks
      const pElements = Array.from(doc.querySelectorAll('p'));
      let paragraphs: string[] = [];

      if (pElements.length > 0) {
        paragraphs = pElements
          .map((p) => p.textContent?.trim() || '')
          .filter((t) => t.length > 0);
      } else {
        // Jika tiada elemen <p>, ambil teks dari body dan pisahkan mengikut baris
        const bodyText = doc.body?.textContent || '';
        paragraphs = bodyText
          .split(/\n\s*\n/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }

      // Hanya masukkan bab jika mempunyai kandungan teks bererti
      if (paragraphs.length > 0) {
        chapters.push({
          id: chapterCounter,
          title: chapterTitle || `Bab ${chapterCounter}`,
          paragraphs,
        });
        totalParagraphCount += paragraphs.length;
        chapterCounter++;
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

  return {
    title: extractedTitle || file.name.replace(/\.[^/.]+$/, ''),
    author: extractedAuthor || '',
    chapters,
    dataUrl,
    fileName: file.name,
    fileSize: fileSizeStr,
    totalChapters: chapters.length,
    totalParagraphs: totalParagraphCount,
  };
}
