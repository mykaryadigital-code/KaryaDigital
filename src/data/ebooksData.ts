import { EBook } from '../types/ebook.ts';

export const OFFICIAL_PUBLISHED_BOOKS: EBook[] = [
  {
    id: 'karya-janda-bukan-akhir',
    title: 'Janda Bukan Akhir',
    author: 'Karim Syamsuddin',
    authorEmail: 'mykaryadigital@gmail.com',
    authorUid: 'auth-mykaryadigital@gmail.com',
    category: 'novel',
    genre: 'Romantik & Kehidupan',
    synopsis:
      'Kerana setiap kehilangan boleh menjadi permulaan yang lebih baik. Sebuah kisah bangkit daripada kedukaan meniti bahagia baru dengan kecekalan hati, maruah diri dan pergantungan kepada Ilahi.',
    rating: 5.0,
    reviewsCount: 42,
    price: 18.0,
    originalPrice: 25.0,
    pages: 234,
    readTime: '4 jam',
    publisher: 'KaryaDigital Penerbitan Rasmi',
    publicationYear: 2026,
    isbn: '978-967-KD-JBA-2026',
    isFeatured: true,
    isBestseller: true,
    coverImage: '/assets/aistudio/janda_bukan_akhir_portrait_cover.png',
    coverGradient: 'from-rose-950 via-pink-950 to-slate-950',
    coverAccent: '#f43f5e',
    coverBadge: 'Karya Penulis Platform',
    createdAt: 1730000000000,
    sampleContent: {
      chapters: [
        {
          id: 1,
          title: 'Bab 1: Fajar yang Menanti',
          subtitle: 'Kuala Lumpur • Permulaan Lembaran Baharu',
          paragraphs: [
            'Langkah kakinya terhenti seketika di anjung rumah. Hembusan angin subuh membawa aroma embun pagi yang menyegarkan, menyapu sisa titisan air mata yang telah lama kering.',
            '"Setiap kehilangan bukanlah noktah penghabisan, tetapi satu jeda untuk kita membina kekuatan yang lebih teguh," bisik hatinya sendiri sambil memandang ufuk timur yang mula memerah.',
            'Dengan tekad bulat dan pergantungan sepenuhnya kepada Yang Maha Esa, dia mengorak langkah melangkah ke hadapan tanpa menoleh ke belakang lagi.',
            'Perjalanan hidup ini masih panjang. Tiada siapa yang mampu merampas masa depannya selagi dia tidak berputus asa daripada rahmat Ilahi.',
          ],
        },
        {
          id: 2,
          title: 'Bab 2: Jejak-jejak Ketabahan',
          subtitle: 'Membina Impian yang Tertangguh',
          paragraphs: [
            'Dunia perniagaan kecil di kota menuntut kecekalan luar biasa. Namun dengan sokongan sahabat sejati dan doa keluarga, sinar harapan mula memancar menerangi jalan kehidupannya.',
            'Karim Syamsuddin mencatatkan liku-liku kehidupan ini dengan bahasa yang menyentuh kalbu, menyuntik inspirasi kepada sesiapa sahaja yang sedang diuji.',
          ],
        },
      ],
    },
  },
  {
    id: 'karya-kembara-bang-karim',
    title: 'Kembara Bang Karim',
    author: 'Bang Karim',
    authorEmail: 'mykaryadigital@gmail.com',
    authorUid: 'auth-mykaryadigital@gmail.com',
    category: 'novel',
    genre: 'Fantasi & Kembara',
    synopsis:
      'Sebuah catatan pengembaraan epik Bang Karim merentas pelbagai ranjau, adat warisan nusantara, dan hikmah tersembunyi di balik setiap persinggahan hidup.',
    rating: 5.0,
    reviewsCount: 56,
    price: 15.0,
    originalPrice: 20.0,
    pages: 180,
    readTime: '3 jam 30 min',
    publisher: 'KaryaDigital Penerbitan Rasmi',
    publicationYear: 2026,
    isbn: '978-967-KD-KBK-2026',
    isFeatured: true,
    isBestseller: true,
    coverImage: '/assets/aistudio/Janda_Bukan_Akhir_hero_banner_933c27ae.png',
    coverGradient: 'from-indigo-950 via-slate-900 to-indigo-900',
    coverAccent: '#6366f1',
    coverBadge: 'Naskhah Terbaharu',
    pdfFileName: 'Kembara_Bangkarim_Halaman_01-10.pdf',
    pdfFileSize: '44.9 MB',
    createdAt: 1730000050000,
    sampleContent: {
      chapters: [
        {
          id: 1,
          title: 'Bab 1: Destinasi Tanpa Peta',
          subtitle: 'Langkah Pertama di Tanah Pusaka',
          paragraphs: [
            'Jalan berliku di lereng bukit menghampar pemandangan rimba hijau nan luas saujana mata memandang.',
            'Bang Karim menggalas beg kanvasnya. Di hadapannya, sebuah kembara mencari makna diri dan warisan leluhur baru sahaja bermula.',
            'Setiap batu sungai dan desiran angin rimba seolah-olah mengkhabarkan rahsia orang-orang tua terdahulu yang tidak tertulis dalam buku teks.',
            'Langkah diatur perlahan namun penuh keyakinan. Di hujung jalan ini ada jawapan kepada persoalan yang bertahun-tahun bermain di sanubari.',
          ],
        },
        {
          id: 2,
          title: 'Bab 2: Rahsia di Puncak Bukit Selasih',
          subtitle: 'Singgah di Teratak Usang',
          paragraphs: [
            'Kabus petang mula turun merayapi bumbung teratak kayu di puncak bukit.',
            'Di sana, sebuah pertemuan yang tidak diduga telah membuka tirai kepada hikmah besar yang mengubah pandangan Bang Karim terhadap erti persaudaraan dan perjuangan.',
          ],
        },
      ],
    },
  },
];

// INITIAL_EBOOKS merujuk terus kepada senarai naskhah rasmi (100% bebas daripada naskhah dummy contoh)
export const INITIAL_EBOOKS: EBook[] = OFFICIAL_PUBLISHED_BOOKS;
