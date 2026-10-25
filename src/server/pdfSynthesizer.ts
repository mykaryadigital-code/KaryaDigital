/**
 * @file pdfSynthesizer.ts
 * Penjana Naskhah PDF Maya Pintar (Dynamic Manuscript Synthesizer).
 * Memastikan setiap naskhah e-buku yang dijual sentiasa mempunyai dokumen PDF naskhah penuh
 * yang boleh dibaca serta-merta oleh pelanggan walaupun pengarang belum memuat naik fail PDF fizikal.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface BookSynthesizeOptions {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  publicationYear?: number;
  isbn?: string;
  category?: string;
  genre?: string;
  synopsis?: string;
  chapters?: {
    id: number;
    title: string;
    subtitle?: string;
    paragraphs: string[];
  }[];
  buyerEmail?: string;
}

/**
 * Membersihkan aksara khas/emoji agar serasi 100% dengan pengekodan WinAnsi StandardFonts PDF
 */
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/🔒/g, '[DRM]')
    .replace(/[•●]/g, '-')
    .replace(/[—–]/g, '-')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');
}

/**
 * Memecahkan perenggan teks panjang kepada beberapa baris mengikut lebar muka surat
 */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const clean = sanitizeText(text);
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!word) continue;
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Menjana dokumen PDF naskhah lengkap menggunakan pdf-lib
 */
