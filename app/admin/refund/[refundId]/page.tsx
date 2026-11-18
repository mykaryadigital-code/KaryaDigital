import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CancelRefundForm from "./CancelRefundForm";
import RefundCostForm from "./RefundCostForm";
import CompleteRefundForm from "./CompleteRefundForm";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Butiran Refund | KaryaDigital",
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export default async function RefundDetailsPage({
  params,
}: {
  params: Promise<{ refundId: string }>;
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

  const { refundId } = await params;
  if (!uuidPattern.test(refundId)) notFound();

  const { data: refund, error: refundError } = await supabase
    .from("order_refunds")
    .select(
      "id, order_id, payment_id, amount, reason, status, created_by, created_at, completed_by, refunded_at, refund_reference, closed_by, closed_at, closure_reason"
    )
    .eq("id", refundId)
    .maybeSingle();

  if (refundError) {
    throw new Error("Gagal mendapatkan butiran refund.");
  }
  if (!refund) notFound();

  const { data: cost, error: costError } = await supabase
    .from("order_refund_costs")
    .select(
      "id, original_gateway_fee, gateway_fee_returned, remaining_gateway_fee, cost_bearer, seller_charge, responsibility_reason, evidence_reference, recorded_at"
    )
    .eq("refund_id", refundId)
    .maybeSingle();

  if (costError) {
    throw new Error("Gagal mendapatkan keputusan kos refund.");
}
    let originalGatewayFee: number | string | null = null;

  if (refund.status === "requested" && !cost) {
    const { data: gatewayCost, error: gatewayCostError } = await supabase
      .from("payment_gateway_costs")
      .select("fee_amount")
      .eq("payment_id", refund.payment_id)
      .maybeSingle();

    if (gatewayCostError) {
      throw new Error("Gagal membaca caj gateway asal.");
    }

    originalGatewayFee = gatewayCost?.fee_amount ?? null;
  }
  const labels: Record<string, string> = {
    requested: "Permohonan Terbuka",
    completed: "Refund Selesai",
    cancelled: "Permohonan Dibatalkan",
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/refund"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          {"\u2190"} Senarai Refund
        </Link>

        <h1 className="mt-5 text-3xl font-bold">Butiran Refund</h1>

        <section className="mt-6 rounded-2xl border bg-white p-6">
          <p className="font-semibold text-indigo-700">
            {labels[refund.status] ?? refund.status}
          </p>
          <p className="mt-3 text-3xl font-bold">{rm(refund.amount)}</p>

          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-slate-500">ID refund</dt>
              <dd className="mt-1 break-all font-mono">{refund.id}</dd>
            </div>
            <div>
              <dt className="text-slate-500">ID pesanan</dt>
              <dd className="mt-1 break-all font-mono">
                {refund.order_id}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">ID pembayaran asal</dt>
              <dd className="mt-1 break-all font-mono">
                {refund.payment_id}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Permohonan pada</dt>
              <dd className="mt-1">{formatDate(refund.created_at)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Sebab permohonan</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words">
                {refund.reason}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-bold">Keputusan Kos Refund</h2>

          {cost ? (
            <>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>Caj gateway asal</dt>
                  <dd>{rm(cost.original_gateway_fee)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Caj dipulangkan oleh gateway</dt>
                  <dd>{rm(cost.gateway_fee_returned)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Baki caj gateway</dt>
                  <dd>{rm(cost.remaining_gateway_fee)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Penanggung baki caj</dt>
                  <dd>
                    {cost.cost_bearer === "seller"
                      ? "Penjual"
                      : cost.cost_bearer === "platform"
                      ? "Platform"
                      : cost.cost_bearer}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 font-bold">
                  <dt>Kos dikenakan kepada penjual</dt>
                  <dd>{rm(cost.seller_charge)}</dd>
                </div>
              </dl>

              <p className="mt-5 whitespace-pre-wrap break-words text-sm">
                Sebab keputusan: {cost.responsibility_reason}
              </p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm">
                Bukti: {cost.evidence_reference}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Direkodkan pada {formatDate(cost.recorded_at)}
              </p>
              <p className="mt-4 text-sm text-slate-600">
                Keputusan kos sahaja belum bermaksud wang telah
                dipulangkan. Potongan penjual diwujudkan apabila
                refund selesai direkodkan.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Keputusan tanggungan kos belum direkodkan.
            </p>
          )}
        </section>

        {refund.status === "requested" && (
          <>
            <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Permohonan masih terbuka. Wang belum direkodkan sebagai
              dipulangkan dan pendapatan berkaitan ditahan daripada payout.
            </p>
                        {!cost && (
              originalGatewayFee !== null ? (
                <RefundCostForm
                  key={`cost-${refund.id}`}
                  refundId={refund.id}
                  originalFee={originalGatewayFee}
                />
              ) : (
                <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                  Caj gateway asal belum disahkan. Sahkan caj melalui
                  Laporan Jualan sebelum merekodkan keputusan kos refund.
                </p>
              )
            )}
                        {cost && (
              <CompleteRefundForm
                key={`complete-${refund.id}`}
                refundId={refund.id}
                amount={refund.amount}
                requestedAt={refund.created_at}
              />
            )}
            <CancelRefundForm
              key={refund.id}
              refundId={refund.id}
            />
          </>
        )}

        {refund.status === "completed" && (
          <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6 text-green-900">
            <h2 className="text-xl font-bold">Rekod Penyelesaian</h2>
            <p className="mt-3 text-sm">
              Masa pemulangan wang: {formatDate(refund.refunded_at)}
            </p>
            <p className="mt-3 break-words text-sm">
              Rujukan: {refund.refund_reference}
            </p>
            <p className="mt-3 text-sm">
              Akses melalui pesanan ini telah ditamatkan.
              Pembayaran asal dikekalkan untuk audit.
            </p>
          </section>
        )}

        {refund.status === "cancelled" && (
          <section className="mt-6 rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-bold">Rekod Pembatalan</h2>
            <p className="mt-3 text-sm">
              Dibatalkan pada: {formatDate(refund.closed_at)}
            </p>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm">
              Sebab: {refund.closure_reason}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Penahanan pendapatan oleh permohonan ini telah
              dilepaskan. Pembatalan ini tidak merekodkan
              pemulangan wang.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
