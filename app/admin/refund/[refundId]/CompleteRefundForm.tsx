"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function parseSen(value: string): number | null {
  const text = value.trim();

  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(text)) return null;

  const [whole, fraction = ""] = text.split(".");
  const sen = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  return Number.isSafeInteger(sen) && sen > 0 ? sen : null;
}

function rm(sen: number) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(sen / 100);
}

function malaysiaTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}:00+08:00`);
  if (!Number.isFinite(date.getTime())) return null;

  // Tolak tarikh tidak sah yang dinormalkan oleh JavaScript.
  const roundTrip = new Date(date.getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  return roundTrip === value ? date : null;
}

export default function CompleteRefundForm({
  refundId,
  amount,
  requestedAt,
}: {
  refundId: string;
  amount: number | string;
  requestedAt: string;
}) {
  const router = useRouter();
  const sending = useRef(false);

  const [actualAmount, setActualAmount] = useState("");
  const [reference, setReference] = useState("");
  const [refundedAt, setRefundedAt] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const expectedSen = parseSen(String(amount));
  const disabled = busy || locked || expectedSen === null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || locked) return;

    setError("");

    const actualSen = parseSen(actualAmount);
    const cleanReference = reference.trim();
    const transferDate = malaysiaTime(refundedAt);
    const requestTime = new Date(requestedAt).getTime();

    if (expectedSen === null || actualSen !== expectedSen) {
      setError("Jumlah dipulangkan mesti sama dengan jumlah refund penuh.");
      return;
    }

    if (
      Array.from(cleanReference).length < 1 ||
      Array.from(cleanReference).length > 500
    ) {
      setError("Masukkan rujukan bukti antara 1 hingga 500 aksara.");
      return;
    }

    if (
      !transferDate ||
      !Number.isFinite(requestTime) ||
      transferDate.getTime() < requestTime ||
      transferDate.getTime() > Date.now()
    ) {
      setError(
        "Masukkan masa Malaysia yang sah, selepas permohonan dibuka " +
          "dan bukan pada masa hadapan. Jika pemulangan dibuat " +
          "dalam minit permohonan yang sama, semak masa tepat " +
          "sebelum meneruskan."
      );
      return;
    }

    if (!confirmed) {
      setError("Sahkan bukti pemulangan wang telah disemak.");
      return;
    }

    const accepted = window.confirm(
      `Rekod refund selesai?\n\n` +
        `ID refund: ${refundId}\n` +
        `Jumlah: ${rm(expectedSen)}\n` +
        `Masa Malaysia: ${refundedAt.replace("T", " ")}\n` +
        `Rujukan: ${cleanReference}\n\n` +
        "Pesanan akan ditandakan refunded dan akses melalui " +
        "pesanan ini ditamatkan. Kos penjual yang diputuskan " +
        "akan direkodkan. Butiran penyelesaian tidak boleh diganti " +
        "melalui borang semasa. Tindakan ini tidak menghantar wang."
    );

    if (!accepted) return;

    sending.current = true;
    setBusy(true);

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "complete_full_order_refund",
        {
          p_refund_id: refundId,
          p_amount: actualSen / 100,
          p_refund_reference: cleanReference,
          p_refunded_at: transferDate.toISOString(),
        }
      );

      if (rpcError) {
        if (!rpcError.code || !/^[0-9A-Z]{5}$/.test(rpcError.code)) {
          setLocked(true);
          setError(
            "Keputusan belum dapat dipastikan. Muat semula halaman " +
              "dan semak status refund sebelum mencuba lagi. " +
              "Jangan ulang pemindahan wang."
          );
        } else {
          setError(
            `${rpcError.message} Jika wang sudah dipulangkan, ` +
              "jangan pindahkan wang sekali lagi atau batalkan " +
              "permohonan; semak punca kegagalan rekod dahulu."
          );
        }
        return;
      }

      if (data !== true) {
        setLocked(true);
        setError(
          "Jawapan tidak lengkap. Muat semula halaman dan semak status. " +
            "Jangan ulang pemindahan wang."
        );
        return;
      }

      setSaved(true);
      setLocked(true);
      router.refresh();
    } catch {
      setLocked(true);
      setError(
        "Sambungan terputus. Muat semula halaman dan semak status " +
          "refund. Jangan ulang pemindahan wang."
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border bg-white p-6">
      <h2 className="text-xl font-bold">Rekod Refund Selesai</h2>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Isi berdasarkan bukti pemulangan wang yang telah dibuat.
        Borang ini merekodkan penyelesaian sahaja dan tidak
        memindahkan wang melalui bank atau gateway.
      </p>

      <p className="mt-4 font-semibold">
        Jumlah refund penuh:{" "}
        {expectedSen === null ? "Tidak tersedia" : rm(expectedSen)}
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="refund-actual-amount"
            className="block text-sm font-semibold"
          >
            Jumlah sebenar dipulangkan kepada pembeli (RM)
          </label>
          <input
            id="refund-actual-amount"
            type="text"
            inputMode="decimal"
            value={actualAmount}
            onChange={(event) => setActualAmount(event.target.value)}
            maxLength={15}
            required
            disabled={disabled}
            className="mt-2 w-full rounded-xl border p-3"
          />
        </div>

        <div>
          <label
            htmlFor="refund-transfer-time"
            className="block text-sm font-semibold"
          >
            Tarikh dan masa pemulangan — waktu Malaysia
          </label>
          <input
            id="refund-transfer-time"
            type="datetime-local"
            step={60}
            value={refundedAt}
            onChange={(event) => setRefundedAt(event.target.value)}
            required
            disabled={disabled}
            className="mt-2 w-full rounded-xl border p-3"
          />
          <p className="mt-2 text-xs text-slate-500">
            Gunakan masa pada bukti pemulangan, bukan masa mengisi
            borang. Masa ditafsirkan sebagai Asia/Kuala_Lumpur.
          </p>
        </div>

        <div>
          <label
            htmlFor="refund-transfer-reference"
            className="block text-sm font-semibold"
          >
            Rujukan bukti pemulangan wang
          </label>
          <textarea
            id="refund-transfer-reference"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            rows={3}
            maxLength={500}
            required
            disabled={disabled}
            className="mt-2 w-full rounded-xl border p-3"
          />
        </div>

        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            required
            disabled={disabled}
            className="mt-1"
          />
          <span>
            Saya telah menyemak jumlah, penerima dan bukti pemulangan.
            Wang telah dipulangkan, atau rekod ini ialah simulasi
            dalam persekitaran Testing dengan rujukan SIMULASI.
          </span>
        </label>

        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Selepas disimpan, pesanan menjadi refunded. Pembayaran
          asal dikekalkan dan akses melalui pesanan ini ditamatkan.
          Jangan gunakan pembatalan permohonan jika wang sudah
          dipulangkan.
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        {saved && (
          <p role="status" className="text-sm text-green-800">
            Penyelesaian refund berjaya direkodkan.
          </p>
        )}

        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Sedang merekodkan..." : "Rekod Refund Selesai"}
        </button>
      </form>
    </section>
  );
}
