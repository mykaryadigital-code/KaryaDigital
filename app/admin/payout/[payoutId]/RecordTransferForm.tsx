"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  payoutId: string;
  amount: number | string;
  bankRevision: number | string;
};

export default function RecordTransferForm({
  payoutId,
  amount,
  bankRevision,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const submitting = useRef(false);

  const [enteredAmount, setEnteredAmount] = useState("");
  const [reference, setReference] = useState("");
  const [transferredAt, setTransferredAt] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const formattedAmount = new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(Number(amount));

  async function recordTransfer() {
    if (submitting.current || locked) return;

    setError("");
    setMessage("");

    const cleanAmount = enteredAmount.trim();
    const cleanReference = reference.trim();

    if (
      !/^\d+(\.\d{1,2})?$/.test(cleanAmount) ||
      !Number.isFinite(Number(cleanAmount)) ||
      Number(cleanAmount) !== Number(amount)
    ) {
      setError(`Masukkan jumlah yang sepadan: ${formattedAmount}.`);
      return;
    }

    if (!cleanReference || cleanReference.length > 500) {
      setError("Masukkan rujukan transfer antara 1 hingga 500 aksara.");
      return;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(transferredAt)
    ) {
      setError("Pilih tarikh dan masa transfer mengikut waktu Malaysia.");
      return;
    }

    const transferDate = new Date(`${transferredAt}:00+08:00`);

    if (
      !Number.isFinite(transferDate.getTime()) ||
      transferDate.getTime() > Date.now()
    ) {
      setError("Tarikh transfer tidak sah atau berada pada masa hadapan.");
      return;
    }

    if (!acknowledged) {
      setError("Sahkan bahawa transfer telah dibuat ke akaun dalam salinan payout.");
      return;
    }

    const confirmed = window.confirm(
      [
        "Rekodkan payout sebagai dibayar?",
        "",
        `Jumlah: ${formattedAmount}`,
        `Rujukan: ${cleanReference}`,
        `Masa Malaysia: ${transferredAt.replace("T", " ")}`,
        "",
        "Pastikan transfer telah berjaya ke akaun dalam salinan payout.",
        "Butiran pembayaran tidak boleh diganti selepas direkodkan.",
      ].join("\n")
    );

    if (!confirmed) return;

    submitting.current = true;
    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "record_seller_payout_paid",
        {
          p_payout_id: payoutId,
          p_amount: cleanAmount,
          p_transfer_reference: cleanReference,
          p_transferred_at: transferDate.toISOString(),
          p_expected_bank_revision: bankRevision,
        }
      );

      // Muat semula sebelum percubaan seterusnya supaya
      // status semasa disemak selepas permintaan dihantar.
      setLocked(true);

      if (rpcError) {
        setError(
          `${rpcError.message} Muat semula halaman untuk menyemak status sebelum mencuba lagi.`
        );
        return;
      }

      if (data !== true) {
        setError(
          "Keputusan belum dapat dipastikan. Muat semula halaman untuk menyemak status payout."
        );
        return;
      }

      setMessage("Transfer berjaya direkodkan. Payout berstatus dibayar.");
      router.refresh();
    } catch {
      setLocked(true);
      setError(
        "Sambungan terganggu. Muat semula halaman untuk menyemak status sebelum menghantar permintaan semula."
      );
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  const disabled = loading || locked;
  const inputStyle =
    "mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 disabled:bg-gray-100";

  return (
    <section className="mt-6 rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">
        Rekod Transfer Selesai
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Jumlah payout: {formattedAmount}. Isi selepas transfer bank
        berjaya. Borang ini tidak membuat transfer wang.
      </p>

      <label className="mt-5 block text-sm font-semibold">
        Jumlah yang telah ditransfer (RM)
        <input
          type="text"
          inputMode="decimal"
          value={enteredAmount}
          onChange={(event) => setEnteredAmount(event.target.value)}
          disabled={disabled}
          placeholder="Contoh: 20.00"
          className={inputStyle}
        />
      </label>

      <label className="mt-4 block text-sm font-semibold">
        Rujukan transfer
        <input
          type="text"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          maxLength={500}
          disabled={disabled}
          className={inputStyle}
        />
      </label>

      <label className="mt-4 block text-sm font-semibold">
        Tarikh dan masa transfer — waktu Malaysia
        <input
          type="datetime-local"
          step="60"
          value={transferredAt}
          onChange={(event) => setTransferredAt(event.target.value)}
          disabled={disabled}
          className={inputStyle}
        />
      </label>

      <label className="mt-5 flex items-start gap-3 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
          disabled={disabled}
          className="mt-1"
        />
        <span>
          Saya telah menyemak bukti transfer berjaya, jumlah dan
          akaun penerima sepadan dengan salinan bank payout ini.
        </span>
      </label>

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
        onClick={recordTransfer}
        disabled={disabled || !acknowledged}
        className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Merekodkan..." : "Rekod Sebagai Dibayar"}
      </button>
    </section>
  );
}
