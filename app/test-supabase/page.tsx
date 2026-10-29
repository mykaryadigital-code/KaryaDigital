"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function TestSupabase() {
  const [status, setStatus] = useState("Sedang menguji...");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ error }) => {
      if (error) {
        setStatus("Ralat: " + error.message);
      } else {
        setStatus("Supabase berjaya dihubungkan!");
      }
    }).catch(() => {
      setStatus("Gagal menghubungi Supabase.");
    });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
        <h1 className="text-3xl font-bold text-blue-600">
          KaryaDigital
        </h1>

        <p className="mt-4 text-gray-700">{status}</p>
      </div>
    </main>
  );
}