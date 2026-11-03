
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type LibraryBook = {
  id: string;
  title: string;
};

type PurchasedItem = {
  ebook_id: string;
  ebooks: { title: string } | null;
};

type PaidOrder = {
  order_items: PurchasedItem[];
};

export default function PerpustakaanPage() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLibrary() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (authError || !user) {
          setLoggedIn(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from("orders")
          .select(`
            order_items (
              ebook_id,
              ebooks (
                title
              )
            )
          `)
          .eq("buyer_id", user.id)
          .eq("status", "paid");

        if (!active) return;

        if (queryError) {
          console.error(
            "Gagal memuatkan perpustakaan:",
            queryError
          );
          setError("Gagal mendapatkan senarai eBook.");
          return;
        }

        const orders = (data ?? []) as unknown as PaidOrder[];
        const uniqueBooks = new Map<string, LibraryBook>();

        for (const order of orders) {
          for (const item of order.order_items ?? []) {
            const title = item.ebooks?.title;

            if (item.ebook_id && title) {
              uniqueBooks.set(item.ebook_id, {
                id: item.ebook_id,
                title,
              });
            }
          }
        }

        setBooks(Array.from(uniqueBooks.values()));
      } catch {
        if (active) {
          setError("Ralat semasa memuatkan perpustakaan.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLibrary();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-semibold text-orange-600"
        >
          ← Kembali ke KaryaDigital
        </Link>

        <h1 className="mt-7 text-3xl font-bold text-gray-900">
          📚 Perpustakaan Saya
        </h1>

        <p className="mt-3 text-gray-600">
          Semua eBook yang telah anda beli boleh dibaca di sini.
        </p>

        {loading ? (
          <p className="mt-8 text-gray-500">
            Sedang memuatkan perpustakaan...
          </p>
        ) : !loggedIn ? (
          <div className="mt-8 rounded-xl bg-white p-8">
            <p>Sila log masuk untuk melihat perpustakaan.</p>
            <Link
              href="/login"
              className="mt-4 inline-block font-semibold text-orange-600"
            >
              Log Masuk
            </Link>
          </div>
        ) : error ? (
          <p className="mt-8 text-red-600">{error}</p>
        ) : books.length === 0 ? (
          <div className="mt-8 rounded-xl border bg-white p-8 text-center">
            <p className="text-gray-500">
              Anda belum mempunyai eBook yang telah dibayar.
            </p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white"
            >
              Terokai eBook
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <div
                key={book.id}
                className="rounded-xl border bg-white p-6 shadow-sm"
              >
                <div className="mb-4 text-4xl">📖</div>

                <h2 className="text-lg font-bold text-gray-900">
                  {book.title}
                </h2>

                <p className="mt-2 text-sm text-green-700">
                  Telah dibeli
                </p>

                <button
                  type="button"
                  disabled
                  className="mt-5 w-full cursor-not-allowed rounded-lg bg-gray-200 px-4 py-3 font-semibold text-gray-500"
                >
                  Baca eBook — Akan Datang
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
