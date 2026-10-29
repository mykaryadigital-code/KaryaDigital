
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Package, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type OrderItem = {
  id: string;
  ebook_id: string;
  price_at_purchase: number;
  ebooks: {
  title: string;
}[];
};

type Order = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
};

export default function PesananSaya() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [error, setError] = useState("");
async function handlePayment(orderId: string) {
  if (payingOrderId) return;

  setPayingOrderId(orderId);
  setError("");

  try {
    const response = await fetch("/api/payments/create-bill", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ orderId }),
});
  
  const result = await response.json();
  if (!response.ok || result.success !== true) {
  setError(result.error || "Gagal menyediakan pembayaran.");
  return;
}
if (
  typeof result.paymentUrl !== "string" ||
  !result.paymentUrl.startsWith("https://dev.toyyibpay.com/")
) {
  setError("Pautan pembayaran toyyibPay tidak sah.");
  return;
}
  window.location.assign(result.paymentUrl);
  
  } catch (error) {
  console.error("Payment request failed:", error);
  setError("Sambungan pembayaran gagal. Sila cuba semula.");
} finally {
  setPayingOrderId(null);
}
}
  useEffect(() => {
    async function loadOrders() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      const { data, error: ordersError } = await supabase
        .from("orders")
        .select(`
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
        `)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Gagal mendapatkan pesanan:", ordersError);
        setError(
          "Gagal mendapatkan senarai pesanan. Sila cuba lagi."
        );
      } else {
        setOrders((data ?? []) as Order[]);
      }

      setLoading(false);
    }

    loadOrders();
  }, []);

  const formatRM = (amount: number) =>
    new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("ms-MY");

  const statusLabel = (status: string) => {
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
  };

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
        ) : error ? (
          <div className="mt-8 rounded-2xl bg-red-50 p-6 text-red-600">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center">
            <BookOpen
              size={40}
              className="mx-auto text-slate-300"
            />
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
        ) : (
          <div className="mt-8 space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-5 py-4">
                  <span className="text-xs text-slate-500">
                    {formatDate(order.created_at)}
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
                    {order.order_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                      >
                        <span className="rounded-lg bg-orange-50 p-3 text-orange-500">
                          <BookOpen size={22} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800">
                            {Array.isArray(item.ebooks)
                            ? item.ebooks[0]?.title ?? "Maklumat eBook tidak tersedia"
                            : (item.ebooks as { title: string } | null)?.title ??
                            "Maklumat eBook tidak tersedia"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            eBook Digital
                          </p>
                        </div>

                        <span className="shrink-0 text-sm font-bold text-orange-600">
                          {formatRM(item.price_at_purchase)}
                        </span>
                      </div>
                    ))}
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
      Pesanan telah direkodkan. Pembayaran masih belum dibuat atau disahkan.
    </p>

    <button
  type="button"
  onClick={() => handlePayment(order.id)}
  disabled={payingOrderId === order.id}
  className="mt-3 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  {payingOrderId === order.id ? "Sedang Diproses..." : "Bayar Sekarang"}
</button>
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
