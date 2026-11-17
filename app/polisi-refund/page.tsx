import Link from "next/link";

export const metadata = {
  title: "Polisi Bayaran Balik | KaryaDigital",
  description:
    "Polisi bayaran balik pembelian eBook digital di KaryaDigital.",
};

const sections = [
  {
    title: "1. Pembelian produk digital",
    paragraphs: [
      "Produk di KaryaDigital dibekalkan secara digital. Selepas pembayaran disahkan, pembeli boleh membaca eBook secara online dan memuat turun PDF melalui akaun pembelian.",
      "Bayaran balik biasa tidak ditawarkan semata-mata kerana berubah fikiran, tidak lagi memerlukan produk atau tidak menyukai gaya penulisan selepas akses atau muat turun diberikan. Ini tidak menjejaskan pertimbangan aduan berkaitan masalah sebenar pada produk atau pembekalannya.",
    ],
  },
  {
    title: "2. Masalah fail atau akses",
    paragraphs: [
      "Jika PDF rosak, fail yang diterima salah atau pembelian berbayar tidak dapat diakses, hubungi bantuan. Kami akan menyemak masalah dan membantu memulihkan akses atau menyediakan fail yang betul terlebih dahulu, apabila penyelesaian tersebut sesuai.",
      "Jika masalah tidak dapat diselesaikan dalam tempoh yang munasabah, bayaran balik boleh dipertimbangkan berdasarkan keadaan dan hak pengguna yang terpakai.",
    ],
  },
  {
    title: "3. Pembayaran berganda",
    paragraphs: [
      "Jika terdapat caj berganda untuk pembelian yang sama, sertakan ID pesanan dan rujukan bagi setiap transaksi. Lebihan pembayaran yang disahkan akan dipulangkan.",
      "Jika wang sudah ditolak tetapi status pesanan masih pending, jangan buat bayaran semula. Gunakan Semak Status Bayaran jika tersedia atau hubungi bantuan terlebih dahulu.",
    ],
  },
  {
    title: "4. Produk tidak sepadan dengan penerangan",
    paragraphs: [
      "Aduan bahawa kandungan berbeza secara ketara daripada penerangan jualan akan disemak berdasarkan penerangan produk, fail yang dibekalkan dan bukti berkaitan.",
      "Penyelesaian boleh melibatkan pembetulan, penggantian atau bayaran balik mengikut keadaan. Ketidakpuasan subjektif semata-mata tidak menjamin kelulusan refund.",
    ],
  },
  {
    title: "5. Semakan dan pemprosesan",
    paragraphs: [
      "Permohonan disemak secara manual oleh Admin. Kami mungkin meminta maklumat tambahan dan mendapatkan penjelasan daripada penjual. Menghantar permohonan tidak bermaksud bayaran balik telah diluluskan.",
      "Jika diluluskan, kami akan memaklumkan jumlah dan kaedah pemulangan serta anggaran masa pemprosesan. Masa wang diterima tertakluk juga kepada penyedia pembayaran atau bank.",
      "Jika pembelian dibatalkan sepenuhnya melalui refund, akses digital bagi pembelian tersebut akan ditamatkan. Pembeli hendaklah berhenti menggunakan dan memadam salinan yang telah dimuat turun; fail pada peranti tidak boleh dipadam dari jauh oleh KaryaDigital.",
    ],
  },
  {
    title: "6. Hak pengguna",
    paragraphs: [
      "Polisi ini tidak mengecualikan atau mengehadkan hak dan remedi pengguna yang tidak boleh diketepikan di bawah undang-undang yang terpakai.",
    ],
  },
];

export default function RefundPolicyPage() {
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
            Polisi Bayaran Balik
          </h1>

          <p className="mt-3 leading-relaxed text-slate-600">
            Panduan permohonan dan penyelesaian masalah pembelian
            eBook digital.
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
              Cara menghantar permohonan
            </h2>

            <p className="mt-3 text-indigo-950">
              Emailkan permohonan kepada:
            </p>

            <a
              href="mailto:admin.karyadigital@gmail.com?subject=Permohonan%20Bayaran%20Balik"
              className="mt-3 inline-block break-all font-semibold text-indigo-700 hover:underline"
            >
              admin.karyadigital@gmail.com
            </a>

            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-indigo-950">
              <li>Email akaun yang membuat pembelian.</li>
              <li>ID pesanan dan tajuk eBook.</li>
              <li>Sebab permohonan dan penerangan masalah.</li>
              <li>
                Rujukan transaksi serta bukti yang berkaitan.
              </li>
            </ul>

            <p className="mt-4 text-sm text-indigo-950">
              Hubungi kami secepat mungkin apabila masalah dikesan.
              Jangan sertakan password, kod OTP atau maklumat login
              bank. Tutup maklumat sensitif yang tidak diperlukan
              pada bukti pembayaran.
            </p>
          </section>
        </div>

        <nav
          aria-label="Pautan bantuan refund"
          className="mt-8 flex flex-wrap gap-3"
        >
          <Link
            href="/bantuan"
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Bantuan Pembeli
          </Link>

          <Link
            href="/pesanan"
            className="rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Pesanan Saya
          </Link>
        </nav>
      </div>
    </main>
  );
}
