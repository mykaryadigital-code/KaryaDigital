
import { redirect } from "next/navigation";
import SellerDashboard from "@/components/seller/SellerDashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard Penjual | KaryaDigital",
};

export default async function SellerDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (profileError || profile?.role !== "seller") {
    redirect("/akaun");
  }

  const { data: shop, error: shopError } =
    await supabase
      .from("seller_applications")
      .select("shop_name, author_name, description, status")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .maybeSingle();

  if (shopError) {
    throw new Error(
      "Gagal membaca maklumat kedai: " + shopError.message
    );
  }

  return (
    <>
      {shop ? (
        <section className="border-b border-indigo-100 bg-indigo-50 px-6 py-5">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Kedai KaryaDigital Anda
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {shop.shop_name}
            </h1>

            <p className="mt-1 text-sm text-gray-700">
              Penulis: {shop.author_name}
            </p>

            {shop.description && (
              <p className="mt-2 text-sm text-gray-600">
                {shop.description}
              </p>
            )}

            <span className="mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              Penjual Diluluskan
            </span>
          </div>
        </section>
      ) : (
        <section className="bg-amber-50 px-6 py-4 text-sm text-amber-900">
          Maklumat kedai yang diluluskan tidak dijumpai.
        </section>
      )}

      <SellerDashboard />
    </>
  );
}
