import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SellerAvatar from "@/components/seller/SellerAvatar";
import ProductActions from "./ProductActions";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PublicSeller = {
  shopName: string;
  authorName: string;
  avatarUrl: string | null;
};

const getProduct = cache(async (ebookId: string) => {
  if (!uuidPattern.test(ebookId)) return null;
  const supabase = await createClient();

  // Jangan pilih pdf_path atau gunakan service role
  // untuk halaman produk awam.
  const { data, error } = await supabase
    .from("ebooks")
    .select("id, title, description, category, price, cover_path")
    .eq("id", ebookId)
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw new Error("Gagal mendapatkan maklumat eBook.");
  if (!data) return null;

  const coverUrl = data.cover_path
    ? supabase.storage.from("ebook-covers").getPublicUrl(data.cover_path).data.publicUrl
    : null;

  // Fungsi ini hanya memulangkan identiti awam penjual diluluskan.
  const { data: sellerRows, error: sellerError } = await supabase.rpc(
    "get_public_seller_profile", { p_ebook_id: ebookId }
  );
  if (sellerError) console.error("Gagal membaca profil awam penjual.");
  const row = !sellerError && Array.isArray(sellerRows) ? sellerRows[0] : null;
  let seller: PublicSeller | null = null;
  if (row && typeof row.shop_name === "string" && typeof row.author_name === "string") {
    seller = {
      shopName: row.shop_name,
      authorName: row.author_name,
      avatarUrl: typeof row.avatar_path === "string"
        ? supabase.storage.from("seller-avatars").getPublicUrl(row.avatar_path).data.publicUrl
        : null,
    };
  }

  return { ...data, coverUrl, seller };
});

export async function generateMetadata({ params }: {
  params: Promise<{ ebookId: string }>;
}): Promise<Metadata> {
  const { ebookId } = await params;
  const product = await getProduct(ebookId);
  if (!product) {
    return { title: "eBook Tidak Ditemui | KaryaDigital", robots: { index: false, follow: false } };
  }
  const description = product.description?.trim().slice(0, 160) || `Dapatkan ${product.title} di KaryaDigital.`;
  return {
    title: `${product.title} | KaryaDigital`,
    description,
    openGraph: {
      title: product.title,
      description,
      type: "website",
      ...(product.coverUrl ? { images: [{ url: product.coverUrl, alt: `Kulit ${product.title}` }] } : {}),
    },
    twitter: {
      card: product.coverUrl ? "summary_large_image" : "summary",
      title: product.title,
      description,
      ...(product.coverUrl ? { images: [product.coverUrl] } : {}),
    },
  };
}

export default async function EbookProductPage({ params }: {
  params: Promise<{ ebookId: string }>;
}) {
  const { ebookId } = await params;
  const product = await getProduct(ebookId);
  if (!product) notFound();

  const price = Number(product.price);
  const priceSen = Math.round(price * 100);
  const canBuy = Number.isFinite(price) && Number.isSafeInteger(priceSen)
    && price >= 5 && Math.abs(price * 100 - priceSen) < 0.000001;
  const formattedPrice = Number.isFinite(price)
    ? new Intl.NumberFormat("ms-MY", { style: "currency", currency: "MYR" }).format(price)
    : "Harga tidak tersedia";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-xl font-extrabold text-indigo-600">KaryaDigital</Link>
          <Link href="/akaun" className="text-sm font-semibold text-slate-600 hover:underline">Akaun Saya</Link>
        </header>
        <Link href="/#katalog" className="mt-8 inline-block text-sm font-semibold text-orange-700 hover:underline">
          {"\u2190"} Kembali ke Katalog
        </Link>

        <article className="mt-5 grid gap-8 rounded-3xl border bg-white p-5 shadow-sm sm:p-8 md:grid-cols-2">
          <div className="flex min-h-72 items-center justify-center rounded-2xl bg-slate-100 p-6">
            {product.coverUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={product.coverUrl} alt={`Kulit ${product.title}`}
                className="max-h-[520px] max-w-full rounded-lg object-contain shadow-lg" />
            ) : (
              <div className="flex min-h-72 w-48 items-center justify-center rounded-lg bg-slate-800 p-6 text-center text-xl font-bold text-white">{product.title}</div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-orange-700">{product.category}</p>
            <h1 className="mt-3 break-words text-3xl font-extrabold text-slate-900">{product.title}</h1>

            {product.seller && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <SellerAvatar src={product.seller.avatarUrl} name={product.seller.shopName} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Dijual oleh</p>
                  <p className="break-words text-sm font-semibold text-slate-900">{product.seller.shopName}</p>
                  {product.seller.authorName && product.seller.authorName !== product.seller.shopName && (
                    <p className="mt-1 break-words text-xs text-slate-600">Penulis: {product.seller.authorName}</p>
                  )}
                </div>
              </div>
            )}

            <p className="mt-5 text-3xl font-bold text-orange-600">{formattedPrice}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Produk digital dalam format PDF. Selepas pembayaran disahkan,
              akses baca online dan muat turun tersedia melalui akaun pembelian.
            </p>
            <ProductActions ebookId={product.id} canBuy={canBuy} />
            <Link href="/maklumat-pembeli" className="mt-4 inline-block text-sm font-semibold text-orange-700 underline">Lengkapkan maklumat pembeli</Link>
          </div>
        </article>

        <section className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Tentang eBook Ini</h2>
          <p className="mt-4 whitespace-pre-wrap break-words leading-relaxed text-slate-600">
            {product.description?.trim() || "Penerangan produk belum disediakan oleh penjual."}
          </p>
        </section>
        <nav aria-label="Bantuan pembelian" className="mt-8 flex flex-wrap gap-5 text-sm font-semibold text-indigo-700">
          <Link href="/pesanan" className="hover:underline">Pesanan Saya</Link>
          <Link href="/bantuan" className="hover:underline">Bantuan Pembeli</Link>
          <Link href="/polisi-refund" className="hover:underline">Polisi Bayaran Balik</Link>
        </nav>
      </div>
    </main>
  );
}
