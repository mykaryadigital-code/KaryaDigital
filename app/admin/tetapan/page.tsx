
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../../../lib/supabase/server";

export const metadata = {
  title: "Tetapan Platform | KaryaDigital",
};

type PlatformSettings = {
  id: number;
  platform_name: string;
  platform_description: string;
  support_email: string | null;
  seller_registration_enabled: boolean;
  updated_at: string;
};

type PageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

async function savePlatformSettings(formData: FormData) {
  "use server";

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

  const platformName = String(
    formData.get("platform_name") ?? ""
  ).trim();

  const platformDescription = String(
    formData.get("platform_description") ?? ""
  ).trim();

  const supportEmail = String(
    formData.get("support_email") ?? ""
  ).trim();

  const sellerRegistrationEnabled =
    formData.get("seller_registration_enabled") === "on";

  if (!platformName || platformName.length > 100) {
    redirect("/admin/tetapan?status=invalid");
  }

  if (
    platformDescription.length > 1000 ||
    supportEmail.length > 254 ||
    (supportEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail))
  ) {
    redirect("/admin/tetapan?status=invalid");
  }

  const { data, error } = await supabase.rpc(
    "update_admin_platform_settings",
    {
      p_platform_name: platformName,
      p_platform_description: platformDescription,
      p_support_email: supportEmail || null,
      p_seller_registration_enabled:
        sellerRegistrationEnabled,
    }
  );

  if (error || data !== true) {
    console.error("Gagal simpan tetapan:", error);
    redirect("/admin/tetapan?status=error");
  }

  revalidatePath("/admin/tetapan");
  redirect("/admin/tetapan?status=saved");
}

export default async function AdminSettingsPage({
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
    "get_admin_platform_settings"
  );

  const settings = (
    Array.isArray(data) ? data[0] : null
  ) as PlatformSettings | null;

  const params = await searchParams;
  const status = params.status;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm font-medium text-pink-600 hover:underline"
          >
            ← Kembali ke Dashboard Admin
          </Link>

          <h1 className="mt-5 text-3xl font-bold text-gray-900">
            Tetapan Platform
          </h1>

          <p className="mt-2 text-gray-600">
            Urus maklumat asas dan konfigurasi
            KaryaDigital.
          </p>
        </div>

        {status === "saved" && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"
          >
            Tetapan platform berjaya disimpan.
          </div>
        )}

        {status === "error" && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
          >
            Tetapan gagal disimpan. Sila cuba lagi.
          </div>
        )}

        {status === "invalid" && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800"
          >
            Sila semak nama platform, penerangan
            dan format e-mel sokongan.
          </div>
        )}

        {error || !settings ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6">
            <h2 className="font-semibold text-red-700">
              Tetapan tidak dapat dimuatkan
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Semak sambungan Supabase dan fungsi
              get_admin_platform_settings.
            </p>
          </div>
        ) : (
          <form
            action={savePlatformSettings}
            className="space-y-6"
          >
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Maklumat Platform
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Maklumat asas KaryaDigital yang
                boleh dikemas kini oleh Super Admin.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="platform_name"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Nama Platform
                  </label>

                  <input
                    id="platform_name"
                    name="platform_name"
                    type="text"
                    required
                    maxLength={100}
                    defaultValue={settings.platform_name}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="platform_description"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Penerangan Platform
                  </label>

                  <textarea
                    id="platform_description"
                    name="platform_description"
                    rows={4}
                    maxLength={1000}
                    defaultValue={
                      settings.platform_description
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="support_email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    E-mel Sokongan
                  </label>

                  <input
                    id="support_email"
                    name="support_email"
                    type="email"
                    maxLength={254}
                    placeholder="support@mykarya.digital"
                    defaultValue={
                      settings.support_email ?? ""
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    E-mel untuk pertanyaan dan bantuan
                    pengguna.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Pendaftaran Penjual
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                Simpan pilihan sama ada permohonan
                penjual baharu dibenarkan.
              </p>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-gray-50 p-4">
                <input
                  type="checkbox"
                  name="seller_registration_enabled"
                  defaultChecked={
                    settings.seller_registration_enabled
                  }
                  className="mt-1 h-5 w-5 accent-pink-600"
                />

                <span>
                  <span className="block font-medium text-gray-900">
                    Benarkan permohonan penjual
                  </span>

                  <span className="mt-1 block text-sm text-gray-500">
                    Tetapan ini belum disambungkan
                    kepada proses permohonan penjual.
                    Menyahaktifkannya sekarang hanya
                    menyimpan pilihan dalam pangkalan
                    data.
                  </span>
                </span>
              </label>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-gray-500">
                Kemas kini terakhir:{" "}
                {new Intl.DateTimeFormat("ms-MY", {
                  timeZone: "Asia/Kuala_Lumpur",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(settings.updated_at))}
              </p>

              <button
                type="submit"
                className="rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
              >
                Simpan Tetapan
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
