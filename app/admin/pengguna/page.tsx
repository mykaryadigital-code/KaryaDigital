
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export const metadata = {
  title: "Pengurusan Pengguna | KaryaDigital",
};

type UserRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  user_role: string;
  registered_at: string;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    role?: string;
  }>;
};

const roleLabels: Record<string, string> = {
  admin: "Super Admin",
  seller: "Penjual",
  buyer: "Pembeli",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ms-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminUsersPage({
  searchParams,
}: PageProps) {
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
    "get_admin_users"
  );

  if (error) {
    console.error(
      "Gagal mendapatkan senarai pengguna:",
      error.message
    );
  }

  const users: UserRow[] = error
    ? []
    : ((data ?? []) as UserRow[]);

  const params = await searchParams;

  const query = (params.q ?? "").trim().toLowerCase();

  const selectedRole = ["admin", "seller", "buyer"].includes(
    params.role ?? ""
  )
    ? params.role ?? ""
    : "";

  const filteredUsers = users.filter((item) => {
    const matchesSearch =
      !query ||
      (item.full_name ?? "")
        .toLowerCase()
        .includes(query) ||
      (item.phone ?? "")
        .toLowerCase()
        .includes(query) ||
      item.user_id.toLowerCase().includes(query);

    const matchesRole =
      !selectedRole || item.user_role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const totalAdmins = users.filter(
    (item) => item.user_role === "admin"
  ).length;

  const totalSellers = users.filter(
    (item) => item.user_role === "seller"
  ).length;

  const totalBuyers = users.filter(
    (item) => item.user_role === "buyer"
  ).length;

  const statistics = [
    {
      title: "Jumlah Pengguna",
      value: users.length,
      icon: "👥",
    },
    {
      title: "Pembeli",
      value: totalBuyers,
      icon: "🛒",
    },
    {
      title: "Penjual",
      value: totalSellers,
      icon: "🏪",
    },
    {
      title: "Super Admin",
      value: totalAdmins,
      icon: "🛡️",
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
              Pengurusan Pengguna
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
        <h2 className="text-3xl font-bold text-gray-900">
          Pengurusan Pengguna
        </h2>

        <p className="mt-2 text-gray-600">
          Pantau akaun pembeli, penjual dan Super Admin
          yang berdaftar di KaryaDigital.
        </p>

        {error ? (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            Senarai pengguna gagal dimuatkan.
            Sila semak fungsi Supabase get_admin_users.
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
            </section>

            <section className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Senarai Pengguna
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Cari dan tapis pengguna berdaftar.
                  </p>
                </div>

                <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                  {filteredUsers.length} pengguna dipaparkan
                </span>
              </div>

              <form
                method="GET"
                className="mt-5 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row"
              >
                <input
                  type="search"
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="Cari nama, telefon atau ID..."
                  aria-label="Cari pengguna"
                  className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500"
                />

                <select
                  name="role"
                  defaultValue={selectedRole}
                  aria-label="Tapis peranan"
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900"
                >
                  <option value="">Semua Peranan</option>
                  <option value="buyer">Pembeli</option>
                  <option value="seller">Penjual</option>
                  <option value="admin">Super Admin</option>
                </select>

                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Cari
                </button>

                <Link
                  href="/admin/pengguna"
                  className="rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </Link>
              </form>

              {filteredUsers.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                  <p className="text-4xl">🔍</p>
                  <p className="mt-4 font-semibold text-gray-900">
                    Tiada pengguna ditemui.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Cuba kata carian atau penapis yang lain.
                  </p>
                </div>
              ) : (
                <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-sm">
                      <thead className="bg-slate-100 text-gray-600">
                        <tr>
                          <th className="px-5 py-4 font-semibold">
                            Pengguna
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Telefon
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Peranan
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            Tarikh Daftar
                          </th>
                          <th className="px-5 py-4 font-semibold">
                            ID Pengguna
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((item) => (
                          <tr
                            key={item.user_id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-semibold text-gray-900">
                              {item.full_name || "Tiada nama"}
                            </td>

                            <td className="px-5 py-4 text-gray-600">
                              {item.phone || "—"}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={
                                  item.user_role === "admin"
                                    ? "rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700"
                                    : item.user_role === "seller"
                                    ? "rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
                                    : "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                                }
                              >
                                {roleLabels[item.user_role] ??
                                  item.user_role}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                              {formatDate(item.registered_at)}
                            </td>

                            <td className="px-5 py-4 font-mono text-xs text-gray-500">
                              <span title={item.user_id}>
                                {item.user_id.slice(0, 8)}...
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        <div className="mt-10">
          <Link
            href="/admin"
            className="inline-flex rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
