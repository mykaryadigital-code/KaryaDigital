"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Amount = number | string;

type Summary = {
  recorded_items: number | string;
  gross_amount: Amount;
  platform_commission: Amount;
  confirmed_gateway_fee: Amount;
  unconfirmed_items: number | string;
  confirmed_net_amount: Amount;
  unreserved_net_amount: Amount;
  prepared_payout_amount: Amount;
  paid_payout_amount: Amount;
  refund_charges_total: Amount;
  refund_charges_unreserved: Amount;
  refund_held_amount: Amount;
};

function rm(value: Amount) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(Number(value));
}

export default function SellerEarningsSummary() {
  const supabase = useMemo(() => createClient(), []);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const { data, error: queryError } = await supabase.rpc(
          "get_seller_earnings_summary_v2"
        );

        if (queryError) {
          throw new Error("Ringkasan pendapatan gagal dimuatkan.");
        }

        const row = data?.[0] as Summary | undefined;

        if (!row) {
          throw new Error("Ringkasan pendapatan tidak tersedia.");
        }

        const amounts = [
          row.gross_amount,
          row.platform_commission,
          row.confirmed_gateway_fee,
          row.confirmed_net_amount,
          row.unreserved_net_amount,
          row.prepared_payout_amount,
          row.paid_payout_amount,
          row.refund_charges_total,
          row.refund_charges_unreserved,
          row.refund_held_amount,
        ];

        if (
          amounts.some(
            (value) =>
              value === null ||
              value === undefined ||
              String(value).trim() === "" ||
              !Number.isFinite(Number(value))
          )
        ) {
          throw new Error("Data ringkasan pendapatan tidak sah.");
        }

        if (active) setSummary(row);
      } catch (err) {
        if (active) {
          setSummary(null);
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mendapatkan ringkasan pendapatan."
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
  }, [supabase]);

  const cards = summary
    ? [
        {
          title: "Jualan Kasar Selepas Refund",
          value: summary.gross_amount,
        },
        {
          title: "Komisen Platform Selepas Refund",
          value: summary.platform_commission,
        },
        {
          title: "Caj Gateway Jualan Aktif",
          value: summary.confirmed_gateway_fee,
        },
        {
          title: "Bersih Selepas Kos Refund",
          value: summary.confirmed_net_amount,
        },
        {
          title: "Bersih Belum Ditempah Selepas Potongan",
          value: summary.unreserved_net_amount,
        },
        {
          title: "Pendapatan Ditahan untuk Semakan Refund",
          value: summary.refund_held_amount,
        },
        {
          title: "Jumlah Kos Refund Seller",
          value: summary.refund_charges_total,
        },
        {
          title: "Kos Refund Belum Ditempah dalam Payout",
          value: summary.refund_charges_unreserved,
        },
        {
          title: "Payout Disediakan",
          value: summary.prepared_payout_amount,
        },
        {
          title: "Payout Direkodkan Dibayar",
          value: summary.paid_payout_amount,
        },
      ]
    : [];

  return (
    <section
      aria-labelledby="earnings-summary-title"
      className="mt-8 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="earnings-summary-title"
          className="text-xl font-bold"
        >
          Ringkasan Pendapatan
        </h2>

        <Link
          href="/penjual/payout"
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          Sejarah Payout {"\u2192"}
        </Link>
      </div>

      <p className="mt-2 text-sm text-slate-500">
        Berdasarkan rekod pendapatan sistem. Jualan yang telah
        direfund penuh dikecualikan daripada jumlah jualan dan
        komisen di bawah. Jualan lama tanpa rekod pendapatan
        tidak termasuk.
      </p>

      {loading ? (
        <p className="mt-5 text-sm text-slate-500">
          Sedang memuatkan ringkasan pendapatan...
        </p>
      ) : error ? (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error} Sila muat semula halaman untuk mencuba lagi.
        </p>
      ) : summary ? (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-slate-200 p-4"
              >
                <p className="text-sm text-slate-500">
                  {card.title}
                </p>

                <p
                  className={`mt-2 text-xl font-bold ${
                    Number(card.value) < 0
                      ? "text-red-700"
                      : "text-slate-900"
                  }`}
                >
                  {rm(card.value)}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-slate-600">
            Item pendapatan jualan yang belum direfund:{" "}
            {summary.recorded_items}.
            {" "}Item menunggu pengesahan caj:{" "}
            {summary.unconfirmed_items}.
          </p>

          <div className="mt-4 space-y-3 rounded-xl bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-900">
            <p>
              Jumlah bersih di atas sudah mengambil kira kos
              refund seller. Kad kos refund ialah pecahan
              maklumat; jangan tolak jumlah itu sekali lagi.
            </p>

            <p>
              Bersih selepas kos refund termasuk pendapatan
              yang sudah ditempah dalam payout atau direkodkan
              dibayar. Pendapatan yang sedang disemak untuk
              refund masih termasuk dalam jumlah bersih ini,
              tetapi dikecualikan daripada baki belum ditempah.
            </p>

            <p>
              Baki belum ditempah boleh termasuk jualan bulan
              semasa dan belum semestinya layak dibayar bulan
              ini. Payout bulanan bermula pada 7 haribulan,
              minimum RM20 selepas potongan yang layak.
            </p>
          </div>

          {Number(summary.refund_held_amount) > 0 && (
            <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Sebahagian pendapatan ditahan sementara
              permohonan refund disemak. Jumlah ini belum
              boleh dimasukkan dalam payout.
            </p>
          )}

          {Number(summary.unreserved_net_amount) < 0 && (
            <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              Kos refund yang belum ditempah melebihi
              pendapatan tersedia. Baki negatif dibawa ke
              pengiraan berikutnya; paparan ini tidak membuat
              potongan automatik daripada akaun bank anda.
            </p>
          )}

          {Number(summary.unconfirmed_items) > 0 && (
            <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Sebahagian caj gateway belum disahkan.
              Pendapatan bersih bagi item tersebut belum
              dimasukkan dalam jumlah bersih.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
