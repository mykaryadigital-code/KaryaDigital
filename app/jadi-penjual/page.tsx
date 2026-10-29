
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

type Application = {
  status: "pending" | "approved" | "rejected";
  shop_name: string;
};

export default function JadiPenjualPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [application, setApplication] =
    useState<Application | null>(null);
  const [shopName, setShopName] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (authError || !authData.user) {
        setError("Sila log masuk dahulu untuk memohon.");
        setLoading(false);
        return;
      }

      setUserId(authData.user.id);

      const { data, error: queryError } = await supabase
        .from("seller_applications")
        .select("status, shop_name")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!active) return;

      if (queryError) {
        setError(queryError.message);
      } else {
        setApplication(data as Application | null);
      }

      setLoading(false);
    }

    load().catch(() => {
      if (active) {
        setError("Gagal memuatkan maklumat. Sila cuba lagi.");
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId || application) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    const { error: insertError } = await supabase
      .from("seller_applications")
      .insert({
        user_id: userId,
        shop_name: shopName.trim(),
        author_name: authorName.trim(),
        description: description.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setApplication({
        status: "pending",
        shop_name: shopName.trim(),
      });
      setMessage("Permohonan berjaya dihantar!");
    }

    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          KaryaDigital
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-gray-900">
          Jadi Penjual
        </h1>

        <p className="mt-2 text-gray-600">
          Buka kedai digital dan jual eBook karya anda.
        </p>

        {loading ? (
          <p className="mt-8 text-gray-500">Sedang memuatkan...</p>
        ) : (
          <>
            {error && (
              <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            )}

            {message && (
              <p className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                {message}
              </p>
            )}

            {application ? (
              <div className="mt-8 rounded-xl border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-900">
                  Permohonan Anda
                </h2>
                <p className="mt-3 text-gray-600">
                  Nama kedai: {application.shop_name}
                </p>
                <p className="mt-2 font-semibold text-indigo-600">
                  Status: {application.status}
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  {application.status === "pending"
                    ? "Permohonan sedang menunggu semakan admin."
                    : application.status === "approved"
                    ? "Permohonan anda telah diluluskan."
                    : "Permohonan anda telah ditolak."}
                </p>
              </div>
            ) : userId && !error ? (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
                    Nama Kedai
                  </label>
                  <input
                    id="shopName"
                    required
                    maxLength={100}
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Contoh: Karya Ilmu"
                    className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="authorName" className="block text-sm font-medium text-gray-700">
                    Nama Penulis
                  </label>
                  <input
                    id="authorName"
                    required
                    maxLength={100}
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Nama penulis atau nama pena"
                    className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Penerangan Kedai
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    maxLength={1000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ceritakan jenis eBook yang ingin dijual..."
                    className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Sedang menghantar..."
                    : "Hantar Permohonan"}
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="mt-6 inline-block font-semibold text-indigo-600"
              >
                Pergi ke Login
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  );
}
