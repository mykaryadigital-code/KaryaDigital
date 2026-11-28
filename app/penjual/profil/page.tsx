import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SellerProfileForm from "@/components/seller/SellerProfileForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profil Penjual | MyKarya" };

export default async function SellerProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profileError || profile?.role !== "seller") redirect("/akaun");

  const { data: shop, error: shopError } = await supabase
    .from("seller_applications")
    .select("shop_name, author_name")
    .eq("user_id", user.id).eq("status", "approved").maybeSingle();
  if (shopError) throw new Error("Gagal membaca maklumat penjual.");

  if (!shop) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-6">
          <h1 className="text-2xl font-bold">Profil Penjual</h1>
          <p className="mt-4 text-slate-600">
            Permohonan penjual yang diluluskan tidak ditemui.
            Sila hubungi Admin untuk semakan.
          </p>
          <Link href="/akaun" className="mt-5 inline-block font-semibold text-orange-700 hover:underline">
            Kembali ke Akaun Saya
          </Link>
        </div>
      </main>
    );
  }

  const { data: image, error: imageError } = await supabase
    .from("seller_profile_images").select("avatar_path")
    .eq("seller_id", user.id).maybeSingle();
  if (imageError) throw new Error("Gagal membaca gambar profil penjual.");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/penjual/dashboard" className="text-sm font-semibold text-orange-700 hover:underline">
          {"\u2190"} Dashboard Penjual
        </Link>
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Profil Penjual</h1>
          <p className="mt-2 break-words text-lg font-semibold text-slate-800">{shop.shop_name}</p>
          <p className="mt-1 break-words text-sm text-slate-600">Penulis: {shop.author_name}</p>
          <SellerProfileForm
            sellerId={user.id}
            shopName={shop.shop_name}
            initialAvatarPath={image?.avatar_path ?? null}
          />
        </section>
      </div>
    </main>
  );
}
