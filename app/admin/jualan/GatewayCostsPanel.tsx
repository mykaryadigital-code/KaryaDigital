"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";

type Amount = number | string;

type GatewayPayment = {
  payment_id: string;
  order_id: string;
  bill_code: string | null;
  payment_amount: Amount;
  paid_at: string | null;
  item_count: number | string;
  gross_total: Amount;
  commission_total: Amount;
  allocated_fee_total: Amount | null;
  net_total: Amount | null;
  confirmed_fee: Amount | null;
  evidence_reference: string | null;
  confirmed_at: string | null;
};

const PAGE_SIZE = 25;

function rm(value: Amount) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) return "Tarikh belum tersedia";

  return new Date(value).toLocaleString("ms-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type FeeFormProps = {
  payment: GatewayPayment;
  disabled: boolean;
  onConfirm: (
    paymentId: string,
    fee: string,
    reference: string
  ) => Promise<boolean>;
};

function FeeForm({
  payment,
  disabled,
  onConfirm,
}: FeeFormProps) {
  const [fee, setFee] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    setError("");

    const cleanFee = fee.trim();
    const cleanReference = reference.trim();
    const feeNumber = Number(cleanFee);
    const available =
      Number(payment.gross_total) -
      Number(payment.commission_total);

    if (
      !/^\d+(\.\d{1,2})?$/.test(cleanFee) ||
      !Number.isFinite(feeNumber) ||
      feeNumber < 0 ||
      feeNumber > available
    ) {
      setError(
        "Masukkan caj sah yang tidak melebihi jumlah selepas komisen."
      );
      return;
    }

    if (
      cleanReference.length < 1 ||
      cleanReference.length > 500
    ) {
      setError("Masukkan rujukan bukti caj, maksimum 500 aksara.");
      return;
    }

    const confirmed = window.confirm(
      `Sahkan caj gateway ${rm(feeNumber)} untuk bil ${
        payment.bill_code ?? payment.payment_id
      }?\n\nRujukan: ${cleanReference}\n\nCaj ini akan ditolak daripada bahagian penjual dan tidak boleh diedit melalui borang ini selepas disahkan.`
    );

    if (!confirmed) return;

    const success = await onConfirm(
      payment.payment_id,
      cleanFee,
      cleanReference
    );

    if (success) {
      setFee("");
      setReference("");
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4 border-t pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`fee-${payment.payment_id}`}
            className="mb-2 block text-sm font-semibold"
          >
            Caj sebenar ditanggung penjual (RM)
          </label>

          <input
            id={`fee-${payment.payment_id}`}
                        type="text"
            inputMode="decimal"
            autoComplete="off"
            value={fee}
            onChange={(event) => setFee(event.target.value)}
            disabled={disabled}
            required
            placeholder="Masukkan jumlah daripada penyata"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm disabled:bg-slate-100"
          />
        </div>

        <div>
          <label
            htmlFor={`reference-${payment.payment_id}`}
            className="mb-2 block text-sm font-semibold"
          >
            Rujukan transaksi atau penyata
          </label>

          <input
            id={`reference-${payment.payment_id}`}
            type="text"
            value={reference}
            onChange={(event) =>
              setReference(event.target.value)
            }
            maxLength={500}
            disabled={disabled}
            required
            placeholder="Rujukan bukti caj"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm disabled:bg-slate-100"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? "Sila tunggu..." : "Sahkan dan Agihkan Caj"}
      </button>
    </form>
  );
}

