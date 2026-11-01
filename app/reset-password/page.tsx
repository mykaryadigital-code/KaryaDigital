
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState(false);
  useEffect(() => {
    let active = true;

    async function checkRecovery() {
      try {
        const response = await fetch(
          "/api/auth/recovery-status",
          {
            cache: "no-store",
            credentials: "same-origin",
          }
        );

        if (!response.ok) {
          throw new Error("Recovery check failed");
        }

        const data = await response.json();

        if (active) {
          setReady(data.ready === true);
        }
      } catch {
        if (active) {
          setReady(false);
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    checkRecovery();

    return () => {
      active = false;
    };
  }, []);

  async function handleReset(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    if (loading || !ready) return;

    setMessage("");

    if (password.length < 12) {
      setMessage(
        "Password mesti sekurang-kurangnya 12 aksara."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Kedua-dua password tidak sama.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/recovery-status",
        {
          cache: "no-store",
          credentials: "same-origin",
        }
      );

      if (!response.ok) {
        throw new Error("Recovery check failed");
      }

      const data = await response.json();

      if (data.ready !== true) {
        setReady(false);
        setMessage(
          "Sesi pemulihan tidak sah atau telah tamat. Sila minta pautan baharu."
        );
        return;
      }

      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(
          "Gagal menukar password. Sila minta pautan reset baharu."
        );
        return;
      }

      await supabase.auth.signOut();
      setSuccess(true);
      setReady(false);
      setPassword("");
      setConfirmPassword("");
      setMessage(
        "Password berjaya ditukar. Sila log masuk semula."
      );
    } catch {
      setMessage(
        "Ralat semasa memproses permintaan. Sila cuba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">
        Tetapkan Password Baharu
      </h1>

      {checking ? (
        <p>Sedang mengesahkan pautan pemulihan...</p>
      ) : ready ? (
        <form
          onSubmit={handleReset}
          className="space-y-4"
        >
          <input
            type="password"
            placeholder="Password baharu"
            autoComplete="new-password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full rounded border p-3"
            required
          />

          <input
            type="password"
            placeholder="Sahkan password baharu"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            className="w-full rounded border p-3"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-purple-600 p-3 text-white disabled:opacity-50"
          >
            {loading
              ? "Sedang menyimpan..."
              : "Tukar Password"}
          </button>
        </form>
      ) : (
  !success && (
    <p>
      Pautan pemulihan tidak sah atau telah tamat.
      Sila minta pautan baharu.
    </p>
  )
)}

      {message && (
        <p role="status" className="mt-4">
          {message}
        </p>
      )}

      <Link
        href="/lupa-password"
        className="mt-6 block text-purple-600"
      >
        Minta Pautan Reset Baharu
      </Link>
    </main>
  );
}
