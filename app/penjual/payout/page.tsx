import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sejarah Payout | MyKarya",
};

const PAGE_SIZE = 20;

type Breakdown = {
  earnings: number;
  deductions: number;
  deductionCount: number;
} | null;

function rm(value: number | string) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(Number(value));
}

function toSen(value: number | string) {
  const amount = Number(value);
  const sen = Math.round(amount * 100);

  if (!Number.isFinite(amount) || !Number.isSafeInteger(sen)) {
    throw new Error("Amaun tidak sah.");
  }

  return sen;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("ms-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function SellerPayoutPage({
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

  if (profileError || profile?.role !== "seller") {
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
    .from("seller_payouts")
    .select(
      "id, payout_month, amount, status, bank_name, account_number, created_at, paid_at, transfer_reference, cancelled_at, cancellation_reason"
    )
    .eq("seller_id", user.id)
    .order("payout_month", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + PAGE_SIZE);

  const payouts = error ? [] : (data ?? []).slice(0, PAGE_SIZE);
  const hasNext = !error && (data?.length ?? 0) > PAGE_SIZE;

  const entries = await Promise.all(
    payouts.map(async (payout): Promise<[string, Breakdown]> => {
      try {
        const [itemsResult, adjustmentsResult] = await Promise.all([
          supabase
            .from("seller_payout_items")
            .select("id, net_amount", { count: "exact" })
            .eq("payout_id", payout.id)
            .order("id"),
          supabase
            .from("seller_payout_adjustments")
            .select("id, amount", { count: "exact" })
            .eq("payout_id", payout.id)
            .order("id"),
        ]);

        if (itemsResult.error || adjustmentsResult.error) {
          return [payout.id, null];
        }

        const items = itemsResult.data ?? [];
        const adjustments = adjustmentsResult.data ?? [];

        if (
          items.length === 0 ||
          itemsResult.count === null ||
          adjustmentsResult.count === null ||
          items.length !== itemsResult.count ||
          adjustments.length !== adjustmentsResult.count
        ) {
          return [payout.id, null];
        }

        const earnings = items.reduce(
          (total, item) => total + toSen(item.net_amount),
          0
        );
        const deductions = adjustments.reduce(
          (total, adjustment) => total + toSen(adjustment.amount),
          0
        );

        if (
          !Number.isSafeInteger(earnings) ||
          !Number.isSafeInteger(deductions) ||
          !Number.isSafeInteger(earnings - deductions) ||
          earnings - deductions !== toSen(payout.amount)
        ) {
          return [payout.id, null];
        }

        return [
          payout.id,
          {
            earnings,
            deductions,
            deductionCount: adjustments.length,
          },
        ];
      } catch {
        return [payout.id, null];
      }
    })
  );

  const breakdowns = new Map<string, Breakdown>(entries);

  const labels: Record<string, string> = {
    prepared: "Disediakan",
    paid: "Dibayar",
    cancelled: "Dibatalkan",
  };

  const styles: Record<string, string> = {
    prepared: "bg-amber-100 text-amber-900",
    paid: "bg-green-100 text-green-800",
    cancelled: "bg-slate-100 text-slate-700",
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/penjual/dashboard"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          {"\u2190"} Dashboard Penjual
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-gray-900">
          Sejarah Payout
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Payout bulanan bermula pada 7 haribulan dengan minimum
          RM20 selepas potongan yang layak. Baki dan potongan
          yang belum dimasukkan ke payout dibawa ke pengiraan
          berikutnya. Caj gateway mesti disahkan dahulu.
        </p>

        <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
          Status Disediakan bermaksud rekod payout telah dibuat.
          Status Dibayar bermaksud Admin telah merekodkan transfer.
          Semak penerimaan wang melalui akaun bank anda.
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-red-50 p-5 text-sm text-red-700"
          >
            Sejarah payout gagal dimuatkan. Sila muat semula halaman.
          </p>
        ) : payouts.length === 0 ? (
          <p className="mt-6 rounded-2xl border bg-white p-6 text-gray-600">
            Tiada rekod payout pada halaman ini.
          </p>
        ) : (
          <div className="mt-6 space-y-5">
            {payouts.map((payout) => {
              const breakdown = breakdowns.get(payout.id);

              return (
                <article
                  key={payout.id}
                  className="rounded-2xl border bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Bulan payout: {payout.payout_month.slice(0, 7)}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold text-gray-900">
                        {rm(payout.amount)}
                      </h2>
                      <p className="mt-1 text-xs text-gray-500">
                        {payout.status === "cancelled"
                          ? "Jumlah rekod yang dibatalkan"
                          : "Jumlah payout selepas potongan"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        styles[payout.status] ??
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {labels[payout.status] ?? payout.status}
                    </span>
                  </div>

                  <dl className="mt-5 space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">
                        Bank pada rekod payout
                      </dt>
                      <dd className="mt-1">
                        {payout.bank_name} {"\u2014"} ****
                        {payout.account_number.slice(-4)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Disediakan pada</dt>
                      <dd className="mt-1">
                        {formatDate(payout.created_at)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">ID payout</dt>
                      <dd className="mt-1 break-all font-mono text-xs">
                        {payout.id}
                      </dd>
                    </div>
                  </dl>

                  <section className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                    <h3 className="font-semibold text-indigo-950">
                      Pecahan Payout
                    </h3>

                    {breakdown ? (
                      <>
                        <dl className="mt-4 space-y-3 text-sm text-indigo-950">
                          <div className="flex justify-between gap-4">
                            <dt>Jumlah bersih item jualan</dt>
                            <dd className="font-semibold">
                              {rm(breakdown.earnings / 100)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-4">
                            <dt>Tolak kos refund seller</dt>
                            <dd className="font-semibold">
                              {rm(breakdown.deductions / 100)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-4 border-t border-indigo-200 pt-3 font-bold">
                            <dt>
                              {payout.status === "cancelled"
                                ? "Jumlah rekod dibatalkan"
                                : "Jumlah payout"}
                            </dt>
                            <dd>{rm(payout.amount)}</dd>
                          </div>
                        </dl>

                        <p className="mt-3 text-xs leading-relaxed text-indigo-900">
                          {breakdown.deductionCount > 0
                            ? `${breakdown.deductionCount} rekod potongan refund termasuk dalam payout ini. Jumlah sudah ditolak kos tersebut; jangan tolak sekali lagi.`
                            : "Tiada potongan refund dalam payout ini."}
                        </p>
                      </>
                    ) : (
                      <p
                        role="alert"
                        className="mt-3 text-sm text-red-700"
                      >
                        Pecahan payout tidak dapat disahkan.
                        Muat semula halaman. Jika masih berlaku,
                        hubungi Admin dengan ID payout ini.
                      </p>
                    )}
                  </section>

                  {payout.status === "prepared" && (
                    <p className="mt-4 text-sm text-amber-900">
                      Item jualan dan potongan berkaitan telah
                      ditempah untuk payout ini. Transfer belum
                      direkodkan sebagai selesai.
                    </p>
                  )}

                  {payout.status === "paid" && (
                    <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-900">
                      <p>
                        Tarikh transfer: {formatDate(payout.paid_at)}
                      </p>
                      <p className="mt-2 break-words">
                        Rujukan: {payout.transfer_reference}
                      </p>
                    </div>
                  )}

                  {payout.status === "cancelled" && (
                    <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                      <p>
                        Dibatalkan pada:{" "}
                        {formatDate(payout.cancelled_at)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words">
                        Sebab: {payout.cancellation_reason}
                      </p>
                      <p className="mt-2">
                        Item jualan dan potongan daripada payout ini
                        telah dilepaskan untuk pengiraan payout
                        semula. Pecahan di atas ialah salinan
                        sejarah rekod yang dibatalkan.
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <nav
          aria-label="Halaman sejarah payout"
          className="mt-6 flex items-center justify-between gap-4"
        >
          {page > 1 ? (
            <Link
              href={`/penjual/payout?page=${page - 1}`}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold"
            >
              Sebelumnya
            </Link>
          ) : (
            <span />
          )}

          <span className="text-sm text-gray-500">
            Halaman {page}
          </span>

          {hasNext ? (
            <Link
              href={`/penjual/payout?page=${page + 1}`}
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
