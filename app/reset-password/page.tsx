
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        }
      });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && window.location.hash.includes("type=recovery")) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (password.length < 12) {
      setMessage("Password mesti sekurang-kurangnya 12 aksara.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Kedua-dua password tidak sama.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage("Gagal menukar password. Minta pautan reset baharu.");
    } else {
      await supabase.auth.signOut();
      setReady(false);
      setPassword("");
      setConfirmPassword("");
      setMessage("Password berjaya ditukar. Sila log masuk semula.");
    }

    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">
        Tetapkan Password Baharu
      </h1>

      {ready ? (
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="Password baharu"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border p-3"
            required
          />

          <input
            type="password"
            placeholder="Sahkan password baharu"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded border p-3"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-purple-600 p-3 text-white disabled:opacity-50"
          >
            {loading ? "Sedang menyimpan..." : "Tukar Password"}
          </button>
        </form>
      ) : (
        <p>Menunggu pautan pemulihan password yang sah.</p>
      )}

      {message && <p className="mt-4">{message}</p>}
    </main>
  );
}
