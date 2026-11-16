import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SellerBankForm from "./SellerBankForm";

export const metadata = {
  title: "Butiran Bank Penjual | KaryaDigital",
};

export const dynamic = "force-dynamic";

export default async function SellerBankPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "seller") {
    redirect("/akaun");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/penjual/dashboard"
          className="text-sm font-semibold text-indigo-600"
        >
          ← Dashboard Penjual
        </Link>

        <h1 className="mt-7 text-3xl font-extrabold text-slate-900">
          Butiran Bank
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Maklumat akaun untuk pembayaran pendapatan penjual.
          Pastikan nombor akaun dan nama pemegang tepat sebelum
          menyimpan.
        </p>

        <SellerBankForm />
      </div>
    </main>
  );
}