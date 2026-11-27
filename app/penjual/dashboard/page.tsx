import Link from "next/link";
import { redirect } from "next/navigation";
import SellerDashboard from "@/components/seller/SellerDashboard";
import SellerAvatar from "@/components/seller/SellerAvatar";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard Penjual | KaryaDigital" };

export default async function SellerDashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profileError || profile?.role !== "seller") redirect("/akaun");

  const { data: shop, error: shopError } = await supabase
    .from("seller_applications")
    .select("shop_name, author_name, description, status")
    .eq("user_id", user.id).eq("status", "approved").maybeSingle();
  if (shopError) throw new Error("Gagal membaca maklumat kedai: " + shopError.message);

  const { data: image, error: imageError } = await supabase
    .from("seller_profile_images").select("avatar_path")
    .eq("seller_id", user.id).maybeSingle();
  if (imageError) console.error("Gagal membaca gambar profil penjual.");
  const avatarUrl = !imageError && image?.avatar_path
    ? supabase.storage.from("seller-avatars").getPublicUrl(image.avatar_path).data.publicUrl
    : null;

  return (
    <>
      {shop ? (
        <section className="border-b border-indigo-100 bg-indigo-50 px-6 py-5">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Kedai KaryaDigital Anda</p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <SellerAvatar src={avatarUrl} name={shop.shop_name} />
                <div className="min-w-0">
                  <h1 className="break-words text-2xl font-bold text-gray-900">{shop.shop_name}</h1>
                  <p className="mt-1 break-words text-sm text-gray-700">Penulis: {shop.author_name}</p>
                  <span className="mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Penjual Diluluskan</span>
                </div>
              </div>
              <Link href="/penjual/profil"
                className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50">
                Kemas Kini Profil
              </Link>
            </div>
            {shop.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-600">{shop.description}</p>}
          </div>
        </section>
      ) : (
        <section className="bg-amber-50 px-6 py-4 text-sm text-amber-900">Maklumat kedai yang diluluskan tidak dijumpai.</section>
      )}
      <SellerDashboard />
    </>
  );
}
