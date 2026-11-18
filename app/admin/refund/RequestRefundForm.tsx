"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function RequestRefundForm() {
  const router = useRouter();
  const sending = useRef(false);

  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refundId, setRefundId] = useState("");
  const [uncertain, setUncertain] = useState(false);

  const locked = busy || Boolean(refundId) || uncertain;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sending.current || refundId || uncertain) return;

    const cleanOrderId = orderId.trim();
    const cleanReason = reason.trim();

    setError("");

    if (!uuidPattern.test(cleanOrderId)) {
      setError("Masukkan ID pesanan yang sah.");
      return;
    }

    if (
      Array.from(cleanReason).length < 1 ||
      Array.from(cleanReason).length > 1000
    ) {
      setError("Sebab permohonan mesti antara 1 hingga 1000 aksara.");
      return;
    }

    const confirmed = window.confirm(
      `Buka permohonan refund penuh untuk pesanan:\n${cleanOrderId}\n\n` +
        "Pendapatan berkaitan akan ditahan daripada payout. " +
        "Tindakan ini tidak memindahkan wang kepada pembeli."
    );

    if (!confirmed) return;

    sending.current = true;
    setBusy(true);

    try {
      const supabase = createClient();

      const { data, error: rpcError } = await supabase.rpc(
        "request_full_order_refund",
        {
          p_order_id: cleanOrderId,
          p_reason: cleanReason,
        }
      );

      if (rpcError) {
        // Jangan andaikan permintaan tidak sampai apabila
        // sambungan atau perkhidmatan gagal memberikan jawapan.
        if (!rpcError.code || !/^[0-9A-Z]{5}$/.test(rpcError.code)) {
          setUncertain(true);
          setError(
            "Keputusan permintaan belum dapat dipastikan. " +
              "Muat semula halaman dan semak senarai refund " +
              "menggunakan ID pesanan sebelum mencuba lagi."
          );
          return;
        }

        setError(rpcError.message);
        return;
      }

      if (typeof data !== "string" || !uuidPattern.test(data)) {
        setUncertain(true);
        setError(
          "Jawapan sistem tidak lengkap. Muat semula halaman " +
            "dan semak rekod berdasarkan ID pesanan sebelum mencuba lagi."
        );
        return;
      }

      setRefundId(data);
      router.refresh();
    } catch {
      setUncertain(true);
      setError(
        "Sambungan terputus dan keputusan belum dapat dipastikan. " +
          "Muat semula halaman dan semak rekod berdasarkan ID pesanan."
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border bg-white p-5 sm:p-6">
      <h2 className="text-xl font-bold text-slate-900">
        Buka Permohonan Refund
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Gunakan ID pesanan yang telah disemak. Refund ini melibatkan
        keseluruhan pesanan. Jika pendapatan sudah ditempah dalam
        payout, sistem akan menyekat permohonan untuk semakan.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="refund-order-id"
            className="block text-sm font-semibold text-slate-700"
          >
            ID pesanan
          </label>
          <input
            id="refund-order-id"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            disabled={locked}
            required
            maxLength={36}
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-mono text-sm disabled:bg-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor="refund-reason"
            className="block text-sm font-semibold text-slate-700"
          >
            Sebab permohonan
          </label>
          <textarea
            id="refund-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={locked}
            required
            maxLength={1000}
            rows={4}
            className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm disabled:bg-slate-100"
          />
        </div>

        <p className="text-sm text-amber-900">
          Permohonan terbuka menahan pendapatan berkaitan daripada
          payout. Akses pembeli tamat apabila refund selesai
          direkodkan, bukan semasa permohonan dibuka.
        </p>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {refundId && (
          <div
            role="status"
            className="rounded-xl bg-green-50 p-4 text-sm text-green-900"
          >
            <p className="font-semibold">
              Permohonan refund berjaya dibuka.
            </p>
            <p className="mt-2 break-all">ID refund: {refundId}</p>
            <p className="mt-2">
              Wang belum dipulangkan oleh tindakan ini.
              Rekod disenaraikan mengikut tarikh permohonan.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={locked}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Sedang membuka permohonan..." : "Buka Permohonan"}
        </button>
      </form>
    </section>
  );
}
