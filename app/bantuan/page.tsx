import Link from "next/link";

export const metadata = {
  title: "Bantuan Pembeli | MyKarya",
  description:
    "Panduan membeli eBook, menyemak pembayaran, membaca dan memuat turun pembelian MyKarya.",
};

const sections = [
  {
    title: "1. Cara membeli eBook",
    paragraphs: [
      "Daftar akaun atau log masuk, kemudian pilih eBook di marketplace. Semak tajuk, penerangan dan harga sebelum menambahkannya ke troli.",
      "Teruskan checkout dan lengkapkan maklumat pembeli jika diminta. Pesanan akan direkodkan sebelum anda meneruskan pembayaran.",
    ],
  },
  {
    title: "2. Membuat pembayaran",
    paragraphs: [
      "Pada halaman Pesanan Saya, pilih Bayar Sekarang untuk membuka halaman pembayaran ToyyibPay. Semak jumlah akhir dan maklumat pembayaran sebelum mengesahkan transaksi.",
      "Selepas pembayaran, kembali ke Pesanan Saya menggunakan akaun yang membuat pembelian. Akses eBook tersedia apabila status pesanan menjadi Dibayar.",
    ],
  },
  {
    title: "3. Wang ditolak tetapi pesanan masih pending",
    paragraphs: [
      "Jangan buat bayaran atau pesanan baharu untuk pembelian yang sama. Muat semula Pesanan Saya dan gunakan butang Semak Status Bayaran jika tersedia.",
      "Jika status masih belum berubah, hubungi bantuan dengan ID pesanan dan rujukan transaksi bank atau ToyyibPay. Simpan bukti pembayaran untuk semakan.",
    ],
  },
  {
    title: "4. Membaca dan memuat turun",
    paragraphs: [
      "Buka Pesanan Saya dan cari pesanan berstatus Dibayar. Pilih Baca Online untuk membaca dalam browser, atau Muat Turun untuk mendapatkan fail PDF.",
      "Fail PDF yang dimuat turun boleh dibuka menggunakan aplikasi pembaca PDF. Pada telefon, semak folder Downloads atau aplikasi Files jika fail tidak terbuka secara automatik.",
      "Jika pautan bacaan tamat tempoh, kembali ke Pesanan Saya dan buka bacaan semula. Pastikan sambungan internet tersedia untuk bacaan online.",
    ],
  },
  {
    title: "5. eBook tidak lagi muncul di marketplace",
    paragraphs: [
      "eBook mungkin telah dinyahsiarkan daripada katalog. Pembelian berbayar sedia ada masih boleh diakses melalui Pesanan Saya walaupun eBook tidak lagi ditawarkan untuk pembelian baharu.",
      "Jika fail pembelian anda tidak boleh dibuka, hubungi bantuan dan sertakan ID pesanan serta tajuk eBook.",
    ],
  },
  {
    title: "6. Masalah log masuk dan pengesahan email",
    paragraphs: [
      "Gunakan email yang sama seperti ketika membeli. Jika menerima mesej Email not confirmed, semak email pengesahan termasuk folder Spam atau Junk.",
      "Gunakan pautan pengesahan paling baharu. Jika pautan tamat tempoh atau email tidak diterima, hubungi bantuan. Anda tidak perlu mendaftar akaun berulang kali.",
      "Jika terlupa password, gunakan pautan Lupa Password pada halaman log masuk.",
    ],
  },
];

export default function BuyerHelpPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          ← Kembali ke Marketplace
        </Link>

        <header className="mt-6">
          <p className="text-sm font-semibold text-slate-900">
            My<span className="text-orange-500">Karya</span>
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Bantuan Pembeli
          </h1>

          <p className="mt-3 leading-relaxed text-slate-600">
            Panduan mendapatkan dan mengakses eBook yang anda beli.
            Produk dihantar secara digital melalui akaun pembeli;
            tiada penghantaran buku fizikal.
          </p>
        </header>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border bg-white p-6"
            >
              <h2 className="text-xl font-bold text-slate-900">
                {section.title}
              </h2>

              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 leading-relaxed text-slate-600"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
            <h2 className="text-xl font-bold text-indigo-950">
              Hubungi bantuan
            </h2>

            <a
              href="mailto:admin.karyadigital@gmail.com"
              className="mt-3 inline-block break-all font-semibold text-indigo-700 hover:underline"
            >
              admin.karyadigital@gmail.com
            </a>

            <p className="mt-4 text-sm text-indigo-950">
              Untuk memudahkan semakan, sertakan:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-indigo-950">
              <li>Email akaun pembelian.</li>
              <li>ID pesanan dan tajuk eBook.</li>
              <li>Penerangan masalah atau mesej ralat.</li>
              <li>
                Rujukan transaksi jika melibatkan pembayaran.
              </li>
            </ul>

            <p className="mt-4 text-sm text-indigo-950">
              Jangan hantar password, kod OTP, nombor kad penuh
              atau maklumat login bank. Jika melampirkan bukti
              pembayaran, tutup maklumat yang tidak diperlukan.
            </p>
          </section>
        </div>

        <nav
          aria-label="Pautan bantuan"
          className="mt-8 flex flex-wrap gap-3"
        >
          <Link
            href="/pesanan"
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Pesanan Saya
          </Link>

          <Link
            href="/akaun"
            className="rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Akaun Saya
          </Link>

          <Link
            href="/lupa-password"
            className="rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Lupa Password
          </Link>
        </nav>
      </div>
    </main>
  );
}
