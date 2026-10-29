
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function AkaunPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function checkUser() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? "");
      setLoading(false);
    }

    checkUser().catch(() => {
      if (active) {
        setErrorMessage("Gagal menyemak akaun.");
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="p-10 text-center">
        Sedang memuatkan akaun...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold text-indigo-600">
          KaryaDigital
        </h1>

        <h2 className="mt-6 text-xl font-bold text-gray-900">
          Akaun Saya
        </h2>

        <p className="mt-3 text-gray-600">
          Selamat datang!
        </p>

        <p className="mt-2 break-all text-sm text-gray-700">
          Email: {email}
        </p>

        {errorMessage && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        <button
          onClick={logout}
          className="mt-8 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
        >
          Log Keluar
        </button>
      </div>
    </main>
  );
}
