import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RequestRefundForm from "./RequestRefundForm";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengurusan Refund | MyKarya",
};

const PAGE_SIZE = 20;

function rm(value: number | string) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ms-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const statusLabels: Record<string, string> = {
  requested: "Permohonan Terbuka",
  completed: "Refund Selesai",
  cancelled: "Permohonan Dibatalkan",
};

const statusStyles: Record<string, string> = {
  requested: "bg-amber-100 text-amber-900",
  completed: "bg-green-100 text-green-900",
  cancelled: "bg-slate-100 text-slate-700",
};

export default async function AdminRefundPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/akaun");
  }

  const query = await searchParams;
  const requestedPage =
    typeof query.page === "string" ? query.page : "1";
  const parsedPage = Number(requestedPage);

  const page =
    /^\d+$/.test(requestedPage) &&
    Number.isSafeInteger(parsedPage) &&
    parsedPage >= 1 &&
    parsedPage <= 100000
      ? parsedPage
      : 1;

  const offset = (page - 1) * PAGE_SIZE;

  const { data, error } = await supabase
    .from("order_refunds")
    .select(
      "id, order_id, payment_id, amount, reason, status, created_at, refunded_at, refund_reference, closed_at, closure_reason"
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + PAGE_SIZE);

  const refunds = error ? [] : (data ?? []).slice(0, PAGE_SIZE);
  const hasNext = !error && (data?.length ?? 0) > PAGE_SIZE;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          {"\u2190"} Dashboard Admin
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-slate-900">
          Pengurusan Refund
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Rekod permohonan pemulangan bayaran penuh bagi pesanan.
          Pembayaran asal dikekalkan untuk tujuan audit.
        </p>

        <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-900">
          Halaman ini membolehkan Admin membuka dan menyemak permohonan
          refund. Pemindahan wang dibuat secara berasingan.
          Status Refund Selesai bermaksud
          penyelesaian refund telah direkodkan oleh Admin.
        </div>
        <RequestRefundForm />
        {error ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            Senarai refund gagal dimuatkan. Sila muat semula halaman.
          </p>
        ) : refunds.length === 0 ? (
          <div className="mt-6 rounded-2xl border bg-white p-6 text-slate-600">
            Tiada rekod refund pada halaman ini.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {refunds.map((refund) => (
              <article
                key={refund.id}
                className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">
                      Permohonan pada {formatDate(refund.created_at)}
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                      {rm(refund.amount)}
                    </h2>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[refund.status] ??
                      "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {statusLabels[refund.status] ?? refund.status}
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">ID refund</dt>
                    <dd className="mt-1 break-all font-mono text-xs">
                      {refund.id}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">ID pesanan</dt>
                    <dd className="mt-1 break-all font-mono text-xs">
                      {refund.order_id}
                    </dd>
                  </div>

                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">Sebab permohonan</dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-slate-800">
                      {refund.reason}
                    </dd>
                  </div>
                </dl>

                {refund.status === "requested" && (
                  <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                    Permohonan masih terbuka. Penyelesaian refund
                    belum direkodkan.
                  </p>
                )}

                {refund.status === "completed" && (
                  <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-900">
                    <p>
                      Masa pemulangan wang:{" "}
                      {formatDate(refund.refunded_at)}
                    </p>
                    <p className="mt-2 break-words">
                      Rujukan: {refund.refund_reference ?? "-"}
                    </p>
                  </div>
                )}

                {refund.status === "cancelled" && (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    <p>
                      Permohonan dibatalkan pada:{" "}
                      {formatDate(refund.closed_at)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words">
                      Sebab: {refund.closure_reason ?? "-"}
                    </p>
                    <p className="mt-2">
                      Pembatalan permohonan ini tidak bermaksud
                      wang telah dipulangkan kepada pembeli.
                    </p>
                  </div>
                )}
                                <Link
                  href={`/admin/refund/${refund.id}`}
                  className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Lihat Butiran
                </Link>
              </article>
            ))}
          </div>
        )}

        <nav
          aria-label="Halaman senarai refund"
          className="mt-6 flex items-center justify-between gap-4"
        >
          {page > 1 ? (
            <Link
              href={`/admin/refund?page=${page - 1}`}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
            >
              Sebelumnya
            </Link>
          ) : (
            <span />
          )}

          <span className="text-sm text-slate-500">
            Halaman {page}
          </span>

          {hasNext ? (
            <Link
              href={`/admin/refund?page=${page + 1}`}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
            >
              Seterusnya
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </main>
  );
}