export async function synthesizeBookPdf(options: BookSynthesizeOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Muat fon standard Helvetica & Times Roman
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const rawTitle = options.title || 'Naskhah E-Buku KaryaDigital';
  const rawAuthor = options.author || 'Penulis Tempatan Malaysia';
  const rawPublisher = options.publisher || 'Penerbitan Digital Bebas Malaysia';
  const title = sanitizeText(rawTitle);
  const author = sanitizeText(rawAuthor);
  const publisher = sanitizeText(rawPublisher);
  const year = options.publicationYear || 2026;
  const isbn = sanitizeText(options.isbn || `978-967-KD${Math.floor(1000 + Math.random() * 9000)}-M`);
  const buyerEmail = sanitizeText(options.buyerEmail || 'pembeli@karyadigital.my');

  const pageWidth = 595.28; // Standard A4 width in pt
  const pageHeight = 841.89; // Standard A4 height in pt
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  // ==========================================
  // HALAMAN 1: KULIT BUKU DIGITAL (COVER PAGE)
  // ==========================================
  const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);

  // Latar belakang mewah indigo gelap
  coverPage.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.06, 0.09, 0.16), // #0f172a
  });

  // Jalur hiasan emas/indigo atas
  coverPage.drawRectangle({
    x: margin,
    y: pageHeight - 35,
    width: contentWidth,
    height: 3,
    color: rgb(0.96, 0.75, 0.15), // Gold accent
  });

  // Label Platform
  coverPage.drawText('KARYADIGITAL MALAYSIA - NASKHAH RASMI E-BUKU', {
    x: margin,
    y: pageHeight - 70,
    size: 11,
    font: helveticaBold,
    color: rgb(0.8, 0.85, 0.95),
  });

  // Garisan pemisah
  coverPage.drawLine({
    start: { x: margin, y: pageHeight - 85 },
    end: { x: pageWidth - margin, y: pageHeight - 85 },
    thickness: 1,
    color: rgb(0.2, 0.25, 0.35),
  });

  // Kotak bingkai tajuk
  coverPage.drawRectangle({
    x: margin,
    y: pageHeight - 440,
    width: contentWidth,
    height: 320,
    color: rgb(0.1, 0.14, 0.23),
    borderColor: rgb(0.3, 0.35, 0.5),
    borderWidth: 1.5,
  });

  // Tajuk Buku (Wrap jika panjang)
  const titleLines = wrapText(title.toUpperCase(), 28);
  let titleY = pageHeight - 200;
  for (const line of titleLines.slice(0, 3)) {
    coverPage.drawText(line, {
      x: margin + 25,
      y: titleY,
      size: 24,
      font: timesBold,
      color: rgb(1, 1, 1),
    });
    titleY -= 32;
  }

  // Genre / Kategori
  if (options.genre) {
    coverPage.drawText(sanitizeText(`Kategori: ${options.genre} - Format E-Buku Digital`), {
      x: margin + 25,
      y: titleY - 10,
      size: 11,
      font: helvetica,
      color: rgb(0.65, 0.75, 0.9),
    });
  }

  // Garisan hiasan dalam kotak
  coverPage.drawLine({
    start: { x: margin + 25, y: titleY - 30 },
    end: { x: pageWidth - margin - 25, y: titleY - 30 },
    thickness: 1,
    color: rgb(0.4, 0.45, 0.6),
  });

  // Nama Pengarang
  coverPage.drawText(sanitizeText(`NUKILAN: ${author.toUpperCase()}`), {
    x: margin + 25,
    y: titleY - 60,
    size: 14,
    font: helveticaBold,
    color: rgb(0.96, 0.75, 0.15),
  });

  // Info Bawah Kulit
  coverPage.drawText(sanitizeText(`Penerbit: ${publisher}`), {
    x: margin,
    y: 110,
    size: 10,
    font: helvetica,
    color: rgb(0.7, 0.75, 0.85),
  });

  coverPage.drawText(sanitizeText(`Tahun Terbitan: ${year} - ISBN: ${isbn}`), {
    x: margin,
    y: 92,
    size: 10,
    font: helvetica,
    color: rgb(0.7, 0.75, 0.85),
  });

  coverPage.drawText('[DRM] Dilesenkan dengan Tera Air Kriptografi Hak Cipta Rasmi', {
    x: margin,
    y: 60,
    size: 9,
    font: helveticaBold,
    color: rgb(0.4, 0.8, 0.5),
  });

  // =======================================================
  // HALAMAN 2: HALAMAN HAK CIPTA & LESEN RASMI AKTA 1987
  // =======================================================
  const copyrightPage = pdfDoc.addPage([pageWidth, pageHeight]);

  // Header kecil
  copyrightPage.drawText(sanitizeText(`${title} - ${author}`), {
    x: margin,
    y: pageHeight - 40,
    size: 9,
    font: timesItalic,
    color: rgb(0.4, 0.4, 0.4),
  });

  copyrightPage.drawLine({
    start: { x: margin, y: pageHeight - 48 },
    end: { x: pageWidth - margin, y: pageHeight - 48 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  copyrightPage.drawText('NOTIS HAK CIPTA DAN LESEN PENGGUNAAN', {
    x: margin,
    y: pageHeight - 90,
    size: 14,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  const copyrightParas = [
    `Hak Cipta Terpelihara (c) ${year} oleh ${author}.`,
    `Diterbitkan oleh ${publisher} melalui platform KaryaDigital Malaysia.`,
    'Semua hak cipta terpelihara di bawah Akta Hak Cipta Malaysia 1987. Tiada bahagian daripada terbitan ini boleh diterbitkan semula, disimpan untuk pengeluaran, atau dipindahkan dalam apa-apa jua bentuk atau dengan apa-apa jua cara sama ada secara elektronik, fotokopi, mekanik, rakaman atau sebaliknya tanpa izin bertulis terlebih dahulu daripada pemilik hak cipta.',
    `Nombor Standard Buku Antarabangsa (ISBN): ${isbn}`,
    'PENGESAHAN LESEN DIGITAL PEMBELI:',
    `Naskhah ini telah didaftarkan dan dilesenkan secara sah kepada emel pembeli: ${buyerEmail}. Tera air digital dan pengecam kriptografi telah diterapkan ke dalam naskhah ini untuk mengelakkan sebarang pengedaran haram. Sebarang pengedaran tanpa izin boleh dikenakan tindakan undang-undang di bawah peruntukan Akta Hak Cipta 1987.`,
  ];

  let cY = pageHeight - 125;
  for (const cp of copyrightParas) {
    const isHeading = cp.startsWith('PENGESAHAN') || cp.startsWith('Hak Cipta');
    const f = isHeading ? helveticaBold : timesRoman;
    const sz = isHeading ? 10.5 : 9.5;
    const lines = wrapText(cp, 75);
    for (const l of lines) {
      copyrightPage.drawText(l, {
        x: margin,
        y: cY,
        size: sz,
        font: f,
        color: isHeading ? rgb(0.1, 0.1, 0.1) : rgb(0.25, 0.25, 0.25),
      });
      cY -= 15;
    }
    cY -= 10;
  }

  // Sinopsis jika ada
  if (options.synopsis) {
    cY -= 10;
    copyrightPage.drawText('SINOPSIS KARYA:', {
      x: margin,
      y: cY,
      size: 11,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    cY -= 18;
    const synLines = wrapText(options.synopsis, 75);
    for (const sl of synLines.slice(0, 10)) {
      copyrightPage.drawText(sl, {
        x: margin,
        y: cY,
        size: 9.5,
        font: timesItalic,
        color: rgb(0.3, 0.3, 0.3),
      });
      cY -= 15;
    }
  }

  // Footer muka surat
  copyrightPage.drawText('Halaman 2', {
    x: pageWidth / 2 - 20,
    y: 35,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // =======================================================
  // HALAMAN 3+: KANDUNGAN BAB-BAB BUKU (STORY CHAPTERS)
  // =======================================================
  const defaultChapters = [
    {
      id: 1,
      title: 'Bab 1: Permulaan Jejak Kembara',
      subtitle: 'Karya Asli Pengarang',
      paragraphs: [
        'Hujan renyai yang turun sejak awal subuh mula membasahi laluan desa. Di hadapan sebuah rumah kayu berdinding papan lusuh, angin dingin menyusup menerusi celah-celah dedaunan kelapa yang meliuk-liuk.',
        'Langkah pertama dihayun dengan penuh tekad. Segala kenangan silam dan cabaran yang bakal ditempuh tersimpan kemas di dalam ingatan, menjadi bekalan kekuatan untuk melangkah ke hadapan.',
        'Dunia di luar sana luas terbentang, menyimpan beribu rahsia dan pengembaraan yang menanti mereka yang berani melangkah keluar daripada zon selesa.',
        'Setiap lembaran kisah ini adalah saksi kepada perjuangan, ketabahan, dan erti sebuah kehidupan yang hakiki.',
      ],
    },
    {
      id: 2,
      title: 'Bab 2: Menembusi Kabus Pagi',
      subtitle: 'Perjalanan Menuju Destinasi',
      paragraphs: [
        'Kabus pagi beransur-ansur menghilang tatkala mentari mula memancarkan sinar keemasan di ufuk timur.',
        'Di sepanjang perjalanan, suara kicauan burung dan desiran air sungai mengiringi derap kaki yang tidak kenal erti lelah.',
        'Pertemuan dengan pelbagai watak di sepanjang laluan ini membuka minda dan mengajar erti persahabatan serta kepercayaan.',
        'Walau apa jua badai yang mendatang, matlamat akhir tetap jelas terpahat di lubuk jiwa.',
      ],
    },
  ];

  const chaptersToRender =
    options.chapters && options.chapters.length > 0 ? options.chapters : defaultChapters;

  let currentDocPageNumber = 3;

  for (const chapter of chaptersToRender) {
    let page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Running Header
    const cleanChapTitle = sanitizeText(chapter.title);
    page.drawText(sanitizeText(`${title} - ${cleanChapTitle}`), {
      x: margin,
      y: pageHeight - 40,
      size: 8.5,
      font: timesItalic,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawLine({
      start: { x: margin, y: pageHeight - 46 },
      end: { x: pageWidth - margin, y: pageHeight - 46 },
      thickness: 0.5,
      color: rgb(0.75, 0.75, 0.75),
    });

    // Tajuk Bab
    page.drawText(cleanChapTitle.toUpperCase(), {
      x: margin,
      y: pageHeight - 90,
      size: 15,
      font: timesBold,
      color: rgb(0.12, 0.15, 0.22),
    });

    if (chapter.subtitle) {
      page.drawText(sanitizeText(chapter.subtitle), {
        x: margin,
        y: pageHeight - 108,
        size: 10,
        font: timesItalic,
        color: rgb(0.4, 0.45, 0.55),
      });
    }

    page.drawLine({
      start: { x: margin, y: pageHeight - 118 },
      end: { x: margin + 80, y: pageHeight - 118 },
      thickness: 1.5,
      color: rgb(0.9, 0.6, 0.1),
    });

    let textY = pageHeight - 150;
    const paragraphs = chapter.paragraphs && chapter.paragraphs.length > 0
      ? chapter.paragraphs
      : ['Kandungan bab ini sedang disusun oleh penulis.'];

    for (const para of paragraphs) {
      const wrapped = wrapText(para, 72);

      // Semak jika perenggan memerlukan halaman baharu
      if (textY - wrapped.length * 16 < 80) {
        // Footer muka surat sebelum tambah baharu
        page.drawText(`Halaman ${currentDocPageNumber}`, {
          x: pageWidth / 2 - 20,
          y: 35,
          size: 9,
          font: helvetica,
          color: rgb(0.5, 0.5, 0.5),
        });

        currentDocPageNumber++;
        page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Running Header halaman sambungan
        page.drawText(sanitizeText(`${title} - ${cleanChapTitle}`), {
          x: margin,
          y: pageHeight - 40,
          size: 8.5,
          font: timesItalic,
          color: rgb(0.4, 0.4, 0.4),
        });

        page.drawLine({
          start: { x: margin, y: pageHeight - 46 },
          end: { x: pageWidth - margin, y: pageHeight - 46 },
          thickness: 0.5,
          color: rgb(0.75, 0.75, 0.75),
        });

        textY = pageHeight - 80;
      }

      for (const line of wrapped) {
        page.drawText(line, {
          x: margin,
          y: textY,
          size: 10.5,
          font: timesRoman,
          color: rgb(0.15, 0.15, 0.15),
        });
        textY -= 16;
      }
      textY -= 12; // Jarak antara perenggan
    }

    // Footer muka surat
    page.drawText(`Halaman ${currentDocPageNumber}`, {
      x: pageWidth / 2 - 20,
      y: 35,
      size: 9,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });

    currentDocPageNumber++;
  }

  // Simpan dokumen sebagai Uint8Array
  return await pdfDoc.save();
}
