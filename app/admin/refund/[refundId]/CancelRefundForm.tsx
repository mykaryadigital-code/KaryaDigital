"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CancelRefundForm({
  refundId,
}: {
  refundId: string;
}) {
  const router = useRouter();
  const sending = useRef(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || locked) return;

    const cleanReason = reason.trim();
    setError("");

    if (
      Array.from(cleanReason).length < 1 ||
      Array.from(cleanReason).length > 500
    ) {
      setError("Masukkan sebab pembatalan antara 1 hingga 500 aksara.");
      return;
    }

    if (
      !window.confirm(
        "Batalkan permohonan refund ini?\n\n" +
          "Penahanan pendapatan oleh permohonan ini akan dilepaskan. " +
          "Tindakan ini tidak memulangkan wang. " +
          "Permohonan yang dibatalkan tidak boleh dibuka semula " +
          "melalui borang semasa."
      )
    ) {
      return;
    }

    sending.current = true;
    setBusy(true);

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "cancel_order_refund",
        {
          p_refund_id: refundId,
          p_reason: cleanReason,
        }
      );

      if (rpcError) {
        if (!rpcError.code || !/^[0-9A-Z]{5}$/.test(rpcError.code)) {
          setLocked(true);
          setError(
            "Keputusan belum dapat dipastikan. Muat semula halaman " +
              "dan semak status sebelum mencuba lagi."
          );
        } else {
          setError(rpcError.message);
        }
        return;
      }

      if (data !== true) {
        setLocked(true);
        setError(
          "Jawapan tidak lengkap. Muat semula halaman untuk menyemak status."
        );
        return;
      }

      setSuccess(true);
      setLocked(true);
      router.refresh();
    } catch {
      setLocked(true);
      setError(
        "Sambungan terputus. Muat semula halaman dan semak status " +
          "sebelum mencuba lagi."
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border bg-white p-6">
      <h2 className="text-xl font-bold">Batalkan Permohonan</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Gunakan apabila refund tidak diteruskan. Jika wang sudah
        dipulangkan, jangan batalkan permohonan; penyelesaian refund
        perlu direkodkan. Permohonan yang dibatalkan tidak boleh
        dibuka semula melalui borang semasa.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="cancel-refund-reason"
            className="block text-sm font-semibold"
          >
            Sebab pembatalan
          </label>
          <textarea
            id="cancel-refund-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={500}
            required
            disabled={busy || locked}
            className="mt-2 w-full rounded-xl border p-3 disabled:bg-slate-100"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="text-sm text-green-800">
            Permohonan refund berjaya dibatalkan.
          </p>
        )}

        <button
          type="submit"
          disabled={busy || locked}
          className="rounded-xl border border-red-300 px-5 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
        >
          {busy ? "Sedang membatalkan..." : "Batalkan Permohonan"}
        </button>
      </form>
    </section>
  );
}
