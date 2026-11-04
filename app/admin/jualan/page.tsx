
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";

export const metadata = {
  title: "Laporan Jualan | KaryaDigital",
};

type SalesRow = {
  order_id: string;
  ebook_id: string;
  ebook_title: string;
  seller_id: string;
  seller_name: string;
  sale_amount: number | string;
  payment_status: string;
  sold_at: string;
};

const rm = (value: number) =>
  new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ms-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));

export default async function AdminSalesPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/akaun");
  }

  const { data, error } = await supabase.rpc(
    "get_admin_sales_report"
  );

  if (error) {
    console.error(
      "Gagal mendapatkan laporan jualan:",
      error.message
    );
  }

  const sales: SalesRow[] = error
    ? []
    : (data ?? []) as SalesRow[];

  const grossSales = sales.reduce(
    (total, sale) =>
      total + Number(sale.sale_amount ?? 0),
    0
  );

  const paidOrders = new Set(
    sales.map((sale) => sale.order_id)
  ).size;

  const ebooksSold = sales.length;

  const activeSellers = new Set(
    sales.map((sale) => sale.seller_id)
  ).size;

  const statistics = [
    {
      title: "Jumlah Jualan Kasar",
      value: rm(grossSales),
      icon: "💰",
    },
    {
      title: "Pesanan Berbayar",
      value: String(paidOrders),
      icon: "🛒",
    },
    {
      title: "eBook Terjual",
      value: String(ebooksSold),
      icon: "📚",
    },
    {
      title: "Penjual Dengan Jualan",
      value: String(activeSellers),
      icon: "🏪",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-indigo-600">
              KaryaDigital
            </h1>
            <p className="text-sm text-gray-500">
              Laporan Jualan Marketplace
            </p>
          </div>

          <Link
            href="/admin"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            ← Dashboard Admin
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Laporan Jualan
          </h2>

          <p className="mt-2 text-gray-600">
            Rekod transaksi berbayar seluruh marketplace
            KaryaDigital.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            Laporan jualan gagal dimuatkan. Sila semak
            fungsi Supabase get_admin_sales_report.
          </div>
        ) : (
          <>
            <section className="mt-8">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statistics.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="text-3xl">
                      {item.icon}
                    </div>

                    <p className="mt-4 text-2xl font-extrabold text-gray-900">
                      {item.value}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Sejarah Transaksi
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Disusun mengikut tarikh pembelian terbaru.
                  </p>
                </div>

                <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                  {ebooksSold} rekod jualan
                </span>
              </div>

              {sales.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                  <div className="text-4xl">📭</div>
                  <p className="mt-4 font-semibold text-gray-900">
                    Belum ada transaksi berbayar.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Transaksi akan dipaparkan di sini
                    selepas pembayaran berjaya.
                  </p>
                </div>
              ) : (
                <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="bg-slate-100 text-gray-600">
                        <tr>
                          <th className="px-5 py-4 font-semibold">
                            Tarikh
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            eBook
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Penjual
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Pesanan
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Status
                          </th>
                          <th className="px-5 py-4 text-right font-semibold">
                            Harga
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {sales.map((sale) => (
                          <tr
                            key={`${sale.order_id}-${sale.ebook_id}`}
                            className="hover:bg-slate-50"
                          >
                            <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                              {formatDate(sale.sold_at)}
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-semibold text-gray-900">
                                {sale.ebook_title}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-gray-700">
                              {sale.seller_name}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                title={sale.order_id}
                                className="font-mono text-xs text-gray-500"
                              >
                                {sale.order_id.slice(0, 8)}...
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                {sale.payment_status}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-gray-900">
                              {rm(Number(sale.sale_amount))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-5 py-5">
                    <span className="font-semibold text-gray-700">
                      Jumlah Jualan Kasar
                    </span>

                    <span className="text-xl font-extrabold text-indigo-700">
                      {rm(grossSales)}
                    </span>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        <div className="mt-10">
          <Link
            href="/admin"
            className="inline-flex rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
