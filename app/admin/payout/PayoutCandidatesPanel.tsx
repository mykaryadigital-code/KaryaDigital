"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Amount = number | string;

type Candidate = {
  seller_id: string;
  seller_name: string;
  bank_name: string | null;
  account_holder_name: string | null;
  account_last_four: string | null;
  bank_revision: number | string | null;
  eligible_items: number | string;
  eligible_amount: Amount;
  unconfirmed_items: number | string;
  has_negative_earnings: boolean;
  existing_payout_id: string | null;
  existing_payout_status: string | null;
  existing_payout_amount: Amount | null;
    earnings_before_adjustments: Amount;
  refund_deductions: Amount;
  refund_held_amount: Amount;
};

const PAGE_SIZE = 25;

function malaysiaDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

function rm(value: Amount) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(Number(value));
}

function validMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export default function PayoutCandidatesPanel() {
  const supabase = useMemo(() => createClient(), []);
  const submitting = useRef(false);

  const [month, setMonth] = useState(() =>
    malaysiaDate().slice(0, 7)
  );
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCandidates = useCallback(async () => {
    if (!validMonth(month)) {
      throw new Error("Pilih bulan payout yang sah.");
    }

    const { data, error: queryError } = await supabase.rpc(
        "get_admin_payout_candidates_v2",
      {
        p_payout_month: `${month}-01`,
        p_limit: PAGE_SIZE,
        p_offset: offset,
      }
    );

    if (queryError) {
      throw new Error(
        "Senarai payout gagal dimuatkan. Cuba refresh halaman."
      );
    }

    return (data ?? []) as Candidate[];
  }, [supabase, month, offset]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setRows([]);
      setError("");

      try {
        const result = await loadCandidates();
        if (active) setRows(result);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuatkan senarai."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [loadCandidates]);

  async function prepare(candidate: Candidate) {
    if (
      submitting.current ||
      loading ||
      candidate.bank_revision === null ||
      candidate.existing_payout_id
    ) {
      return;
    }

    if (!validMonth(month)) return;

    if (`${month}-07` > malaysiaDate()) {
      setError("Tarikh payout belum tiba.");
      return;
    }

    if (
      !Number.isFinite(Number(candidate.eligible_amount)) ||
      Number(candidate.eligible_amount) < 20 ||
      candidate.has_negative_earnings
    ) {
      setError("Baki belum layak atau memerlukan semakan.");
      return;
    }

    const confirmed = window.confirm(
      `Sediakan payout untuk ${candidate.seller_name}?\n\nBulan: ${month}\nBaki selepas potongan: ${rm(candidate.eligible_amount)}\nBank semasa: ${candidate.bank_name}\nAkaun berakhir: ${candidate.account_last_four}\n\nJumlah akhir dikira semula oleh sistem. Langkah ini belum membuat transfer bank.`
    );

    if (!confirmed) return;

    submitting.current = true;
    setSavingId(candidate.seller_id);
    setError("");
    setNotice("");

    try {
      const { data, error: prepareError } = await supabase.rpc(
        "prepare_seller_payout",
        {
          p_seller_id: candidate.seller_id,
          p_payout_month: `${month}-01`,
          p_expected_bank_revision: candidate.bank_revision,
        }
      );

      if (prepareError) {
        setError(prepareError.message);
        return;
      }

      if (
        typeof data !== "string" ||
        !/^[0-9a-f-]{36}$/i.test(data)
      ) {
        setRows([]);
        setError(
          "Keputusan belum dapat dipastikan. Refresh halaman sebelum mencuba lagi."
        );
        return;
      }

      setNotice(
        `Rekod payout tersedia. ID: ${data}. Belum ada transfer bank dibuat.`
      );

      try {
        setRows(await loadCandidates());
      } catch {
        setRows([]);
        setError(
          "Payout telah disediakan, tetapi senarai gagal dimuat semula. Refresh halaman untuk melihat rekod terkini."
        );
      }
    } catch {
      setRows([]);
      setError(
        "Sambungan terganggu. Refresh halaman untuk menyemak sama ada payout telah disediakan."
      );
    } finally {
      submitting.current = false;
      setSavingId(null);
    }
  }

  const busy = loading || savingId !== null;
  const due = validMonth(month) && `${month}-07` <= malaysiaDate();

  return (
    <section className="mt-8">
      <div className="rounded-2xl border bg-white p-5">
        <label
          htmlFor="payout-month"
          className="mb-2 block text-sm font-semibold"
        >
          Bulan Payout
        </label>

        <input
          id="payout-month"
          type="month"
          value={month}
          disabled={savingId !== null}
          onChange={(event) => {
            setMonth(event.target.value);
            setOffset(0);
            setNotice("");
          }}
          className="rounded-xl border border-slate-300 px-4 py-3"
        />

        <p className="mt-3 text-sm text-slate-600">
          Hanya pendapatan sebelum awal bulan yang dipilih,
          mengikut waktu Malaysia, dikira. Baki lama yang belum
          dibayar turut disertakan jika layak.
        </p>

        <p className="mt-2 text-sm text-slate-600">
          Pendapatan yang caj gateway belum disahkan tidak
          termasuk dalam baki layak.
        </p>

        {validMonth(month) && !due && (
          <p className="mt-3 text-sm font-semibold text-amber-800">
            Pratonton sahaja. Payout boleh disediakan mulai
            7 haribulan pada bulan yang dipilih.
          </p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mt-5 break-words rounded-xl bg-green-50 p-4 text-sm text-green-800"
        >
          {notice}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">
          Sedang memuatkan penjual...
        </p>
      ) : rows.length === 0 && !error ? (
        <p className="mt-6 rounded-xl border bg-white p-5 text-sm text-slate-600">
          Tiada penjual dalam halaman ini.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {rows.map((candidate) => {
            const hasBank =
              Boolean(candidate.bank_name) &&
              Boolean(candidate.account_holder_name) &&
              Boolean(candidate.account_last_four) &&
              candidate.bank_revision !== null;

            const amount = Number(candidate.eligible_amount);
            const hasExisting = Boolean(
              candidate.existing_payout_id
            );

            const canPrepare =
              due &&
              hasBank &&
              !hasExisting &&
              !candidate.has_negative_earnings &&
              Number.isFinite(amount) &&
              amount >= 20;

            return (
              <article
                key={candidate.seller_id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h2 className="text-lg font-bold text-slate-900">
                  {candidate.seller_name}
                </h2>

                <p className="mt-1 break-all text-xs text-slate-500">
                  ID Penjual: {candidate.seller_id}
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">
                       Baki Selepas Potongan Refund
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {rm(candidate.eligible_amount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Item Layak
                    </p>
                    <p className="mt-1 font-bold">
                      {candidate.eligible_items}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Item Menunggu Pengesahan Caj
                    </p>
                    <p className="mt-1 font-bold">
                      {candidate.unconfirmed_items}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">
                      Pendapatan Layak Sebelum Potongan
                    </p>
                    <p className="mt-1 font-bold">
                      {rm(candidate.earnings_before_adjustments)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Potongan Kos Refund
                    </p>
                    <p className="mt-1 font-bold">
                      {rm(candidate.refund_deductions)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">
                      Pendapatan Ditahan untuk Refund
                    </p>
                    <p className="mt-1 font-bold">
                      {rm(candidate.refund_held_amount)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  Baki selepas potongan sudah mengambil kira kos
                  refund. Pendapatan ditahan tidak termasuk dalam
                  pendapatan layak. Jangan tolak jumlah ini sekali
                  lagi. Jualan dan potongan dikira sebelum awal
                  bulan payout yang dipilih.
                </p>
                <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
                  {hasBank ? (
                    <>
                      <p>Bank semasa: {candidate.bank_name}</p>
                      <p className="mt-1">
                        Pemegang: {candidate.account_holder_name}
                      </p>
                      <p className="mt-1">
                        Akaun berakhir: ****
                        {candidate.account_last_four}
                      </p>
                    </>
                  ) : (
                    <p className="text-amber-800">
                      Penjual belum melengkapkan butiran bank.
                    </p>
                  )}
                </div>

                {candidate.has_negative_earnings && (
                  <p className="mt-4 text-sm text-red-700">
                    Ada pendapatan negatif. Semakan diperlukan
                    sebelum payout boleh disediakan.
                  </p>
                )}

                {hasExisting ? (
                  <div className="mt-5 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900">
                    <p className="font-semibold">
                      {candidate.existing_payout_status === "paid"
                        ? "Payout Sudah Dibayar"
                        : "Payout Sudah Disediakan"}
                    </p>

                    <p className="mt-1">
                      Jumlah:{" "}
                      {candidate.existing_payout_amount === null
                        ? "Tidak tersedia"
                        : rm(candidate.existing_payout_amount)}
                    </p>

                    <p className="mt-1 break-all">
                      ID: {candidate.existing_payout_id}
                    </p>
                                        {candidate.existing_payout_id && (
                      <Link
                        href={`/admin/payout/${candidate.existing_payout_id}`}
                        className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        Lihat Butiran
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    {amount < 20 && (
                      <p className="mt-4 text-sm text-slate-600">
                        Minimum payout RM20. Baki yang belum
                        dibayar kekal untuk bulan seterusnya.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => prepare(candidate)}
                      disabled={busy || !canPrepare}
                      className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {savingId === candidate.seller_id
                        ? "Sedang Menyediakan..."
                        : "Sediakan Payout"}
                    </button>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={busy || offset === 0}
          onClick={() => {
            setNotice("");
            setOffset((current) =>
              Math.max(0, current - PAGE_SIZE)
            );
          }}
          className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          Sebelumnya
        </button>

        <span className="text-sm text-slate-500">
          Halaman {Math.floor(offset / PAGE_SIZE) + 1}
        </span>

        <button
          type="button"
          disabled={
            busy ||
            Boolean(error) ||
            rows.length < PAGE_SIZE
          }
          onClick={() => {
            setNotice("");
            setOffset((current) => current + PAGE_SIZE);
          }}
          className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          Seterusnya
        </button>
      </div>
    </section>
  );
}
