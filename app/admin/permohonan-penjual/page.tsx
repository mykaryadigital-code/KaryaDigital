
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import ReviewButtons from "./review-buttons";

export const dynamic = "force-dynamic";

type Application = {
  id: string;
  shop_name: string;
  author_name: string;
  description: string | null;
  status: string;
  created_at: string;
};

export default async function PermohonanPenjualPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

 if (profileError || profile?.role !== "admin") {
  console.log("SEMAKAN ADMIN PENJUAL", {
    email: user.email,
    userId: user.id,
    role: profile?.role,
    error: profileError?.message,
  });

  redirect("/akaun");
}

  const { data, error } = await supabase
    .from("seller_applications")
    .select(
      "id, shop_name, author_name, description, status, created_at"
    )
    .order("created_at", { ascending: false });

  const applications: Application[] = data ?? [];

  const pending = applications.filter(
    (a) => a.status === "pending"
  );

  const approved = applications.filter(
    (a) => a.status === "approved"
  );

  const rejected = applications.filter(
    (a) => a.status === "rejected"
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="text-sm font-semibold text-indigo-600"
        >
          ← Kembali ke Dashboard Admin
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Permohonan Penjual
        </h1>

        <p className="mt-2 text-gray-600">
          Semak dan urus permohonan penjual KaryaDigital.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { label: "Menunggu", value: pending.length },
            { label: "Diluluskan", value: approved.length },
            { label: "Ditolak", value: rejected.length },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-white p-5 text-center shadow-sm"
            >
              <p className="text-3xl font-bold text-gray-900">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
            Gagal membaca permohonan: {error.message}
          </p>
        )}

        {!error && applications.length === 0 && (
          <div className="mt-8 rounded-xl bg-white p-8 text-center text-gray-500">
            Belum ada permohonan penjual.
          </div>
        )}

        <div className="mt-8 space-y-4">
          {applications.map((application) => (
            <div
              key={application.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {application.shop_name}
                  </h2>

                  <p className="mt-1 text-sm text-gray-600">
                    Penulis: {application.author_name}
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {application.status}
                </span>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
                {application.description || "Tiada penerangan."}
              </p>

              <p className="mt-4 text-xs text-gray-500">
                Dihantar:{" "}
                {new Date(application.created_at).toLocaleDateString(
                  "ms-MY",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "Asia/Kuala_Lumpur",
                  }
                )}
              </p>

              {application.status === "pending" && (
                <div className="mt-5 border-t pt-5">
                  <ReviewButtons applicationId={application.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
