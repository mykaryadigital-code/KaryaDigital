
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      setMessage(
        "Jika alamat emel ini berdaftar, pautan pemulihan password akan dihantar. Sila semak inbox atau spam."
      );
    } catch {
      setErrorMessage(
        "Permintaan tidak dapat diproses sekarang. Sila cuba sebentar lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">
          Lupa Password?
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Masukkan alamat emel akaun KaryaDigital anda.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Alamat emel"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border p-3 text-gray-900"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Sedang menghantar..." : "Hantar Pautan Reset"}
          </button>
        </form>

        {message && (
          <p role="status" className="mt-4 text-sm text-green-700">
            {message}
          </p>
        )}

        {errorMessage && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <Link
          href="/login"
          className="mt-6 block text-center text-sm text-indigo-600"
        >
          Kembali ke Log Masuk
        </Link>
      </div>
    </main>
  );
}
