"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Package, ArrowLeft, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Ebook = {
  title: string;
};

type OrderItem = {
  id: string;
  ebook_id: string;
  price_at_purchase: number;
  ebooks: Ebook | Ebook[] | null;
};

type Order = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
};

type PaymentResult = {
  success?: boolean;
  paymentStatus?: string;
  paymentUrl?: string;
  message?: string;
  error?: string;
};

const orderSelect = `
  id,
  total_amount,
  status,
  created_at,
  order_items (
    id,
    ebook_id,
    price_at_purchase,
    ebooks (
      title
    )
  )
`;

const buttonStyle =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50";

function formatRM(amount: number) {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(amount);
}

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Menunggu Pembayaran";
    case "paid":
      return "Dibayar";
    case "cancelled":
      return "Dibatalkan";
    case "refunded":
      return "Dipulangkan";
    default:
      return status;
  }
}

export default function PesananSaya() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [checkingOrderId, setCheckingOrderId] = useState<string | null>(null);
  const [downloadingEbookId, setDownloadingEbookId] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refreshOrders() {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setLoggedIn(false);
      setOrders([]);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("orders")
      .select(orderSelect)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError("Gagal mendapatkan senarai pesanan. Sila cuba lagi.");
      return;
    }

    setLoggedIn(true);
    setOrders((data ?? []) as unknown as Order[]);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (authError || !user) {
          setLoggedIn(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from("orders")
          .select(orderSelect)
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false });

        if (cancelled) return;

        if (queryError) {
          setError("Gagal mendapatkan senarai pesanan.");
          return;
        }

        setOrders((data ?? []) as unknown as Order[]);
      } catch {
        if (!cancelled) {
          setError("Gagal memuatkan pesanan.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePayment(orderId: string) {
    if (payingOrderId || checkingOrderId) return;

    setPayingOrderId(orderId);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/payments/create-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const result: PaymentResult = await response.json();

      if (!response.ok || result.success !== true) {
        setError(result.error || "Gagal menyediakan pembayaran.");
        return;
      }

      if (
        typeof result.paymentUrl !== "string" ||
        !result.paymentUrl.startsWith("https://dev.toyyibpay.com/")
      ) {
        setError("Pautan pembayaran ToyyibPay tidak sah.");
        return;
      }

      window.location.assign(result.paymentUrl);
    } catch {
      setError("Sambungan pembayaran gagal. Sila cuba semula.");
    } finally {
      setPayingOrderId(null);
    }
  }

  async function handleReconcile(orderId: string) {
    if (checkingOrderId || payingOrderId) return;

    setCheckingOrderId(orderId);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/payments/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
        cache: "no-store",
      });

      const result: PaymentResult = await response.json();

      if (
        response.ok &&
        result.success === true &&
        result.paymentStatus === "paid"
      ) {
        setNotice("Pembayaran berjaya disahkan oleh ToyyibPay.");
        await refreshOrders();
        return;
      }

      if (response.status === 409) {
        setNotice(
          result.message ||
            result.error ||
            "Bayaran belum dapat disahkan. Status pesanan tidak diubah."
        );
        return;
      }

      setError(result.error || "Gagal menyemak pembayaran.");
    } catch {
      setError("Sambungan semakan pembayaran gagal.");
    } finally {
      setCheckingOrderId(null);
    }
  }

  async function handleDownload(ebookId: string) {
    if (downloadingEbookId) return;

    setDownloadingEbookId(ebookId);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/ebook/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ebookId }),
        cache: "no-store",
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.error || "Gagal memuat turun eBook.");
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      try {
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = `karyadigital-${ebookId}.pdf`;
        document.body.appendChild(anchor);

        try {
          anchor.click();
        } finally {
          anchor.remove();
        }
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      }
    } catch {
      setError("Sambungan muat turun gagal. Sila cuba lagi.");
    } finally {
      setDownloadingEbookId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          <ArrowLeft size={17} />
          Kembali ke KaryaDigital
        </Link>

        <div className="mt-7 flex items-center gap-3">
          <span className="rounded-2xl bg-orange-100 p-3 text-orange-600">
            <Package size={26} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Pesanan Saya
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Sejarah pesanan dan status pembayaran anda.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-800"
          >
            {notice}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-500">
            Sedang memuatkan pesanan...
          </div>
        ) : !loggedIn ? (
          <div className="mt-8 rounded-2xl bg-white p-6">
            <p>Sila log masuk untuk melihat pesanan.</p>
            <Link
              href="/login"
              className="mt-4 inline-block font-bold text-orange-600"
            >
              Log Masuk
            </Link>
          </div>
        ) : orders.length === 0 ? (
          !error && (
            <div className="mt-8 rounded-2xl bg-white p-8 text-center">
              <BookOpen size={40} className="mx-auto text-slate-300" />
              <p className="mt-4 font-semibold text-slate-700">
                Belum ada pesanan
              </p>
              <Link
                href="/"
                className="mt-3 inline-block text-sm font-bold text-orange-600"
              >
                Terokai eBook
              </Link>
            </div>
          )
        ) : (
          <div className="mt-8 space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-5 py-4">
                  <span className="text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleString("ms-MY")}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      order.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : order.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="px-5 py-4">
                  <p className="mb-4 break-all text-xs text-slate-400">
                    ID Pesanan: {order.id}
                  </p>

                  <div className="space-y-3">
                    {order.order_items?.map((item) => {
                      const ebook = Array.isArray(item.ebooks)
                        ? item.ebooks[0]
                        : item.ebooks;

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-100 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="rounded-lg bg-orange-50 p-3 text-orange-500">
                              <BookOpen size={22} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800">
                                {ebook?.title ?? "Maklumat eBook tidak tersedia"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                eBook Digital
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-bold text-orange-600">
                              {formatRM(item.price_at_purchase)}
                            </span>
                          </div>

                          {order.status === "paid" && (
                            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                              <Link
                                href={`/baca/${item.ebook_id}`}
                                className={`${buttonStyle} bg-orange-600 text-white hover:bg-orange-700`}
                              >
                                <BookOpen size={16} />
                                Baca Online
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDownload(item.ebook_id)}
                                disabled={downloadingEbookId !== null}
                                className={`${buttonStyle} border border-orange-600 bg-white text-orange-700 hover:bg-orange-50`}
                              >
                                <Download size={16} />
                                {downloadingEbookId === item.ebook_id
                                  ? "Sedang Download..."
                                  : "Download PDF"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <span className="font-bold text-slate-800">
                      Jumlah Pesanan
                    </span>
                    <span className="text-xl font-extrabold text-orange-600">
                      {formatRM(order.total_amount)}
                    </span>
                  </div>

                  {order.status === "pending" && (
                    <div className="mt-3">
                      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                        Pesanan telah direkodkan. Pembayaran masih belum dibuat
                        atau disahkan.
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handlePayment(order.id)}
                          disabled={
                            payingOrderId !== null ||
                            checkingOrderId !== null
                          }
                          className={`${buttonStyle} bg-orange-600 text-white hover:bg-orange-700`}
                        >
                          {payingOrderId === order.id
                            ? "Sedang Diproses..."
                            : "Bayar Sekarang"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReconcile(order.id)}
                          disabled={
                            checkingOrderId !== null ||
                            payingOrderId !== null
                          }
                          className={`${buttonStyle} border border-slate-300 bg-white text-slate-700 hover:bg-slate-100`}
                        >
                          {checkingOrderId === order.id
                            ? "Sedang Menyemak..."
                            : "Semak Status Bayaran"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}