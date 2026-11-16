import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PayoutActions from "./PayoutActions";
import RecordTransferForm from "./RecordTransferForm";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Butiran Payout | KaryaDigital",
};

const rm = (value: number | string) =>
  new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(Number(value));

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ms-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function PayoutDetailsPage({
  params,
}: {
  params: Promise<{ payoutId: string }>;
}) {
  const { payoutId } = await params;

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

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      payoutId
    )
  ) {
    notFound();
  }

  const { data: payout, error: payoutError } = await supabase
    .from("seller_payouts")
    .select(
      "id, seller_id, payout_month, scheduled_date, amount, status, bank_name, account_holder_name, account_number, bank_revision, created_at, paid_at, transfer_reference, cancelled_at, cancellation_reason"
    )
    .eq("id", payoutId)
    .maybeSingle();

  if (payoutError) {
    throw new Error("Gagal mendapatkan butiran payout.");
  }

  if (!payout) notFound();

  const { data: items, error: itemsError } = await supabase
    .from("seller_payout_items")
    .select(
      "id, earning_id, gross_amount, platform_commission, gateway_fee, net_amount, released_at"
    )
    .eq("payout_id", payoutId)
    .order("id");

  if (itemsError) {
    throw new Error("Gagal mendapatkan item payout.");
  }

  const statusLabel: Record<string, string> = {
    prepared: "Disediakan — belum direkodkan sebagai dibayar",
    paid: "Dibayar",
    cancelled: "Dibatalkan",
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/payout"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Senarai Payout
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-gray-900">
          Butiran Payout
        </h1>

        <p className="mt-2 break-all font-mono text-xs text-gray-500">
          {payout.id}
        </p>

        <section className="mt-6 rounded-2xl border bg-white p-6">
          <p className="text-sm font-semibold text-indigo-700">
            {statusLabel[payout.status] ?? payout.status}
          </p>

          <p className="mt-3 text-3xl font-bold text-gray-900">
            {rm(payout.amount)}
          </p>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Bulan payout</dt>
              <dd className="mt-1">{payout.payout_month.slice(0, 7)}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Tarikh jadual payout</dt>
              <dd className="mt-1">{payout.scheduled_date}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Disediakan pada</dt>
              <dd className="mt-1">{formatDate(payout.created_at)}</dd>
            </div>

            <div>
              <dt className="text-gray-500">ID penjual</dt>
              <dd className="mt-1 break-all font-mono text-xs">
                {payout.seller_id}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900">
            Salinan Butiran Bank Payout
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Butiran ini disimpan ketika payout disediakan. Perubahan
            pada akaun bank semasa tidak mengubah salinan ini.
          </p>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Bank</dt>
              <dd className="mt-1 font-semibold">{payout.bank_name}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Pemegang akaun</dt>
              <dd className="mt-1">{payout.account_holder_name}</dd>
            </div>

            <div>
              <dt className="text-gray-500">Nombor akaun</dt>
              <dd className="mt-1 break-all font-mono">
                {payout.account_number}
              </dd>
            </div>

            <div>
              <dt className="text-gray-500">Versi butiran bank</dt>
              <dd className="mt-1">{String(payout.bank_revision)}</dd>
            </div>
          </dl>

          {payout.status === "prepared" && (
            <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Rekod ini belum mengesahkan transfer bank. Jika butiran
              bank perlu ditukar sebelum transfer, batalkan payout
              dan sediakan semula menggunakan butiran yang betul.
            </p>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border bg-white">
          <h2 className="px-6 py-5 text-lg font-bold text-gray-900">
            Item Payout
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-100 text-gray-600">
                <tr>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3 text-right">Kasar</th>
                  <th className="px-5 py-3 text-right">Komisen</th>
                  <th className="px-5 py-3 text-right">Caj gateway</th>
                  <th className="px-5 py-3 text-right">Bersih</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {(items ?? []).map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <p>Item {index + 1}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.released_at ? "Dilepaskan" : "Ditempah"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {rm(item.gross_amount)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {rm(item.platform_commission)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {rm(item.gateway_fee)}
                    </td>
                    <td className="px-5 py-4 text-right font-bold">
                      {rm(item.net_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
               {payout.status === "prepared" && (
          <>
            <RecordTransferForm
              key={`transfer-${payout.id}`}
              payoutId={payout.id}
              amount={payout.amount}
              bankRevision={payout.bank_revision}
            />

            <PayoutActions
              key={`cancel-${payout.id}`}
              payoutId={payout.id}
            />
          </>
        )}
        {payout.status === "paid" && (
          <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
            <h2 className="font-bold text-green-900">Rekod Transfer</h2>
            <p className="mt-3 text-sm">
              Tarikh: {formatDate(payout.paid_at)}
            </p>
            <p className="mt-2 break-all text-sm">
              Rujukan: {payout.transfer_reference}
            </p>
          </section>
        )}

        {payout.status === "cancelled" && (
          <section className="mt-6 rounded-2xl border bg-white p-6">
            <h2 className="font-bold">Rekod Pembatalan</h2>
            <p className="mt-3 text-sm">
              Tarikh: {formatDate(payout.cancelled_at)}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">
              Sebab: {payout.cancellation_reason}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
