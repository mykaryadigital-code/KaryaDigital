
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CircleDollarSign,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Send,
  ShoppingBag,
  Store,
  TrendingUp,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type EbookStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected";

type Ebook = {
  id: string;
  title: string;
  category: string;
  price: number;
  cover_path: string | null;
  status: EbookStatus;
  created_at: string;
};

const rm = (value: number) =>
  new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(value);

const statusLabels: Record<EbookStatus, string> = {
  draft: "Draf",
  pending: "Menunggu Semakan",
  approved: "Diluluskan",
  rejected: "Ditolak",
};

const statusStyles: Record<EbookStatus, string> = {
  draft: "bg-amber-100 text-amber-700",
  pending: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function SellerDashboard() {
  const [books, setBooks] = useState<Ebook[]>([]);
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
const [submittingId, setSubmittingId] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState("");


  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    async function loadBooks() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error(
            "Sesi login tamat. Sila login semula."
          );
        }

        const { data, error: queryError } =
          await supabase
            .from("ebooks")
            .select(
              "id, title, category, price, cover_path, status, created_at"
            )
            .eq("seller_id", user.id)
            .order("created_at", {
              ascending: false,
            });

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (active) {
          setBooks((data ?? []) as Ebook[]);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mendapatkan senarai eBook."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBooks();

    return () => {
      active = false;
    };
  }, [supabase]);

  const filtered = useMemo(
    () =>
      books.filter((book) =>
        `${book.title} ${book.category}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [books, search]
  );

  const approvedCount = books.filter(
    (book) => book.status === "approved"
  ).length;

async function submitForReview(ebookId: string) {
  if (submittingId) return;

  const confirmed = window.confirm(
    "Hantar eBook ini untuk semakan Super Admin?"
  );

  if (!confirmed) return;

  setSubmittingId(ebookId);
  setError("");
  setSuccessMessage("");

  try {
    const { error: submitError } = await supabase.rpc(
      "submit_ebook_for_review",
      { p_ebook_id: ebookId }
    );

    if (submitError) {
      throw new Error(submitError.message);
    }

    const { data: updatedBook, error: refreshError } =
      await supabase
        .from("ebooks")
        .select(
          "id, title, category, price, cover_path, status, created_at"
        )
        .eq("id", ebookId)
        .single();

    if (refreshError || !updatedBook) {
      throw new Error(
        "eBook telah dihantar. Sila refresh dashboard untuk melihat status terkini."
      );
    }

    setBooks((current) =>
      current.map((book) =>
        book.id === ebookId
          ? (updatedBook as Ebook)
          : book
      )
    );

    setSuccessMessage(
      "eBook berjaya dihantar untuk semakan Super Admin."
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Gagal menghantar eBook."
    );
  } finally {
    setSubmittingId(null);
  }
}

  function getCoverUrl(path: string | null) {
    if (!path) return null;

    const { data } = supabase.storage
      .from("ebook-covers")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  const stats = [
    {
      label: "Jumlah Jualan",
      value: rm(0),
      icon: CircleDollarSign,
    },
    {
      label: "eBook Terjual",
      value: "0",
      icon: ShoppingBag,
    },
    {
      label: "Jumlah eBook",
      value: String(books.length),
      icon: BookOpen,
    },
    {
      label: "eBook Diluluskan",
      value: String(approvedCount),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        {/* SIDEBAR */}
        <aside
          className={`${
            mobileMenu ? "block" : "hidden"
          } fixed inset-y-0 left-0 z-30 w-64 border-r bg-white p-5 shadow-lg md:static md:block md:shadow-none`}
        >
          <div className="mb-10 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-extrabold text-indigo-700"
            >
              <BookOpen />
              KaryaDigital
            </Link>

            <button
              className="md:hidden"
              onClick={() => setMobileMenu(false)}
              aria-label="Tutup menu"
            >
              <X />
            </button>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Panel Penjual
          </p>

          <nav className="space-y-2 text-sm font-medium">
            <Link
              href="/penjual/dashboard"
              className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-indigo-700"
            >
              <LayoutDashboard size={19} />
              Dashboard
            </Link>

            <a
              href="#ebook"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-100"
            >
              <BookOpen size={19} />
              eBook Saya
            </a>

            <a
              href="#jualan"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-100"
            >
              <ShoppingBag size={19} />
              Jualan
            </a>

            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-100"
            >
              <Store size={19} />
              Lihat Marketplace
            </Link>
          </nav>

          <div className="mt-10 rounded-xl bg-indigo-50 p-4 text-xs leading-relaxed text-indigo-900">
            <strong>Disambungkan ke Supabase</strong>
            <p className="mt-1">
              Senarai eBook diambil daripada database
              KaryaDigital. Statistik jualan akan
              diaktifkan selepas sistem pembelian siap.
            </p>
          </div>
        </aside>

        {mobileMenu && (
          <button
            aria-label="Tutup menu"
            className="fixed inset-0 z-20 bg-black/30 md:hidden"
            onClick={() => setMobileMenu(false)}
          />
        )}

        {/* KANDUNGAN DASHBOARD */}
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-8 sm:py-8">
          <header className="mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenu(true)}
                aria-label="Buka menu"
                className="rounded-lg border bg-white p-2 md:hidden"
              >
                <Menu />
              </button>

              <div>
                <p className="text-sm text-slate-500">
                  Panel Penjual / Dashboard
                </p>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Selamat datang, Penjual 👋
                </h1>
              </div>
            </div>

            <Link
              href="/penjual/ebook/tambah"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-700 sm:px-5"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">
                Tambah eBook
              </span>
              <span className="sm:hidden">Tambah</span>
            </Link>
          </header>

          {/* STATISTIK */}
          <section
            id="jualan"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
              >
                <stat.icon
                  className="mb-4 text-indigo-600"
                  size={24}
                />

                <p className="text-xl font-extrabold sm:text-2xl">
                  {loading ? "..." : stat.value}
                </p>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </section>

          {/* SENARAI EBOOK */}
          <section
            id="ebook"
            className="mt-8 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold">
                  eBook Saya
                </h2>

                <p className="text-sm text-slate-500">
                  Urus senarai eBook kedai anda
                </p>
              </div>

              <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-slate-500">
                <Search size={18} />

                <input
                  className="w-full bg-transparent text-sm outline-none sm:w-52"
                  placeholder="Cari eBook..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  aria-label="Cari eBook"
                />
              </label>
            </div>

            {successMessage && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
            >
                {successMessage}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3 font-medium">
                      eBook
                    </th>
                    <th className="py-3 font-medium">
                      Kategori
                    </th>
                    <th className="py-3 font-medium">
                      Harga
                    </th>
                    <th className="py-3 font-medium">
                      Status
                    </th>
                    <th className="py-3 font-medium">
                      Tarikh
                    </th>
                    <th className="py-3 font-medium">
                      Tindakan
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {filtered.map((book) => {
                    const coverUrl = getCoverUrl(
                      book.cover_path
                    );

                    return (
                      <tr
                        key={book.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {coverUrl ? (
                              <img
                                src={coverUrl}
                                alt={`Kulit ${book.title}`}
                                className="h-16 w-12 rounded-md border object-cover"
                              />
                            ) : (
                              <div className="flex h-16 w-12 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                                <BookOpen size={22} />
                              </div>
                            )}

                            <span className="font-semibold">
                              {book.title}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 text-slate-600">
                          {book.category}
                        </td>

                        <td className="py-4">
                          {rm(Number(book.price))}
                        </td>

                        <td className="py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              statusStyles[book.status] ??
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {statusLabels[book.status] ??
                              book.status}
                          </span>
                        </td>

                        <td className="py-4 text-slate-500">
                          {new Date(
                            book.created_at
                          ).toLocaleDateString("ms-MY")}
                        </td>

                        <td className="py-4">
                          {book.status === "draft" && (
                            <button
                              onClick={() => submitForReview(book.id)}
                              disabled={submittingId === book.id}
                              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                            >
                              {submittingId === book.id
                                ? "Menghantar..."
                                : "Hantar untuk Semakan"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {loading && (
                <p className="py-8 text-center text-slate-500">
                  Sedang memuatkan eBook...
                </p>
              )}

              {!loading &&
                !error &&
                filtered.length === 0 && (
                  <div className="py-10 text-center">
                    <BookOpen
                      className="mx-auto mb-3 text-slate-300"
                      size={40}
                    />

                    <p className="font-semibold text-slate-700">
                      {search
                        ? "Tiada eBook sepadan dengan carian."
                        : "Belum ada eBook."}
                    </p>

                    {!search && (
                      <Link
                        href="/penjual/ebook/tambah"
                        className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline"
                      >
                        + Tambah eBook pertama
                      </Link>
                    )}
                  </div>
                )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
