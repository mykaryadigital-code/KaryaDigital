import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PayoutCandidatesPanel from "./PayoutCandidatesPanel";

export const metadata = {
  title: "Payout Penjual | KaryaDigital",
};

export const dynamic = "force-dynamic";

export default async function AdminPayoutPage() {
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

  if (error || profile?.role !== "admin") {
    redirect("/akaun");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="text-sm font-semibold text-indigo-600"
        >
          ← Dashboard Admin
        </Link>

        <h1 className="mt-7 text-3xl font-extrabold text-slate-900">
          Payout Penjual
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Payout bulanan bermula pada 7 haribulan, minimum RM20.
          Penyediaan payout tidak membuat transfer bank.
        </p>

        <PayoutCandidatesPanel />
      </div>
    </main>
  );
}
