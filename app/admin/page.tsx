
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/server";

export const metadata = {
  title: "Super Admin Dashboard | KaryaDigital",
};

const rm = (value: number) =>
  new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(value);

export default async function AdminPage() {
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
      .select("role, full_name")
      .eq("id", user.id)
      .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/akaun");
  }

  const { data: statsData, error: statsError } =
    await supabase.rpc("get_admin_marketplace_stats");

  if (statsError) {
    console.error(
      "Gagal mendapatkan statistik Super Admin:",
      statsError.message
    );
  }

  const stats = statsData?.[0];

  const statistics = [
    {
      title: "Jumlah Jualan Kasar",
      value: statsError
        ? "Tidak tersedia"
        : rm(Number(stats?.gross_sales ?? 0)),
      icon: "💰",
    },
    {
      title: "Pesanan Berbayar",
      value: statsError
        ? "—"
        : String(stats?.paid_orders ?? 0),
      icon: "🛒",
    },
    {
      title: "eBook Terjual",
      value: statsError
        ? "—"
        : String(stats?.ebooks_sold ?? 0),
      icon: "📚",
    },
    {
      title: "Penjual Aktif",
      value: statsError
        ? "—"
        : String(stats?.active_sellers ?? 0),
      icon: "🏪",
    },
  ];

  const managementItems = [
    {
      title: "Pengurusan Pengguna",
      description: "Urus pembeli dan penjual.",
      icon: "👥",
      href: "/admin/pengguna",
    },
    {
      title: "Permohonan Penjual",
      description: "Semak permohonan menjadi penjual.",
      icon: "🏪",
      href: "/admin/permohonan-penjual",
    },
    {
      title: "Semakan eBook",
      description: "Semak kandungan eBook penjual.",
      icon: "📚",
      href: "/admin/ebooks",
    },
    {
      title: "Kelulusan Penerbitan",
      description: "Lulus atau tolak eBook.",
      icon: "✅",
      href: "/admin/ebooks",
    },
    {
      title: "Laporan Jualan",
      description: "Pantau prestasi marketplace.",
      icon: "📊",
      href: "/admin/jualan",
    },
    {
      title: "Tetapan Platform",
      description: "Urus tetapan KaryaDigital.",
      icon: "⚙️",
      href: "/admin/tetapan",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-indigo-600">
              KaryaDigital
            </h1>
            <p className="text-sm text-gray-500">
              Super Admin Dashboard
            </p>
          </div>

          <Link
            href="/akaun"
            className="text-sm font-medium text-gray-600 hover:text-indigo-600"
          >
            Akaun Saya
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-3xl font-bold text-gray-900">
          Selamat Datang, Admin!
        </h2>

        <p className="mt-2 text-gray-600">
          Log masuk sebagai {user.email}
        </p>

        <section className="mt-8">
          <h3 className="text-xl font-bold text-gray-900">
            Ringkasan Marketplace
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Statistik jualan berbayar seluruh KaryaDigital.
          </p>

          {statsError && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              Statistik jualan gagal dimuatkan. Sila semak
              sambungan Supabase.
            </p>
          )}

          {!statsError && !stats && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            >
              Tiada data statistik dipulangkan untuk akaun ini.
            </p>
          )}

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
          <h3 className="text-xl font-bold text-gray-900">
            Pengurusan Platform
          </h3>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {managementItems.map((item) => {
              const content = (
                <>
                  <div className="text-3xl">
                    {item.icon}
                  </div>

                  <h4 className="mt-4 text-lg font-bold text-gray-900">
                    {item.title}
                  </h4>

                  <p className="mt-2 text-sm text-gray-500">
                    {item.description}
                  </p>
                </>
              );

              return item.href ? (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  {content}
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-10 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
          <p className="font-semibold text-indigo-800">
            Status: Super Admin Aktif
          </p>

          <p className="mt-1 text-sm text-indigo-700">
            Halaman ini hanya dipaparkan kepada akaun
            dengan peranan admin.
          </p>
        </div>
      </div>
    </main>
  );
}
