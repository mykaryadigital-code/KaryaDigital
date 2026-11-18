"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function rm(sen: number) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(sen / 100);
}

function parseSen(value: string): number | null {
  const clean = value.trim();

  if (!/^\d{1,12}(\.\d{1,2})?$/.test(clean)) return null;

  const [whole, fraction = ""] = clean.split(".");
  const sen = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  return Number.isSafeInteger(sen) ? sen : null;
}

export default function RecordRefundCostForm({
  refundId,
  originalFee,
}: {
  refundId: string;
  originalFee: number | string;
}) {
  const router = useRouter();
  const sending = useRef(false);

  const [returnedFee, setReturnedFee] = useState("");
  const [bearer, setBearer] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState("");

  const originalSen = parseSen(String(originalFee));
  const returnedSen = parseSen(returnedFee);

  const validAmounts =
    originalSen !== null &&
    returnedSen !== null &&
    returnedSen <= originalSen;

  const remainingSen = validAmounts
    ? originalSen - returnedSen
    : null;

  const disabled = busy || locked || originalSen === null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || locked) return;

    setError("");

    const cleanReason = reason.trim();
    const cleanEvidence = evidence.trim();

    if (!validAmounts || remainingSen === null) {
      setError(
        "Masukkan caj dipulangkan antara sifar dan caj asal, " +
          "dengan maksimum dua tempat perpuluhan."
      );
      return;
    }

    if (bearer !== "seller" && bearer !== "platform") {
      setError("Pilih penanggung baki caj.");
      return;
    }

    if (
      Array.from(cleanReason).length < 1 ||
      Array.from(cleanReason).length > 1000 ||
      Array.from(cleanEvidence).length < 1 ||
      Array.from(cleanEvidence).length > 1000
    ) {
      setError(
        "Sebab keputusan dan rujukan bukti diperlukan, " +
          "maksimum 1000 aksara setiap medan."
      );
      return;
    }

    const confirmed = window.confirm(
      `Simpan keputusan kos untuk refund:\n${refundId}\n\n` +
        `Caj asal: ${rm(originalSen!)}\n` +
        `Caj dipulangkan gateway: ${rm(returnedSen!)}\n` +
        `Baki caj: ${rm(remainingSen)}\n` +
        `Penanggung: ${bearer === "seller" ? "Penjual" : "Platform"}\n\n` +
        "Keputusan ini tidak boleh diganti melalui borang semasa. " +
        "Tindakan ini belum menyelesaikan refund atau memindahkan wang."
    );

    if (!confirmed) return;

    sending.current = true;
    setBusy(true);

    try {
      const supabase = createClient();

      const { data, error: rpcError } = await supabase.rpc(
        "record_order_refund_cost",
        {
          p_refund_id: refundId,
          p_gateway_fee_returned: returnedSen! / 100,
          p_cost_bearer: bearer,
          p_responsibility_reason: cleanReason,
          p_evidence_reference: cleanEvidence,
        }
      );

      if (rpcError) {
        if (!rpcError.code || !/^[0-9A-Z]{5}$/.test(rpcError.code)) {
          setLocked(true);
          setError(
            "Keputusan permintaan belum dapat dipastikan. " +
              "Muat semula halaman dan semak keputusan kos " +
              "sebelum mencuba lagi."
          );
        } else {
          setError(rpcError.message);
        }
        return;
      }

      if (
        typeof data !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data)
      ) {
        setLocked(true);
        setError(
          "Jawapan tidak lengkap. Muat semula halaman " +
            "untuk menyemak keputusan kos."
        );
        return;
      }

      setSavedId(data);
      setLocked(true);
      router.refresh();
    } catch {
      setLocked(true);
      setError(
        "Sambungan terputus. Muat semula halaman dan semak " +
          "keputusan kos sebelum mencuba lagi."
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border bg-white p-6">
      <h2 className="text-xl font-bold">
        Rekod Keputusan Kos Refund
      </h2>

      <p className="mt-3 text-sm text-slate-600">
        Caj gateway asal disahkan:{" "}
        <strong>
          {originalSen === null ? "Tidak sah" : rm(originalSen)}
        </strong>
      </p>

      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Isi jumlah caj yang benar-benar dipulangkan oleh gateway
        berdasarkan bukti. Nilai ini ialah caj gateway, bukan jumlah
        refund kepada pembeli. Pilih penanggung baki caj mengikut
        hasil semakan kes.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="returned-fee" className="block text-sm font-semibold">
            Caj dipulangkan oleh gateway (RM)
          </label>
          <input
            id="returned-fee"
            type="text"
            inputMode="decimal"
            placeholder="Contoh: 0.00"
            value={returnedFee}
            onChange={(event) => setReturnedFee(event.target.value)}
            required
            disabled={disabled}
            className="mt-2 w-full rounded-xl border p-3 disabled:bg-slate-100"
          />
          <p className="mt-2 text-xs text-slate-500">
            Gunakan titik perpuluhan. Isi 0.00 hanya jika tiada
            caj dipulangkan berdasarkan bukti yang disemak.
          </p>
        </div>

        <div>
          <label htmlFor="cost-bearer" className="block text-sm font-semibold">
            Penanggung baki caj
          </label>
          <select
            id="cost-bearer"
            value={bearer}
            onChange={(event) => setBearer(event.target.value)}
            required
            disabled={disabled}
            className="mt-2 w-full rounded-xl border p-3 disabled:bg-slate-100"
          >
            <option value="">Pilih penanggung</option>
            <option value="seller">Penjual</option>
            <option value="platform">Platform</option>
          </select>
        </div>

        {remainingSen !== null && (
          <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900">
            <p>Baki caj gateway: <strong>{rm(remainingSen)}</strong></p>
            {(bearer === "seller" || bearer === "platform") && (
              <p className="mt-2">
                Kos kepada penjual apabila refund selesai:{" "}
                <strong>{rm(bearer === "seller" ? remainingSen : 0)}</strong>
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="cost-reason" className="block text-sm font-semibold">
            Sebab keputusan tanggungan
          </label>
          <textarea
            id="cost-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={1000}
            required
            disabled={disabled}
            className="mt-2 w-full rounded-xl border p-3 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label htmlFor="cost-evidence" className="block text-sm font-semibold">
            Rujukan bukti caj dan pemulangannya
          </label>
          <textarea
            id="cost-evidence"
            value={evidence}
            onChange={(event) => setEvidence(event.target.value)}
            rows={3}
            maxLength={1000}
            required
            disabled={disabled}
            className="mt-2 w-full rounded-xl border p-3 disabled:bg-slate-100"
          />
        </div>

        <p className="text-sm text-amber-900">
          Keputusan yang disimpan tidak boleh diganti melalui
          borang semasa. Semak bukti sebelum meneruskan.
          Potongan penjual hanya diwujudkan apabila refund selesai.
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-700">{error}</p>
        )}

        {savedId && (
          <p role="status" className="break-words text-sm text-green-800">
            Keputusan kos berjaya direkodkan. ID: {savedId}.
            Refund belum diselesaikan oleh tindakan ini.
          </p>
        )}

        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Sedang menyimpan..." : "Simpan Keputusan Kos"}
        </button>
      </form>
    </section>
  );
}
