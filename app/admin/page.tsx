
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  // Semak pengguna sebenar melalui Supabase Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Dapatkan role daripada database
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  // Pengguna biasa tidak dibenarkan masuk
  if (profileError || profile?.role !== "admin") {
    redirect("/akaun");
  }

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

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Pengurusan Pengguna",
              description: "Urus pembeli dan penjual.",
              icon: "👥",
            },
            {
              title: "Permohonan Penjual",
              description: "Semak permohonan menjadi penjual.",
              icon: "🏪",
            },
            {
              title: "Semakan eBook",
              description: "Semak kandungan eBook penjual.",
              icon: "📚",
            },
            {
              title: "Kelulusan Penerbitan",
              description: "Lulus atau tolak eBook.",
              icon: "✅",
            },
            {
              title: "Laporan Jualan",
              description: "Pantau prestasi marketplace.",
              icon: "📊",
            },
            {
              title: "Tetapan Platform",
              description: "Urus tetapan KaryaDigital.",
              icon: "⚙️",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="text-3xl">{item.icon}</div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>

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
 