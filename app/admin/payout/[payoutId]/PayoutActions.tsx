"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PayoutActions({
  payoutId,
}: {
  payoutId: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const submitting = useRef(false);

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function cancelPayout() {
    if (submitting.current || finished) return;

    const cleanReason = reason.trim();

    setError("");
    setMessage("");

    if (!cleanReason || cleanReason.length > 500) {
      setError("Masukkan sebab pembatalan antara 1 hingga 500 aksara.");
      return;
    }

    const confirmed = window.confirm(
      [
        "Batalkan payout ini?",
        "",
        `ID: ${payoutId}`,
        `Sebab: ${cleanReason}`,
        "",
        "Hanya teruskan jika transfer bank belum dibuat.",
        "Item akan dilepaskan untuk penyediaan payout semula.",
        "Tindakan ini tidak memulangkan wang daripada bank.",
      ].join("\n")
    );

    if (!confirmed) return;

    submitting.current = true;
    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "cancel_seller_payout",
        {
          p_payout_id: payoutId,
          p_reason: cleanReason,
        }
      );

      if (rpcError) {
        setFinished(true);
        setError(
          `${rpcError.message} Muat semula halaman untuk menyemak status sebelum mencuba lagi.`
        );
        return;
      }

      if (data !== true) {
        setFinished(true);
        setError(
          "Keputusan pembatalan belum dapat dipastikan. Muat semula halaman untuk menyemak status."
        );
        return;
      }

      setFinished(true);
      setMessage("Payout berjaya dibatalkan. Item pendapatan telah dilepaskan.");
      router.refresh();
    } catch {
      setFinished(true);
      setError(
        "Sambungan terganggu. Muat semula halaman untuk menyemak status pembatalan sebelum mencuba lagi."
      );
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-red-200 bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">
        Batalkan Payout
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Gunakan hanya apabila transfer bank belum dibuat.
        Pembatalan melepaskan item supaya boleh dimasukkan
        ke dalam payout baharu.
      </p>

      <label
        htmlFor="payout-cancellation-reason"
        className="mt-5 block text-sm font-semibold text-gray-700"
      >
        Sebab pembatalan
      </label>

      <textarea
        id="payout-cancellation-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={500}
        rows={3}
        disabled={loading || finished}
        className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 disabled:bg-gray-100"
        placeholder="Contoh: Butiran bank perlu dikemas kini."
      />

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800"
        >
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={cancelPayout}
        disabled={loading || finished || !reason.trim()}
        className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Membatalkan..." : "Batalkan Payout"}
      </button>
    </section>
  );
}
