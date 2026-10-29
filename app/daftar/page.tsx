
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function DaftarPage() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mesej, setMesej] = useState("");
  const [berjaya, setBerjaya] = useState(false);

  async function daftar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMesej("");
    setBerjaya(false);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nama.trim()
          },
          emailRedirectTo:
            `${window.location.origin}/login`
        }
      });

      if (error) throw error;

      setBerjaya(true);
      setMesej(
        "Pendaftaran diterima. Sila semak email untuk pengesahan sebelum login."
      );
    } catch (error) {
      setMesej(
        error instanceof Error
          ? error.message
          : "Pendaftaran gagal. Cuba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-100">
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
            <label htmlFor="nama" className="text-sm font-medium text-gray-700">
              Nama Penuh
            </label>
            <input
              id="nama"
              type="text"
              required
              maxLength={100}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
              placeholder="Nama anda"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Alamat Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
              placeholder="Minimum 8 aksara"
            />
          </div>

          {mesej && (
            <p
              role="status"
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
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Sedang mendaftar..." : "Daftar Sekarang"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah ada akaun?{" "}
          <Link href="/login" className="font-semibold text-indigo-600">
            Log Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
