"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { useEffect, useRef, useState } from "react";

function getDestination() {
  const next = new URLSearchParams(window.location.search).get("next");

  // Hanya laluan produk UUID dibenarkan.
  const productPath =
    /^\/ebook\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return next && productPath.test(next) ? next : "/akaun";
}

export default function LoginPage() {
  const router = useRouter();
  const sending = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registerHref, setRegisterHref] = useState("/daftar");

  useEffect(() => {
    const destination = getDestination();

    if (destination !== "/akaun") {
      setRegisterHref(
        `/daftar?next=${encodeURIComponent(destination)}`
      );
    }
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;

    sending.current = true;
    setLoading(true);
    setErrorMessage("");

    let navigating = false;

    try {
      const destination = getDestination();
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      navigating = true;
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Log masuk gagal. Sila cuba lagi."
      );
    } finally {
      if (!navigating) {
        sending.current = false;
        setLoading(false);
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-lg">
        <Link href="/" className="block text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">
            My<span className="text-orange-500">Karya</span>
          </h1>
        </Link>

        <p className="mt-2 text-center text-sm text-gray-500">
          Marketplace eBook Malaysia
        </p>

        <h2 className="mt-8 text-2xl font-bold text-gray-900">
          Log Masuk
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Selamat kembali ke MyKarya.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Alamat Email
            </label>

            <input
              id="email"
              type="email"
              required
              disabled={loading}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none focus:border-indigo-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              disabled={loading}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none focus:border-indigo-500 disabled:bg-gray-100"
            />
          </div>

          <div className="text-right">
            <Link
              href="/lupa-password"
              className="text-sm font-semibold text-indigo-600 hover:underline"
            >
              Lupa Password?
            </Link>
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Sedang log masuk..." : "Log Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Belum ada akaun?{" "}
          <Link href={registerHref} className="font-semibold text-indigo-600">
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </main>
  );
}
