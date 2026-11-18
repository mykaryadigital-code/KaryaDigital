import Link from "next/link";

export const metadata = {
  title: "Maklumat Penjual | KaryaDigital",
  description:
    "Panduan komisen, caj gateway dan payout bulanan penjual KaryaDigital.",
};

export default function SellerInformationPage() {
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
          <p className="text-sm font-semibold text-indigo-600">
            KaryaDigital
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Maklumat Penjual
          </h1>
          <p className="mt-3 leading-relaxed text-slate-600">
            Panduan membuka kedai, menjual eBook dan menerima payout
            melalui KaryaDigital.
          </p>
        </header>

        <div className="mt-8 space-y-6">
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">
              1. Pendaftaran dan penerbitan
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Daftar akaun dan hantar permohonan penjual. Selepas
              permohonan diluluskan oleh Admin, anda boleh memuat naik
              eBook dan gambar kulit, menetapkan harga serta menghantar
              eBook untuk semakan penerbitan.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              Harga minimum setiap eBook ialah RM5. eBook hanya
              dipaparkan untuk jualan selepas diluluskan.
            </p>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">
              2. Komisen platform
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              KaryaDigital mengenakan komisen sebanyak 10% daripada
              harga jualan setiap item eBook yang pembayarannya berjaya
              disahkan. Komisen dikira dan dibundarkan kepada dua
              tempat perpuluhan bagi setiap item.
            </p>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">
              3. Caj pembayaran
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Caj gateway sebenar yang mengurangkan hasil jualan
              ditanggung oleh penjual. Caj disahkan oleh Admin
              berdasarkan rekod transaksi atau penyata gateway.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              Jika satu pembayaran melibatkan beberapa eBook, caj
              diagihkan mengikut bahagian harga jualan setiap item.
              Pelarasan sen dibuat supaya jumlah agihan sepadan dengan
              caj sebenar.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              Caj yang dibayar berasingan oleh pembeli dan tidak
              mengurangkan hasil penjual tidak dipotong sekali lagi.
              Pendapatan yang cajnya belum disahkan belum layak
              dimasukkan dalam payout.
            </p>
          </section>

          <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
            <h2 className="text-xl font-bold text-indigo-950">
              Contoh pengiraan
            </h2>
            <p className="mt-3 text-sm text-indigo-900">
              Contoh bagi satu eBook dengan caj gateway yang telah
              disahkan sebanyak RM1:
            </p>

            <dl className="mt-5 space-y-3 text-sm text-indigo-950">
              <div className="flex justify-between gap-4">
                <dt>Harga jualan</dt>
                <dd className="font-semibold">RM9.90</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Komisen platform 10%</dt>
                <dd className="font-semibold">− RM0.99</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Caj gateway dalam contoh ini</dt>
                <dd className="font-semibold">− RM1.00</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-indigo-200 pt-3 font-bold">
                <dt>Pendapatan bersih penjual</dt>
                <dd>RM7.91</dd>
              </div>
            </dl>

            <p className="mt-4 text-sm text-indigo-900">
              RM1 ialah caj dalam contoh ini, bukan kadar tetap untuk
              semua transaksi. Caj sebenar mengikut rekod gateway.
            </p>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">
              4. Jadual dan minimum payout
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Payout diproses secara bulanan, bermula pada 7 haribulan
              mengikut waktu Malaysia. Pengiraan melibatkan pendapatan
              yang pembayarannya disahkan sebelum awal bulan payout,
              termasuk baki terdahulu yang belum dibayar dan masih
              layak.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              Contohnya, payout Disember melibatkan pendapatan yang
              disahkan sebelum 1 Disember. Jualan bulan Disember
              termasuk dalam pengiraan bulan berikutnya.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              Minimum payout ialah RM20 pendapatan bersih yang layak
              selepas potongan kos refund yang dimasukkan dalam pengiraan.
              Baki di bawah RM20 dibawa ke bulan seterusnya.
              Penjual perlu melengkapkan butiran bank sebelum payout
              boleh disediakan.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              Tarikh 7 haribulan ialah tarikh mula pemprosesan,
              bukan jaminan wang diterima pada hari yang sama.
              Penerimaan tertakluk kepada semakan Admin dan
              pemprosesan bank.
            </p>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">
              5. Bank dan status payout
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Pembayaran jualan diterima melalui akaun gateway
              platform. Admin membuat transfer payout secara manual
              ke akaun bank penjual dan merekodkan rujukan transfer
              dalam sistem.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              Pastikan nama bank, pemegang akaun dan nombor akaun
              tepat. Penyimpanan butiran bank ialah semakan format,
              bukan pengesahan pemilikan akaun.
            </p>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-600">
              <li>
                <strong>Disediakan:</strong> item pendapatan telah
                dimasukkan dalam rekod payout. Transfer belum
                direkodkan sebagai selesai.
              </li>
              <li>
                <strong>Dibayar:</strong> Admin telah merekodkan
                transfer. Semak penerimaan melalui akaun bank anda.
              </li>
              <li>
                <strong>Dibatalkan:</strong> rekod payout dibatalkan
                dan item dilepaskan untuk penyediaan payout semula.
              </li>
            </ul>
            <p className="mt-3 leading-relaxed text-slate-600">
              Butiran bank disalin ketika payout disediakan.
              Perubahan bank selepas itu tidak mengubah rekod payout
              sedia ada. Hubungi Admin jika pembetulan diperlukan
              sebelum transfer dibuat.
            </p>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">
              6. Kandungan dan akses pembeli
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Muat naik hanya kandungan yang anda hasilkan atau
              mempunyai kebenaran untuk dijual. Pastikan fail PDF,
              gambar kulit dan penerangan produk sepadan dengan
              eBook yang ditawarkan.
            </p>
            <p className="mt-3 leading-relaxed text-slate-600">
              Pembeli berbayar boleh membaca eBook secara online
              dan memuat turun PDF. Menyahsiarkan eBook daripada
              katalog tidak membatalkan akses pembeli sedia ada.
              Pembelian tidak memindahkan hak cipta atau memberi
              kebenaran menjual semula dan mengedarkan salinan tanpa
              izin pemilik hak.
            </p>
          </section>
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">
              7. Refund dan pelarasan pendapatan
            </h2>

            <p className="mt-3 leading-relaxed text-slate-600">
              Aduan pembeli disemak oleh Admin berdasarkan masalah
              produk, pembekalan dan bukti berkaitan. Permohonan
              refund tidak bermaksud refund telah diluluskan atau
              wang telah dipulangkan.
            </p>

            <p className="mt-3 leading-relaxed text-slate-600">
              Apabila permohonan refund dibuka dalam sistem,
              pendapatan berkaitan ditahan daripada penyediaan
              payout. Jika permohonan dibatalkan, penahanan oleh
              permohonan itu dilepaskan dan pendapatan tertakluk
              semula kepada syarat kelayakan payout.
            </p>

            <p className="mt-3 leading-relaxed text-slate-600">
              Apabila refund penuh selesai direkodkan, jualan
              tersebut tidak lagi dikira dalam pendapatan yang
              layak. Komisen platform bagi jualan yang direfund
              tidak dikenakan dalam pengiraan pendapatan semasa.
              Rekod jualan, pembayaran dan komisen asal kekal
              sebagai sejarah audit.
            </p>

            <p className="mt-3 leading-relaxed text-slate-600">
              Caj gateway mungkin dipulangkan sepenuhnya,
              sebahagiannya atau tidak dipulangkan oleh penyedia
              pembayaran. Admin merekodkan jumlah sebenar
              berdasarkan bukti. Baki caj ialah caj asal yang
              disahkan ditolak caj yang dipulangkan oleh gateway.
            </p>

            <p className="mt-3 leading-relaxed text-slate-600">
              Jika refund berpunca daripada masalah produk yang
              menjadi tanggungjawab penjual, baki caj gateway
              ditanggung penjual berdasarkan keputusan semakan.
              Jika berpunca daripada kesalahan platform, baki
              caj ditanggung platform. Sebab keputusan dan
              rujukan bukti direkodkan.
            </p>

            <p className="mt-3 leading-relaxed text-slate-600">
              Kos refund yang ditanggung penjual direkodkan
              sebagai pelarasan berasingan apabila refund selesai.
              Kos ini ditolak dalam pengiraan payout yang layak.
              Jumlah payout yang dipaparkan sudah mengambil kira
              potongan yang dimasukkan ke payout tersebut; kos
              yang sama tidak ditolak sekali lagi.
            </p>

            <p className="mt-3 leading-relaxed text-slate-600">
              Contoh: jika caj asal RM1 dan gateway memulangkan
              RM0.40, baki caj ialah RM0.60. Jika keputusan
              menetapkan penjual sebagai penanggung, pelarasan
              kos penjual ialah RM0.60, bukan RM1.
            </p>

            <p className="mt-3 leading-relaxed text-slate-600">
              Baki selepas pelarasan mungkin berada di bawah
              minimum payout atau menjadi negatif. Baki tersebut
              dibawa ke pengiraan berikutnya. Kes yang melibatkan
              payout sedia ada atau beberapa penjual memerlukan
              semakan Admin sebelum diproses.
            </p>

            <Link
              href="/polisi-refund"
              className="mt-4 inline-block font-semibold text-indigo-600 hover:underline"
            >
              Baca Polisi Bayaran Balik
            </Link>
          </section>
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Bantuan penjual
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Untuk pertanyaan tentang jualan, caj, bank atau payout,
              hubungi:
            </p>
            <a
              href="mailto:admin.karyadigital@gmail.com"
              className="mt-3 inline-block break-all font-semibold text-indigo-600 hover:underline"
            >
              admin.karyadigital@gmail.com
            </a>
            <p className="mt-3 text-sm text-slate-500">
              Sertakan ID pesanan atau payout yang berkaitan.
              Jangan hantar password atau kod OTP.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/jadi-penjual"
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Mohon Jadi Penjual
          </Link>
          <Link
            href="/akaun"
            className="rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Akaun Saya
          </Link>
        </div>
      </div>
    </main>
  );
}