export default function GatewayCostsPanel() {
  const supabase = useMemo(() => createClient(), []);
  const [payments, setPayments] = useState<GatewayPayment[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPayments = useCallback(async () => {
    const { data, error: queryError } = await supabase.rpc(
      "get_admin_gateway_costs",
      {
        p_limit: PAGE_SIZE,
        p_offset: offset,
      }
    );

    if (queryError) {
      throw new Error(
        "Senarai pengesahan caj gagal dimuatkan. Cuba muat semula."
      );
    }

    return (data ?? []) as GatewayPayment[];
  }, [supabase, offset]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setPayments([]);

      try {
        const rows = await loadPayments();
        if (active) setPayments(rows);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuatkan senarai caj."
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
  }, [loadPayments]);

  async function confirmFee(
    paymentId: string,
    fee: string,
    reference: string
  ): Promise<boolean> {
    if (savingId || loading) return false;

    setSavingId(paymentId);
    setError("");
    setNotice("");

    try {
      const { data, error: confirmError } = await supabase.rpc(
        "confirm_gateway_cost",
        {
          p_payment_id: paymentId,
          p_fee_amount: fee,
          p_evidence_reference: reference,
        }
      );

      if (confirmError) {
        setError(confirmError.message);
        return false;
      }

      if (data !== true) {
        setError("Pengesahan belum dapat dipastikan. Muat semula senarai.");
        return false;
      }

      setNotice("Caj berjaya disahkan dan diagihkan kepada item jualan.");

      try {
        setPayments(await loadPayments());
      } catch {
        setPayments([]);
        setError(
          "Caj telah disahkan, tetapi senarai gagal dimuat semula. Refresh halaman sebelum meneruskan."
        );
      }

      return true;
    } catch {
      setPayments([]);
      setError(
        "Sambungan terganggu. Refresh halaman untuk menyemak status sebelum mencuba semula."
      );
      return false;
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section
      className="mt-12"
      aria-labelledby="gateway-costs-title"
    >
      <h3
        id="gateway-costs-title"
        className="text-xl font-bold text-gray-900"
      >
        Pengesahan Caj Gateway
      </h3>

      <p className="mt-2 text-sm text-slate-600">
        Senarai ini hanya melibatkan pembayaran berbayar yang
        mempunyai rekod pendapatan penjual.
      </p>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        Semak caj sebenar pada penyata gateway. Masukkan hanya caj
        yang ditanggung penjual. Jangan potong sekali lagi caj yang
        telah dibayar pembeli dan tidak mengurangkan bahagian
        penjual. Jangan gunakan caj anggaran.
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800"
        >
          {notice}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">
          Sedang memuatkan pembayaran...
        </p>
      ) : payments.length === 0 && !error ? (
        <div className="mt-5 rounded-2xl border bg-white p-6 text-sm text-slate-600">
          Tiada pembayaran dalam halaman ini.
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {payments.map((payment) => {
            const isConfirmed = payment.confirmed_fee !== null;
            const totalsMatch =
              Number.isFinite(Number(payment.payment_amount)) &&
              Number.isFinite(Number(payment.gross_total)) &&
              Math.abs(
                Number(payment.payment_amount) -
                  Number(payment.gross_total)
              ) < 0.000001;

            return (
              <article
                key={payment.payment_id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">
                      Bil: {payment.bill_code ?? "Tidak tersedia"}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      ID Pesanan: {payment.order_id}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Disahkan dibayar: {formatDate(payment.paid_at)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isConfirmed
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {isConfirmed
                      ? "Caj Disahkan"
                      : "Caj Belum Disahkan"}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                  <div>
                    <dt className="text-slate-500">Jualan Kasar</dt>
                    <dd className="mt-1 font-bold">
                      {rm(payment.gross_total)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">
                      Komisen Platform
                    </dt>
                    <dd className="mt-1 font-bold">
                      {rm(payment.commission_total)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">
                      Caj Diagihkan
                    </dt>
                    <dd className="mt-1 font-bold">
                      {payment.allocated_fee_total === null
                        ? "Belum disahkan"
                        : rm(payment.allocated_fee_total)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">
                      Bersih Penjual
                    </dt>
                    <dd className="mt-1 font-bold">
                      {payment.net_total === null
                        ? "Belum dikira"
                        : rm(payment.net_total)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 text-xs text-slate-500">
                  {payment.item_count} item jualan. Bersih penjual
                  ialah jumlah sebelum mengambil kira payout atau
                  pelarasan lain.
                </p>

                {!totalsMatch && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
                  >
                    Jumlah pembayaran dan rekod pendapatan tidak
                    sepadan. Semak rekod sebelum mengesahkan caj.
                  </p>
                )}

                {isConfirmed ? (
                  <div className="mt-5 border-t pt-4 text-sm text-slate-600">
                    <p>
                      Caj disahkan: {rm(payment.confirmed_fee!)}
                    </p>
                    <p className="mt-1 break-words">
                      Rujukan: {payment.evidence_reference}
                    </p>
                    <p className="mt-1">
                      Tarikh: {formatDate(payment.confirmed_at)}
                    </p>
                  </div>
                ) : (
                  <FeeForm
                    payment={payment}
                    disabled={
                      loading ||
                      savingId !== null ||
                      !totalsMatch
                    }
                    onConfirm={confirmFee}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={offset === 0 || loading || savingId !== null}
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
            loading ||
            savingId !== null ||
            Boolean(error) ||
            payments.length < PAGE_SIZE
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