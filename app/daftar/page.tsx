"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

const productPath =
  /^\/ebook\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getProductDestination() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && productPath.test(next) ? next : null;
}

export default function DaftarPage() {
  const sending = useRef(false);

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mesej, setMesej] = useState("");
  const [berjaya, setBerjaya] = useState(false);
  const [loginHref, setLoginHref] = useState("/login");

  useEffect(() => {
    const next = getProductDestination();

    if (next) {
      setLoginHref(`/login?next=${encodeURIComponent(next)}`);
    }
  }, []);

  async function daftar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
        const cleanPhone = phone.replace(/[\s-]/g, "");

    if (!/^(\+?60|0)1\d{8,9}$/.test(cleanPhone)) {
      setMesej("Masukkan nombor telefon Malaysia yang sah.");
      return;
    }
    if (sending.current || berjaya) return;

    const cleanName = nama.trim();
    if (!cleanName) {
      setMesej("Masukkan nama penuh.");
      return;
    }

    sending.current = true;
    setLoading(true);
    setMesej("");

    try {
      const next = getProductDestination();
      const callbackUrl = new URL(
        "/auth/callback",
        window.location.origin
      );

      if (next) callbackUrl.searchParams.set("next", next);

      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
                options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
          },
          emailRedirectTo: callbackUrl.toString(),
        },
      });

      if (error) throw error;

      setBerjaya(true);

      // Menyokong persekitaran yang tidak memerlukan
      // pengesahan email, tanpa membuat pesanan automatik.
      if (data.session) {
        setMesej("Pendaftaran diterima. Membuka halaman seterusnya...");
        window.location.assign(next ?? "/akaun");
        return;
      }

      setPassword("");
      setMesej(
        "Pendaftaran diterima. Sila semak email untuk pengesahan " +
          "sebelum login. Buka pautan pengesahan dalam browser " +
          "yang sama dengan pendaftaran ini."
      );
    } catch (error) {
      setMesej(
        error instanceof Error
          ? error.message
          : "Pendaftaran gagal. Semak email sebelum mencuba lagi."
      );
    } finally {
      sending.current = false;
      setLoading(false);
    }
  }

  const disabled = loading || berjaya;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-lg">
        <Link href="/" className="block text-center">
          <h1 className="text-3xl font-extrabold text-indigo-600">
            KaryaDigital
          </h1>
        </Link>

        <p className="mt-2 text-center text-gray-500">
          Marketplace eBook Malaysia
        </p>

        <h2 className="mt-8 text-2xl font-bold text-gray-900">
          Daftar Akaun
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Cipta akaun untuk membeli dan membaca eBook.
        </p>

        <form onSubmit={daftar} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="nama"
              className="text-sm font-medium text-gray-700"
            >
              Nama Penuh
            </label>
            <input
              id="nama"
              type="text"
              required
              maxLength={100}
              autoComplete="name"
              disabled={disabled}
              value={nama}
              onChange={(event) => setNama(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900 disabled:bg-gray-100"
              placeholder="Nama anda"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Alamat Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              disabled={disabled}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900 disabled:bg-gray-100"
              placeholder="nama@email.com"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="text-sm font-medium text-gray-700"
            >
              Nombor Telefon
            </label>

            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={24}
              disabled={disabled}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              aria-describedby="phone-help"
              placeholder="Contoh: 0123456789"
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900 disabled:bg-gray-100"
            />

            <p
              id="phone-help"
              className="mt-2 text-xs text-gray-500"
            >
              Digunakan untuk urusan pembayaran. Format 0123456789
              atau +60123456789 diterima.
            </p>
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={disabled}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900 disabled:bg-gray-100"
              placeholder="Minimum 8 aksara"
            />
          </div>

          {mesej && (
            <p
              role={berjaya ? "status" : "alert"}
              className={`rounded-lg p-3 text-sm ${
                berjaya
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {mesej}
            </p>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading
              ? "Sedang mendaftar..."
              : berjaya
              ? "Semak Email Anda"
              : "Daftar Sekarang"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah ada akaun?{" "}
          <Link href={loginHref} className="font-semibold text-indigo-600">
            Log Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
