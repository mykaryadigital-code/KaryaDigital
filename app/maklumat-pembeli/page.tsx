
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function MaklumatPembeli() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Sila log masuk dahulu.");
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setError("Gagal mendapatkan maklumat profil.");
      } else {
        setName(data?.full_name ?? "");
        setPhone(data?.phone ?? "");
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function savePhone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId || saving) return;

    const cleanedPhone = phone.replace(/[\s-]/g, "");

    if (!/^(\+?60|0)1\d{8,9}$/.test(cleanedPhone)) {
      setError("Masukkan nombor telefon Malaysia yang sah.");
      setMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ phone: cleanedPhone })
      .eq("id", userId);

    if (updateError) {
      setError("Gagal menyimpan nombor telefon.");
    } else {
      setPhone(cleanedPhone);
      setMessage("Nombor telefon berjaya disimpan.");
    }

    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="text-sm font-semibold text-orange-600"
        >
          ← Kembali ke KaryaDigital
        </Link>

        <h1 className="mt-7 text-3xl font-extrabold text-slate-900">
          Maklumat Pembeli
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Lengkapkan maklumat untuk pembayaran eBook.
        </p>

        {loading ? (
          <p className="mt-8">Sedang memuatkan profil...</p>
        ) : error === "Sila log masuk dahulu." ? (
          <div className="mt-8 rounded-2xl bg-white p-6">
            <p>{error}</p>
            <Link
              href="/login"
              className="mt-3 inline-block font-bold text-orange-600"
            >
              Log Masuk
            </Link>
          </div>
        ) : (
          <form
            onSubmit={savePhone}
            className="mt-8 space-y-5 rounded-2xl border bg-white p-6 shadow-sm"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Nama Pembeli
              </label>
              <input
                value={name}
                readOnly
                className="w-full rounded-xl border bg-slate-100 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                E-mel
              </label>
              <input
                value={email}
                readOnly
                className="w-full rounded-xl border bg-slate-100 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="buyer-phone"
                className="mb-2 block text-sm font-semibold"
              >
                Nombor Telefon
              </label>
              <input
                id="buyer-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 0123456789"
                required
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-orange-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {message && (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-white disabled:opacity-50"
            >
              {saving ? "Sedang Menyimpan..." : "Simpan Maklumat"}
            </button>

            <p className="text-xs text-slate-500">
              Halaman ini hanya menyimpan nombor telefon.
              Pembayaran belum dilakukan.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
